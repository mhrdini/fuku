import {
  MetricValues,
  RuleConditionOperatorValues,
  RuleOperator,
  RuleOperatorValues,
  RuleTargetValues,
  TimeWindow,
  TimeWindowValues,
} from '@fuku/domain/schemas'

import { Rule, SchedulerContext, TeamMember, ZonedShiftType } from '../types'
import {
  CoefficientMap,
  Operator,
  OptimizationModel,
} from './optimization.model'
import { getAssignmentVariableName, VariableBuilder } from './variable.builder'

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

    return model
  }

  // ------ Variables ------
  private buildDecisionVariables(model: OptimizationModel) {
    const variableBuilder = new VariableBuilder(model)

    for (const tm of this.ctx.teamMembers) {
      for (let dayIndex = 0; dayIndex < this.numDays; dayIndex++) {
        for (const st of this.ctx.shiftTypes) {
          const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)
          variableBuilder.addVariable(varName, 'binary')
        }
      }
    }
  }

  // ------ Constraints (Hard) -------
  private addEligibilityConstraints(model: OptimizationModel) {
    for (const tm of this.ctx.teamMembers) {
      if (!tm.payGradeId) continue
      const payGradeShiftTypes = this.payGradeToShiftTypesMap.get(tm.payGradeId)

      for (const st of this.ctx.shiftTypes) {
        const isEligible = payGradeShiftTypes!.has(st.id) || false
        if (!isEligible) {
          for (let dayIndex = 0; dayIndex < this.numDays; dayIndex++) {
            const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)
            // forbid assignment if member not eligible for shift type
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
  }

  private addAvailabilityConstraints(model: OptimizationModel) {
    console.log(
      'UNAV',
      this.ctx.unavailabilities.map(u => u.date.toISODate()),
    )

    console.log(
      'DAYS',
      Array.from({ length: this.numDays }, (_, i) =>
        this.ctx.period.start.plus({ days: i }).toISODate(),
      ),
    )

    for (const tm of this.ctx.teamMembers) {
      const unavailabilities = new Set(
        this.ctx.unavailabilities
          .filter(u => u.teamMemberId === tm.id)
          .map(u => u.date.startOf('day').toISODate()),
      )

      for (let dayIndex = 0; dayIndex < this.numDays; dayIndex++) {
        const currentDate = this.ctx.period.start
          .plus({ days: dayIndex })
          .startOf('day')
          .toISODate()
        if (unavailabilities.has(currentDate)) {
          for (const st of this.ctx.shiftTypes) {
            const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)
            // forbid assignment if member unavailable on date
            model.constraints.push({
              name: `availability__${tm.id}__${dayIndex}__${st.id}`,
              coefficients: { [varName]: 1 },
              operator: '==',
              rhs: 0,
            })
          }
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
      const day = this.ctx.period.start.plus({ days: dayIndex })
      const staffingRequirement = this.ctx.staffingRequirements[day.weekday]

      for (const tm of this.ctx.teamMembers) {
        for (const st of this.ctx.shiftTypes) {
          const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)
          coefficients[varName] = 1
        }
      }

      // enforce minimum staff count per day
      model.constraints.push({
        name: `minMembersPerDay__${dayIndex}`,
        coefficients,
        operator: '>=',
        rhs: staffingRequirement.minMembers,
      })
      // enforce maximum staff count per day
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
        const weekday = this.ctx.period.start.plus({ days: dayIndex }).weekday
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
      if (rule.metric === MetricValues.CONSECUTIVE_DAYS_WORKED) {
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
      if (rule.metric === MetricValues.UNIQUE_MEMBERS_ASSIGNED) {
        const windows =
          rule.timeWindow === TimeWindowValues.MONTH
            ? [this.getDaysForTimeWindow(rule.timeWindow, 0)]
            : Array.from({ length: this.numDays }, (_, i) =>
                this.getDaysForTimeWindow(rule.timeWindow, i),
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
        rule.timeWindow === TimeWindowValues.MONTH
          ? [this.getDaysForTimeWindow(rule.timeWindow, 0)]
          : Array.from({ length: this.numDays }, (_, i) =>
              this.getDaysForTimeWindow(rule.timeWindow, i),
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
      const weekday = this.ctx.period.start.plus({ days: dayIndex }).weekday
      const operationalHours =
        this.ctx.operationalHours[
          weekday as keyof typeof this.ctx.operationalHours
        ]
      if (!operationalHours) continue

      const baseDate = this.ctx.period.start
        .plus({ days: dayIndex })
        .startOf('day')
      const opStart = baseDate.set({
        hour: operationalHours.startTime.hour,
        minute: operationalHours.startTime.minute,
      })
      const opEnd = baseDate.set({
        hour: operationalHours.endTime.hour,
        minute: operationalHours.endTime.minute,
      })
      const totalOperationalMinutes = opEnd
        .diff(opStart, 'minutes')
        .as('minutes')
      const totalSlots = Math.ceil(totalOperationalMinutes / slotSizeMinutes)

      for (let slotIndex = 0; slotIndex < totalSlots; slotIndex++) {
        const slotStart = opStart.plus({ minutes: slotIndex * slotSizeMinutes })
        const slotEnd = slotStart.plus({ minutes: slotSizeMinutes })
        const coefficients: CoefficientMap = {}

        for (const tm of this.ctx.teamMembers) {
          for (const st of this.ctx.shiftTypes) {
            const shiftStart = baseDate.set({
              hour: st.startTime.hour,
              minute: st.startTime.minute,
            })
            const shiftEnd = baseDate.set({
              hour: st.endTime.hour,
              minute: st.endTime.minute,
            })
            if (shiftStart <= slotStart && shiftEnd >= slotEnd) {
              const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)
              coefficients[varName] = 1
            }
          }
        }

        // enforce at least one member covering each operational slot
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
        st.endTime.diff(st.startTime, 'minutes').as('minutes'),
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
          const shiftMinutes = st.endTime
            .diff(st.startTime, 'minutes')
            .as('minutes')
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
    return (
      this.ctx.period.end
        .startOf('day')
        .diff(this.ctx.period.start.startOf('day'), 'days')
        .as('days') + 1
    )
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
      case MetricValues.DAYS_WORKED: {
        for (const d of validDays) {
          for (const st of shiftTypes) {
            const varName = getAssignmentVariableName(teamMemberId, d, st.id)
            coefficients[varName] = (coefficients[varName] ?? 0) + 1
          }
        }
        break
      }

      case MetricValues.HOURS_WORKED: {
        for (const d of validDays) {
          for (const st of shiftTypes) {
            const varName = getAssignmentVariableName(teamMemberId, d, st.id)
            coefficients[varName] = st.endTime
              .diff(st.startTime, 'hours')
              .as('hours')
          }
        }
        break
      }

      case MetricValues.DAYS_OFF: {
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

  private getDaysForTimeWindow(
    timeWindow: TimeWindow,
    startDayIndex: number,
  ): number[] {
    const minDayIndex = 0
    const maxDayIndex = this.numDays - 1
    const days: number[] = []
    const daysInWeek = 7
    const daysInMonth = this.ctx.period.start.plus({
      days: startDayIndex,
    }).daysInMonth!
    const forwardEndIndex =
      startDayIndex +
      (timeWindow === TimeWindowValues.MONTH ? daysInMonth : daysInWeek) -
      1
    const backwardStartIndex =
      startDayIndex -
      (timeWindow === TimeWindowValues.MONTH ? daysInMonth : daysInWeek) +
      1

    switch (timeWindow) {
      case TimeWindowValues.DAY: {
        days.push(startDayIndex)
        break
      }
      case TimeWindowValues.WEEK:
      case TimeWindowValues.MONTH: {
        const end = Math.min(forwardEndIndex, maxDayIndex)
        for (let d = startDayIndex; d <= end; d++) days.push(d)
        break
      }
      case TimeWindowValues.ROLLING_WEEK:
      case TimeWindowValues.ROLLING_MONTH: {
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
    return dayIndices.filter(d => this.hasValidConditions(rule, d))
  }

  private getRelevantShiftTypes(rule: Rule): ZonedShiftType[] {
    if (rule.target === RuleTargetValues.SHIFT_TYPE && rule.shiftTypeId) {
      return this.ctx.shiftTypes.filter(st => st.id === rule.shiftTypeId)
    }
    return this.ctx.shiftTypes
  }

  private hasValidConditions(rule: Rule, dayIndex: number): boolean {
    if (!rule.ruleConditions?.length) return true

    const day = this.ctx.period.start.plus({ days: dayIndex })
    const month = day.month
    const weekday = day.weekday

    for (const cond of rule.ruleConditions) {
      let intValue: number | undefined
      let stringValue: string | undefined
      let intSetValue: Set<number> | undefined
      let stringSetValue: Set<string> | undefined

      if (typeof cond.value === 'number') intValue = cond.value
      if (this.isIntArray(cond.value)) intSetValue = new Set(cond.value)
      if (typeof cond.value === 'string') stringValue = cond.value
      if (this.isStringArray(cond.value)) stringSetValue = new Set(cond.value)

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

  private isStringArray(value: any): value is string[] {
    return Array.isArray(value) && value.every(v => typeof v === 'string')
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
