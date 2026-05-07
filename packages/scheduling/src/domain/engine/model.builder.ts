import {
  RuleConditionOperatorValues,
  RuleMetricValues,
  RuleOperator,
  RuleOperatorValues,
  RuleTargetValues,
  RuleTimeWindow,
  RuleTimeWindowValues,
} from '@fuku/domain/schemas'

import {
  addDays,
  getDaysBetweenInclusive,
  getMinutesBetweenTimes,
  getMonth,
  getWeekday,
  timeToMinutes,
} from '../../shared/utils/date'
import { Rule, SchedulerContext, ShiftType, TeamMember } from '../types'
import {
  CoefficientMap,
  Operator,
  OptimizationModel,
} from './optimization.model'
import { getAssignmentVariableName, VariableBuilder } from './variable.builder'

const DEBUG = true
const log = (...args: any[]) => {
  if (DEBUG) console.log(...args)
}

type MetricExpression = {
  coefficients: CoefficientMap
  adjustRhs?: (rhs: number) => number
  flipOperator?: boolean
}

export class ConstraintModelBuilder {
  private payGradeToShiftTypesMap: Map<string, Set<string>>
  private numDays: number

  constructor(private ctx: SchedulerContext) {
    this.payGradeToShiftTypesMap = new Map()
    this.numDays = this.getNumDays()
  }

  build(): OptimizationModel {
    const model: OptimizationModel = {
      variables: [],
      constraints: [],
      objective: { sense: 'minimize', terms: [] },
    }

    // precompute maps for efficient constraint building
    this.buildPayGradeShiftTypeMap()

    // build variables
    this.buildDecisionVariables(model)

    // build constraints
    this.addEligibilityConstraints(model)
    this.addAvailabilityConstraints(model)
    this.addMaxOneShiftTypePerDayConstraints(model)
    this.addStaffingRequirementsConstraints(model)
    this.addShiftTypeAllowedWeekdaysConstraints(model)
    this.addRuleConstraints(model)
    this.addOperationalCoverageConstraints(model)

    // build objective terms
    this.addBalanceWorkloadObjective(model)
    this.addMinimizeShiftTypeChangesObjective(model)
    this.addSoftMaxShiftTypePerDayObjective(model)
    this.addFairShiftTypeDistributionObjective(model)

    log('\n================ MODEL SUMMARY ================')
    log('teamMembers:', this.ctx.teamMembers.length)
    log('shiftTypes:', this.ctx.shiftTypes.length)
    log('days:', this.numDays)
    log('rules:', this.ctx.rules.length)
    log('holidays:', this.ctx.holidays.size)
    log('=============================================\n')

    return model
  }

  // ------ Variables ------
  private buildDecisionVariables(model: OptimizationModel) {
    const variableBuilder = new VariableBuilder(model)

    let count = 0

    for (const tm of this.ctx.teamMembers) {
      for (let dayIndex = 0; dayIndex < this.numDays; dayIndex++) {
        for (const st of this.ctx.shiftTypes) {
          const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)
          variableBuilder.addVariable(varName, 'binary')
          count++
        }
      }
    }

    log('[VAR] total decision variables:', count)
  }

  // ------ Constraints (Hard) -------
  private addEligibilityConstraints(model: OptimizationModel) {
    let forbidden = 0

    for (const tm of this.ctx.teamMembers) {
      if (!tm.payGradeId) continue

      const payGradeShiftTypes = this.payGradeToShiftTypesMap.get(tm.payGradeId)

      if (!payGradeShiftTypes || payGradeShiftTypes.size === 0) {
        log('[ELIGIBILITY] WARNING: member has NO eligible shift types', tm.id)
      }

      for (const st of this.ctx.shiftTypes) {
        const isEligible = payGradeShiftTypes?.has(st.id) || false

        if (!isEligible) {
          forbidden++

          for (let dayIndex = 0; dayIndex < this.numDays; dayIndex++) {
            const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)

            model.constraints.push({
              name: `eligibility__${tm.id}__${dayIndex}__${st.id}`,
              coefficients: { [varName]: 1 },
              operator: '==',
              rhs: 0,
            })
          }
        }
      }
    }

    log('[ELIGIBILITY] forbidden assignments:', forbidden)
  }

  private addAvailabilityConstraints(model: OptimizationModel) {
    const PENALTY = 1000 // very high penalty for violating availability

    for (const tm of this.ctx.teamMembers) {
      const unavailabilities = new Set(
        this.ctx.unavailabilities
          .filter(u => u.teamMemberId === tm.id)
          .map(u => u.date),
      )

      for (let dayIndex = 0; dayIndex < this.numDays; dayIndex++) {
        const currentDate = addDays(this.ctx.period.start, dayIndex)

        if (!unavailabilities.has(currentDate)) continue

        for (const st of this.ctx.shiftTypes) {
          const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)
          const violationVar = `availabilityViolation__${tm.id}__${dayIndex}__${st.id}`

          // add violation variable
          model.variables.push({ name: violationVar, type: 'integer', min: 0 })

          // constraint: x <= violationVar
          model.constraints.push({
            name: `availabilitySoft__${tm.id}__${dayIndex}__${st.id}`,
            coefficients: { [varName]: 1, [violationVar]: -1 },
            operator: '<=',
            rhs: 0,
          })

          // add to objective with high penalty
          model.objective!.terms.push({
            variable: violationVar,
            coefficient: PENALTY,
          })
        }
      }
    }
  }

  private addMaxOneShiftTypePerDayConstraints(model: OptimizationModel) {
    for (const tm of this.ctx.teamMembers) {
      for (let dayIndex = 0; dayIndex < this.numDays; dayIndex++) {
        const coefficients: Record<string, number> = {}
        for (const st of this.ctx.shiftTypes) {
          const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)
          coefficients[varName] = 1
        }
        // enforce at most one shift assignment per member per day
        model.constraints.push({
          name: `maxOneShiftPerDay__${tm.id}__${dayIndex}`,
          coefficients,
          operator: '<=',
          rhs: 1,
        })
      }
    }
  }

  private addStaffingRequirementsConstraints(model: OptimizationModel) {
    for (let dayIndex = 0; dayIndex < this.numDays; dayIndex++) {
      const coefficients: Record<string, number> = {}
      const day = addDays(this.ctx.period.start, dayIndex)

      const staffingRequirement = this.ctx.staffingRequirements[getWeekday(day)]

      if (!staffingRequirement) {
        log('[STAFFING] MISSING requirement for weekday:', getWeekday(day))
        continue
      }

      for (const tm of this.ctx.teamMembers) {
        for (const st of this.ctx.shiftTypes) {
          const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)
          coefficients[varName] = 1
        }
      }

      log('[STAFFING]', day, staffingRequirement)

      model.constraints.push({
        name: `minMembersPerDay__${dayIndex}`,
        coefficients,
        operator: '>=',
        rhs: staffingRequirement.minMembers,
      })

      model.constraints.push({
        name: `maxMembersPerDay__${dayIndex}`,
        coefficients,
        operator: '<=',
        rhs: staffingRequirement.maxMembers,
      })
    }
  }

  private addShiftTypeAllowedWeekdaysConstraints(model: OptimizationModel) {
    for (const st of this.ctx.shiftTypes) {
      if (!st.allowedWeekdays || st.allowedWeekdays.length === 0) continue
      const allowedWeekdays = new Set(st.allowedWeekdays)

      for (let dayIndex = 0; dayIndex < this.numDays; dayIndex++) {
        const day = addDays(this.ctx.period.start, dayIndex)
        const weekday = getWeekday(day)
        if (!allowedWeekdays.has(weekday)) {
          for (const tm of this.ctx.teamMembers) {
            const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)
            // forbid shift type assignment on disallowed weekday
            model.constraints.push({
              name: `shiftTypeAllowedWeekdays__${tm.id}__${dayIndex}__${st.id}`,
              coefficients: { [varName]: 1 },
              operator: '==',
              rhs: 0,
            })
          }
        }
      }
    }
  }

  private addRuleConstraints(model: OptimizationModel) {
    for (const rule of this.ctx.rules) {
      // =========================================================
      // 1. CONSECUTIVE DAYS WORKED
      // =========================================================
      if (rule.metric === RuleMetricValues.CONSECUTIVE_DAYS_WORKED) {
        const windowLength = rule.threshold + 1

        for (const tm of this.ctx.teamMembers) {
          if (!this.isRuleTargetMember(rule, tm)) continue

          const shiftTypes = this.getRelevantShiftTypes(rule)

          for (
            let startDay = 0;
            startDay <= this.numDays - windowLength;
            startDay++
          ) {
            const windowDays: number[] = []

            for (let d = startDay; d < startDay + windowLength; d++) {
              if (!this.hasValidConditions(rule, d)) continue
              windowDays.push(d)
            }

            if (windowDays.length !== windowLength) continue

            const coefficients: CoefficientMap = {}

            for (const d of windowDays) {
              for (const st of shiftTypes) {
                const varName = getAssignmentVariableName(tm.id, d, st.id)
                coefficients[varName] = (coefficients[varName] ?? 0) + 1
              }
            }

            this.addRuleConstraint(
              model,
              rule,
              `rule__${rule.id}__consec__${tm.id}__${startDay}`,
              coefficients,
              this.getOperatorForRule(rule.operator),
              rule.threshold,
            )
          }
        }

        continue
      }

      // =========================================================
      // 2. UNIQUE MEMBERS ASSIGNED
      // =========================================================
      if (rule.metric === RuleMetricValues.UNIQUE_MEMBERS_ASSIGNED) {
        const windows =
          rule.timeWindow === RuleTimeWindowValues.MONTH
            ? [this.getDaysForRuleTimeWindow(rule.timeWindow, 0)]
            : Array.from({ length: this.numDays }, (_, i) =>
                this.getDaysForRuleTimeWindow(rule.timeWindow, i),
              )

        windows.forEach((dayIndices, windowIndex) => {
          const validDays = this.getValidDays(rule, dayIndices)
          if (validDays.length === 0) return

          const shiftTypes = this.getRelevantShiftTypes(rule)
          const auxVariables: string[] = []

          for (const tm of this.ctx.teamMembers) {
            if (!this.isRuleTargetMember(rule, tm)) continue

            const auxVarName = `uniqueMember__${rule.id}__${tm.id}__${windowIndex}`
            auxVariables.push(auxVarName)

            model.variables.push({ name: auxVarName, type: 'binary' })

            // forward: y >= x
            for (const d of validDays) {
              for (const st of shiftTypes) {
                const shiftVar = getAssignmentVariableName(tm.id, d, st.id)

                this.addRuleConstraint(
                  model,
                  rule,
                  `link_${auxVarName}__${shiftVar}`,
                  { [auxVarName]: 1, [shiftVar]: -1 },
                  '>=',
                  0,
                )
              }
            }

            // reverse: y <= sum(x)
            const reverse: CoefficientMap = { [auxVarName]: 1 }

            for (const d of validDays) {
              for (const st of shiftTypes) {
                const shiftVar = getAssignmentVariableName(tm.id, d, st.id)
                reverse[shiftVar] = (reverse[shiftVar] ?? 0) - 1
              }
            }

            this.addRuleConstraint(
              model,
              rule,
              `reverse_${auxVarName}`,
              reverse,
              '<=',
              0,
            )
          }

          const windowCoefficients: CoefficientMap = {}
          for (const aux of auxVariables) {
            windowCoefficients[aux] = 1
          }

          this.addRuleConstraint(
            model,
            rule,
            `rule__${rule.id}__unique__${windowIndex}`,
            windowCoefficients,
            this.getOperatorForRule(rule.operator),
            rule.threshold,
          )
        })

        continue
      }

      // =========================================================
      // 3. GENERIC METRICS (DAYS_WORKED, HOURS_WORKED, DAYS_OFF)
      // =========================================================
      const windows =
        rule.timeWindow === RuleTimeWindowValues.MONTH
          ? [this.getDaysForRuleTimeWindow(rule.timeWindow, 0)]
          : Array.from({ length: this.numDays }, (_, i) =>
              this.getDaysForRuleTimeWindow(rule.timeWindow, i),
            )

      let windowIndex = 0

      for (const dayIndices of windows) {
        const validDays = this.getValidDays(rule, dayIndices)
        if (validDays.length === 0) continue

        for (const tm of this.ctx.teamMembers) {
          if (!this.isRuleTargetMember(rule, tm)) continue

          const { coefficients, adjustRhs, flipOperator } =
            this.computeMetricExpression(rule, tm.id, validDays)

          const operator = flipOperator
            ? this.flipOperator(this.getOperatorForRule(rule.operator))
            : this.getOperatorForRule(rule.operator)

          const rhs = adjustRhs ? adjustRhs(rule.threshold) : rule.threshold

          this.addRuleConstraint(
            model,
            rule,
            `rule__${rule.id}__${tm.id}__${windowIndex}`,
            coefficients,
            operator,
            rhs,
          )

          windowIndex++
        }
      }
    }
  }

  private addOperationalCoverageConstraints(model: OptimizationModel) {
    const slotSizeMinutes = 15

    for (let dayIndex = 0; dayIndex < this.numDays; dayIndex++) {
      const day = addDays(this.ctx.period.start, dayIndex)
      const weekday = getWeekday(day)

      const operationalHours = this.ctx.operationalHours[weekday]

      if (!operationalHours) {
        log('[COVERAGE] no operational hours for weekday:', weekday)
        continue
      }

      const opStartMinutes = timeToMinutes(operationalHours.startTime)
      const opEndMinutes = timeToMinutes(operationalHours.endTime)

      const totalMinutes = opEndMinutes - opStartMinutes
      const totalSlots = Math.ceil(totalMinutes / slotSizeMinutes)

      log('[COVERAGE]', day, 'slots:', totalSlots)

      for (let slotIndex = 0; slotIndex < totalSlots; slotIndex++) {
        const slotStartMinutes = opStartMinutes + slotIndex * slotSizeMinutes
        const slotEndMinutes = slotStartMinutes + slotSizeMinutes

        const coefficients: CoefficientMap = {}

        for (const tm of this.ctx.teamMembers) {
          for (const st of this.ctx.shiftTypes) {
            const shiftStart = timeToMinutes(st.startTime)
            const shiftEnd = timeToMinutes(st.endTime)

            if (shiftStart <= slotStartMinutes && shiftEnd >= slotEndMinutes) {
              const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)
              coefficients[varName] = 1
            }
          }
        }

        if (Object.keys(coefficients).length === 0) {
          log(
            '[COVERAGE][WARNING] NO VARIABLES COVER SLOT',
            day,
            slotIndex,
            slotStartMinutes,
            '-',
            slotEndMinutes,
          )
        }

        model.constraints.push({
          name: `coverage__${dayIndex}__${slotIndex}`,
          coefficients,
          operator: '>=',
          rhs: 1,
        })
      }
    }
  }

  // ------ Objective Terms (Soft) ------
  private addBalanceWorkloadObjective(model: OptimizationModel) {
    if (this.ctx.teamMembers.length === 0) return

    const maxShiftMinutes = Math.max(
      ...this.ctx.shiftTypes.map(st =>
        getMinutesBetweenTimes(st.startTime, st.endTime),
      ),
    )
    const maxPossibleMinutes = this.numDays * maxShiftMinutes
    const memberHourVars: string[] = []

    for (const tm of this.ctx.teamMembers) {
      const memberHoursVar = `memberHours_${tm.id}`
      memberHourVars.push(memberHoursVar)
      model.variables.push({
        name: memberHoursVar,
        type: 'integer',
        min: 0,
        max: maxPossibleMinutes,
      })

      const coefficients: CoefficientMap = { [memberHoursVar]: -1 }
      for (let dayIndex = 0; dayIndex < this.numDays; dayIndex++) {
        for (const st of this.ctx.shiftTypes) {
          const assignmentVar = getAssignmentVariableName(
            tm.id,
            dayIndex,
            st.id,
          )
          const shiftMinutes = getMinutesBetweenTimes(st.startTime, st.endTime)
          coefficients[assignmentVar] = shiftMinutes
        }
      }

      // define memberHours variable from assignments
      model.constraints.push({
        name: `define_memberHours_${tm.id}`,
        coefficients,
        operator: '==',
        rhs: 0,
      })
    }

    const maxHoursVar = 'balance_maxHours'
    const minHoursVar = 'balance_minHours'
    model.variables.push({
      name: maxHoursVar,
      type: 'integer',
      min: 0,
      max: maxPossibleMinutes,
    })
    model.variables.push({
      name: minHoursVar,
      type: 'integer',
      min: 0,
      max: maxPossibleMinutes,
    })

    for (const tm of this.ctx.teamMembers) {
      const memberHoursVar = `memberHours_${tm.id}`

      // bind upper workload bound
      model.constraints.push({
        name: `balance_upper_${tm.id}`,
        coefficients: { [memberHoursVar]: 1, [maxHoursVar]: -1 },
        operator: '<=',
        rhs: 0,
      })

      // bind lower workload bound
      model.constraints.push({
        name: `balance_lower_${tm.id}`,
        coefficients: { [memberHoursVar]: 1, [minHoursVar]: -1 },
        operator: '>=',
        rhs: 0,
      })
    }

    // maximize minHours to raise lowest workload
    model.objective!.terms.push({ variable: minHoursVar, coefficient: -0.8 })
    // minimize maxHours
    model.objective!.terms.push({ variable: maxHoursVar, coefficient: 0.8 })
  }

  private addMinimizeShiftTypeChangesObjective(model: OptimizationModel) {
    const auxVariables: string[] = []

    for (const tm of this.ctx.teamMembers) {
      for (let dayIndex = 0; dayIndex < this.numDays - 1; dayIndex++) {
        const auxVarName = `shiftChange__${tm.id}__${dayIndex}`
        auxVariables.push(auxVarName)
        model.variables.push({ name: auxVarName, type: 'binary' })

        for (let i = 0; i < this.ctx.shiftTypes.length; i++) {
          for (let j = 0; j < this.ctx.shiftTypes.length; j++) {
            if (i === j) continue

            const shift1 = this.ctx.shiftTypes[i]
            const shift2 = this.ctx.shiftTypes[j]

            const varDay1 = getAssignmentVariableName(
              tm.id,
              dayIndex,
              shift1.id,
            )
            const varDay2 = getAssignmentVariableName(
              tm.id,
              dayIndex + 1,
              shift2.id,
            )

            // activate shiftChange when different shift types on consecutive days
            model.constraints.push({
              name: `shiftChange__${tm.id}__${dayIndex}__${shift1.id}__${shift2.id}`,
              coefficients: { [auxVarName]: 1, [varDay1]: -1, [varDay2]: -1 },
              operator: '>=',
              rhs: -1,
            })
          }
        }
      }
    }

    for (const auxVar of auxVariables) {
      // penalize shift changes by reducing objective score
      model.objective!.terms.push({ variable: auxVar, coefficient: -0.2 })
    }
  }

  private addSoftMaxShiftTypePerDayObjective(model: OptimizationModel) {
    for (let dayIndex = 0; dayIndex < this.numDays; dayIndex++) {
      for (const st of this.ctx.shiftTypes) {
        const target = 2
        const excessVar = `excessShiftType__${st.id}__${dayIndex}`
        model.variables.push({ name: excessVar, type: 'integer', min: 0 })

        const coefficients: CoefficientMap = { [excessVar]: -1 }
        for (const tm of this.ctx.teamMembers) {
          const assignmentVar = getAssignmentVariableName(
            tm.id,
            dayIndex,
            st.id,
          )
          coefficients[assignmentVar] = 1
        }

        // bound shift type assignments per day using excess slack
        model.constraints.push({
          name: `softMaxShiftType__${st.id}__${dayIndex}`,
          coefficients,
          operator: '<=',
          rhs: target,
        })

        // penalize excess assignments above target
        model.objective!.terms.push({ variable: excessVar, coefficient: 0.5 })
      }
    }
  }

  private addFairShiftTypeDistributionObjective(model: OptimizationModel) {
    const payGradeMembers = new Map<string, TeamMember[]>()

    // group members by pay grade
    for (const tm of this.ctx.teamMembers) {
      if (!tm.payGradeId) continue
      if (!payGradeMembers.has(tm.payGradeId))
        payGradeMembers.set(tm.payGradeId, [])
      payGradeMembers.get(tm.payGradeId)!.push(tm)
    }

    for (const [payGradeId, members] of payGradeMembers.entries()) {
      if (members.length <= 1) continue

      for (const st of this.ctx.shiftTypes) {
        const maxVar = `fair_max_${payGradeId}_${st.id}`
        const minVar = `fair_min_${payGradeId}_${st.id}`

        model.variables.push({ name: maxVar, type: 'integer', min: 0 })
        model.variables.push({ name: minVar, type: 'integer', min: 0 })

        for (const tm of members) {
          const countVar = `count_${tm.id}_${st.id}`
          model.variables.push({
            name: countVar,
            type: 'integer',
            min: 0,
            max: this.numDays,
          })

          const coefficients: CoefficientMap = { [countVar]: -1 }
          for (let dayIndex = 0; dayIndex < this.numDays; dayIndex++) {
            const assignmentVar = getAssignmentVariableName(
              tm.id,
              dayIndex,
              st.id,
            )
            coefficients[assignmentVar] = 1
          }

          // define shift-type count for member
          model.constraints.push({
            name: `define_${countVar}`,
            coefficients,
            operator: '==',
            rhs: 0,
          })

          // bind to max
          model.constraints.push({
            name: `fair_upper_${tm.id}_${st.id}`,
            coefficients: { [countVar]: 1, [maxVar]: -1 },
            operator: '<=',
            rhs: 0,
          })

          // bind to min
          model.constraints.push({
            name: `fair_lower_${tm.id}_${st.id}`,
            coefficients: { [countVar]: 1, [minVar]: -1 },
            operator: '>=',
            rhs: 0,
          })
        }

        // minimize spread
        model.objective!.terms.push({ variable: maxVar, coefficient: 1.5 })
        model.objective!.terms.push({ variable: minVar, coefficient: -1.5 })
      }
    }
  }

  // ------ Helpers ------
  private getNumDays(): number {
    return getDaysBetweenInclusive(this.ctx.period.start, this.ctx.period.end)
  }

  private buildPayGradeShiftTypeMap() {
    for (const pgst of this.ctx.payGradeShiftTypes) {
      if (!this.payGradeToShiftTypesMap.has(pgst.payGradeId)) {
        this.payGradeToShiftTypesMap.set(pgst.payGradeId, new Set())
      }
      this.payGradeToShiftTypesMap.get(pgst.payGradeId)!.add(pgst.shiftTypeId)
    }
  }

  private getOperatorForRule(operator: RuleOperator): Operator {
    return operator === RuleOperatorValues.MAX ? '<=' : '>='
  }

  private computeMetricExpression(
    rule: Rule,
    teamMemberId: string,
    dayIndices: number[],
  ): {
    coefficients: CoefficientMap
    adjustRhs?: (rhs: number) => number
    flipOperator?: boolean
  } {
    const coefficients: CoefficientMap = {}
    const validDays = this.getValidDays(rule, dayIndices)
    const shiftTypes = this.getRelevantShiftTypes(rule)

    let adjustRhs: ((rhs: number) => number) | undefined
    let flipOperator = false

    switch (rule.metric) {
      case RuleMetricValues.DAYS_WORKED: {
        for (const d of validDays) {
          for (const st of shiftTypes) {
            const varName = getAssignmentVariableName(teamMemberId, d, st.id)
            coefficients[varName] = (coefficients[varName] ?? 0) + 1
          }
        }
        break
      }

      case RuleMetricValues.HOURS_WORKED: {
        for (const d of validDays) {
          for (const st of shiftTypes) {
            const varName = getAssignmentVariableName(teamMemberId, d, st.id)
            coefficients[varName] =
              getMinutesBetweenTimes(st.startTime, st.endTime) / 60
          }
        }
        break
      }

      case RuleMetricValues.DAYS_OFF: {
        for (const d of validDays) {
          for (const st of shiftTypes) {
            const varName = getAssignmentVariableName(teamMemberId, d, st.id)
            coefficients[varName] = (coefficients[varName] ?? 0) + 1
          }
        }

        // DAYS_OFF = validDays - DAYS_WORKED
        adjustRhs = (rhs: number) => validDays.length - rhs
        flipOperator = true
        break
      }

      default:
        throw new Error(`Unsupported metric: ${rule.metric}`)
    }

    return { coefficients, adjustRhs, flipOperator }
  }

  private getDaysForRuleTimeWindow(
    timeWindow: RuleTimeWindow,
    startDayIndex: number,
  ): number[] {
    const currentDay = addDays(this.ctx.period.start, startDayIndex)
    const currentDate = new Date(currentDay)

    const minDayIndex = 0
    const maxDayIndex = this.numDays - 1
    const days: number[] = []
    const daysInWeek = 7
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    ).getDate()

    const forwardEndIndex =
      startDayIndex +
      (timeWindow === RuleTimeWindowValues.MONTH ? daysInMonth : daysInWeek) -
      1
    const backwardStartIndex =
      startDayIndex -
      (timeWindow === RuleTimeWindowValues.MONTH ? daysInMonth : daysInWeek) +
      1

    switch (timeWindow) {
      case RuleTimeWindowValues.DAY: {
        days.push(startDayIndex)
        break
      }
      case RuleTimeWindowValues.WEEK:
      case RuleTimeWindowValues.MONTH: {
        const end = Math.min(forwardEndIndex, maxDayIndex)
        for (let d = startDayIndex; d <= end; d++) days.push(d)
        break
      }
      case RuleTimeWindowValues.ROLLING_WEEK:
      case RuleTimeWindowValues.ROLLING_MONTH: {
        const start = Math.max(backwardStartIndex, minDayIndex)
        for (let d = start; d <= startDayIndex; d++) days.push(d)
        break
      }
    }

    return days
  }

  private flipOperator(operator: Operator): Operator {
    switch (operator) {
      case '<=':
        return '>='
      case '>=':
        return '<='
      default:
        return operator
    }
  }

  private isRuleTargetMember(rule: Rule, teamMember: TeamMember) {
    if (rule.target === 'GLOBAL') return true
    if (rule.target === 'PAY_GRADE')
      return teamMember.payGradeId === rule.payGradeId
    if (rule.target === 'SHIFT_TYPE') {
      const eligibleShiftTypes = this.payGradeToShiftTypesMap.get(
        teamMember.payGradeId!,
      )
      return eligibleShiftTypes?.has(rule.shiftTypeId!) ?? false
    }
    if (rule.target === 'TEAM_MEMBER')
      return teamMember.id === rule.teamMemberId
    return false
  }

  private getValidDays(rule: Rule, dayIndices: number[]): number[] {
    const days = dayIndices.filter(d => this.hasValidConditions(rule, d))

    log('\n[RULE]', rule.id)
    log(' metric:', rule.metric)
    log(' operator:', rule.operator)
    log(' threshold:', rule.threshold)
    log(' input days:', dayIndices)
    log(' valid days:', days)

    return days
  }

  private getRelevantShiftTypes(rule: Rule): ShiftType[] {
    if (rule.target === RuleTargetValues.SHIFT_TYPE && rule.shiftTypeId) {
      return this.ctx.shiftTypes.filter(st => st.id === rule.shiftTypeId)
    }
    return this.ctx.shiftTypes
  }

  private hasValidConditions(rule: Rule, dayIndex: number): boolean {
    if (!rule.ruleConditions?.length) return true

    const day = addDays(this.ctx.period.start, dayIndex)
    const month = getMonth(day)
    const weekday = getWeekday(day)

    for (const cond of rule.ruleConditions) {
      let intValue: number | undefined
      let intSetValue: Set<number> | undefined

      if (typeof cond.value === 'number') intValue = cond.value
      if (this.isIntArray(cond.value)) intSetValue = new Set(cond.value)

      switch (cond.field) {
        case 'MONTH': {
          if (intValue) {
            switch (cond.operator) {
              case RuleConditionOperatorValues.EQ:
                if (month !== intValue) return false
                break
              case RuleConditionOperatorValues.NEQ:
                if (month === intValue) return false
                break
              case RuleConditionOperatorValues.GTE:
                if (month < intValue) return false
                break
              case RuleConditionOperatorValues.LTE:
                if (month > intValue) return false
                break
              default:
                return false
            }
          }
          if (intSetValue) {
            switch (cond.operator) {
              case RuleConditionOperatorValues.IN:
                if (!intSetValue.has(month)) return false
                break
              case RuleConditionOperatorValues.NOT_IN:
                if (intSetValue.has(month)) return false
                break
              default:
                return false
            }
          }
          break
        }
        case 'WEEKDAY': {
          if (intValue) {
            switch (cond.operator) {
              case RuleConditionOperatorValues.EQ:
                if (weekday !== intValue) return false
                break
              case RuleConditionOperatorValues.NEQ:
                if (weekday === intValue) return false
                break
              case RuleConditionOperatorValues.GTE:
                if (weekday < intValue) return false
                break
              case RuleConditionOperatorValues.LTE:
                if (weekday > intValue) return false
                break
              default:
                return false
            }
          }
          if (intSetValue) {
            switch (cond.operator) {
              case RuleConditionOperatorValues.IN:
                if (!intSetValue.has(weekday)) return false
                break
              case RuleConditionOperatorValues.NOT_IN:
                if (intSetValue.has(weekday)) return false
                break
              default:
                return false
            }
          }
          break
        }
        case 'IS_HOLIDAY': {
          const isHoliday = this.ctx.holidays.has(day)

          if (typeof cond.value !== 'boolean') return false

          switch (cond.operator) {
            case RuleConditionOperatorValues.EQ:
              console.log(day, 'holiday EQ', cond.value, '->', isHoliday)
              if (isHoliday !== cond.value) return false
              break
            case RuleConditionOperatorValues.NEQ:
              if (isHoliday === cond.value) return false
              break
            default:
              return false
          }

          break
        }
      }
    }

    return true
  }

  private isIntArray(value: any): value is number[] {
    return (
      Array.isArray(value) &&
      value.every(v => typeof v === 'number' && Number.isInteger(v))
    )
  }

  private addRuleConstraint(
    model: OptimizationModel,
    rule: Rule,
    name: string,
    coefficients: CoefficientMap,
    operator: Operator,
    rhs: number,
  ) {
    if (rule.hardConstraint) {
      model.constraints.push({ name, coefficients, operator, rhs })
      return
    }

    const violationVar = `${name}__violation`
    model.variables.push({ name: violationVar, type: 'integer', min: 0 })

    const newCoefficients: CoefficientMap = { ...coefficients }
    if (operator === '<=') newCoefficients[violationVar] = -1
    if (operator === '>=') newCoefficients[violationVar] = 1

    model.constraints.push({
      name,
      coefficients: newCoefficients,
      operator,
      rhs,
    })
    model.objective!.terms.push({
      variable: violationVar,
      coefficient: rule.penalty ?? 1,
    })
  }
}
