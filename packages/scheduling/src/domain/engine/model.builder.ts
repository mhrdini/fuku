import {
  Metric,
  MetricValues,
  OperatorValues,
  Operator as RuleOperator,
  TimeWindow,
  TimeWindowValues,
} from '@fuku/domain/schemas'

import { SchedulerContext } from '../types'
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
  constructor(private ctx: SchedulerContext) {}

  build(): OptimizationModel {
    const model: OptimizationModel = {
      variables: [],
      constraints: [],
      objective: {
        sense: 'minimize',
        terms: [],
      },
    }

    // build variables
    this.buildDecisionVariables(model)

    // build constraints
    this.addEligibilityConstraints(model)
    this.addAvailabilityConstraints(model)
    this.addMaxOneShiftTypePerDayConstraints(model)
    this.addMinMembersPerDayConstraints(model)
    this.addPayGradeRuleConstraints(model)
    this.addOperationalCoverageConstraint(model)

    // build objective terms
    this.addBalanceWorkloadObjective(model)
    this.addMinimizeShiftTypeChangesObjective(model)
    this.addMaximizeMemberShiftTypeObjective(model)

    return model
  }

  // ------ Variables ------

  private buildDecisionVariables(model: OptimizationModel) {
    const variableBuilder = new VariableBuilder(model)
    const numDays = this.getNumDays()
    for (const tm of this.ctx.teamMembers) {
      for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
        for (const st of this.ctx.shiftTypes) {
          const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)
          variableBuilder.addVariable(varName, 'binary')
        }
      }
    }
  }

  // ------ Constraints (Hard) -------

  private addEligibilityConstraints(model: OptimizationModel) {
    const numDays = this.getNumDays()
    const payGradeToShiftTypes = new Map<string, Set<string>>()
    for (const pgst of this.ctx.payGradeShiftTypes) {
      if (!payGradeToShiftTypes.has(pgst.payGradeId)) {
        payGradeToShiftTypes.set(pgst.payGradeId, new Set())
      }
      payGradeToShiftTypes.get(pgst.payGradeId)!.add(pgst.shiftTypeId)
    }

    for (const tm of this.ctx.teamMembers) {
      const eligibleShiftTypes =
        tm.payGradeId && payGradeToShiftTypes.get(tm.payGradeId)

      for (const st of this.ctx.shiftTypes) {
        const isEligible =
          (eligibleShiftTypes && eligibleShiftTypes.has(st.id)) || false
        if (!isEligible) {
          for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
            const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)

            model.constraints.push({
              name: `eligibility__${tm.id}__${dayIndex}__${st.id}`,
              coefficients: {
                [varName]: 1,
              },
              operator: '==',
              rhs: 0,
            })
          }
        }
      }
    }
  }

  private addAvailabilityConstraints(model: OptimizationModel) {
    const numDays = this.getNumDays()
    for (const tm of this.ctx.teamMembers) {
      const unavailabilities = new Set(
        this.ctx.unavailabilities
          .filter(u => u.teamMemberId === tm.id)
          .map(u => u.date.toISODate()),
      )

      for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
        const currentDate = this.ctx.period.start
          .plus({ days: dayIndex })
          .toISODate()
        if (unavailabilities.has(currentDate)) {
          for (const st of this.ctx.shiftTypes) {
            const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)

            model.constraints.push({
              name: `availability__${tm.id}__${dayIndex}__${st.id}`,
              coefficients: {
                [varName]: 1,
              },
              operator: '==',
              rhs: 0,
            })
          }
        }
      }
    }
  }

  private addMaxOneShiftTypePerDayConstraints(model: OptimizationModel) {
    const numDays = this.getNumDays()
    for (const tm of this.ctx.teamMembers) {
      for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
        const coefficients: Record<string, number> = {}

        for (const st of this.ctx.shiftTypes) {
          const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)
          coefficients[varName] = 1
        }

        model.constraints.push({
          name: `maxOneShiftPerDay__${tm.id}__${dayIndex}`,
          coefficients,
          operator: '<=',
          rhs: 1,
        })
      }
    }
  }

  private addMinMembersPerDayConstraints(model: OptimizationModel) {
    const numDays = this.getNumDays()
    for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
      const coefficients: Record<string, number> = {}

      for (const tm of this.ctx.teamMembers) {
        for (const st of this.ctx.shiftTypes) {
          const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)
          coefficients[varName] = 1
        }
      }

      model.constraints.push({
        name: `minMembersPerDay__${dayIndex}`,
        coefficients,
        operator: '>=',
        rhs: this.ctx.staffingRequirement.minMembersPerDay,
      })
    }
  }

  private addPayGradeRuleConstraints(model: OptimizationModel) {
    const numDays = this.getNumDays()
    for (const rule of this.ctx.payGradeRules) {
      if (!rule.hardConstraint) continue

      if (rule.metric === MetricValues.CONSECUTIVE_DAYS_WORKED) {
        const windowLength = rule.threshold + 1 // exclusive
        for (const tm of this.ctx.teamMembers) {
          if (rule.payGradeId && tm.payGradeId !== rule.payGradeId) continue
          // only iterate while the window fits inside the schedule period
          for (
            let startDay = 0;
            startDay <= numDays - windowLength;
            startDay++
          ) {
            // build coefficients
            const coefficients: CoefficientMap = {}
            for (let d = startDay; d < startDay + windowLength; d++) {
              for (const st of this.ctx.shiftTypes) {
                const varName = getAssignmentVariableName(tm.id, d, st.id)
                coefficients[varName] = 1
              }
            }

            model.constraints.push({
              name: `payGradeRule__${rule.id}__consec__${tm.id}__${startDay}`,
              coefficients,
              operator: this.getOperatorForRule(rule.operator),
              rhs: rule.threshold,
            })
          }
        }
      } else if (rule.metric === MetricValues.UNIQUE_MEMBERS_ASSIGNED) {
        // define "windows" within the period based on timeWindow
        // each as set of day indices that fall within that window and period
        const windows =
          rule.timeWindow === TimeWindowValues.MONTH
            ? [this.getDaysForTimeWindow(rule.timeWindow, 0)]
            : Array.from({ length: numDays }, (_, i) =>
                this.getDaysForTimeWindow(rule.timeWindow, i),
              )

        windows.forEach((dayIndices, windowIndex) => {
          // auxiliary binary variable per member per window:
          // auxVar = 1 if the member works any shift in the window
          // auxVar = 0 if the member works no shifts
          const auxVariables: string[] = []

          for (const tm of this.ctx.teamMembers) {
            if (rule.payGradeId && tm.payGradeId !== rule.payGradeId) continue

            const auxVarName = `uniqueMember__${rule.id}__${tm.id}__${windowIndex}`
            auxVariables.push(auxVarName)

            model.variables.push({
              name: auxVarName,
              type: 'binary',
            })

            // link aux variable to all shifts assigned to this member in the window
            for (const d of dayIndices) {
              for (const st of this.ctx.shiftTypes) {
                // shiftVar = 1 if member is assigned to that shift type
                // shiftVar = 0 if member is not assigned to that shift type
                const shiftVarName = getAssignmentVariableName(tm.id, d, st.id)

                // if shiftVar = 1 → auxVar must be 1 (member works at least one shift in the window)
                // if shiftVar = 0 → auxVar can be 0 or 1 (member works no shifts in the window, or works shifts but not this one)
                // this is equivalent to: auxVar >= shiftVar for all shifts in the window
                model.constraints.push({
                  name: `link_${auxVarName}__${shiftVarName}`,
                  coefficients: {
                    [auxVarName]: 1,
                    [shiftVarName]: -1,
                  },
                  operator: '>=',
                  rhs: 0,
                })
              }
            }

            // reverse link to ensure auxVar = 0 if member works no shifts in the window
            const reverseCoefficients: CoefficientMap = {
              [auxVarName]: 1,
            }

            for (const d of dayIndices) {
              for (const st of this.ctx.shiftTypes) {
                const shiftVarName = getAssignmentVariableName(tm.id, d, st.id)

                reverseCoefficients[shiftVarName] =
                  (reverseCoefficients[shiftVarName] ?? 0) - 1
              }
            }

            model.constraints.push({
              name: `reverse_link_${auxVarName}`,
              coefficients: reverseCoefficients,
              operator: '<=',
              rhs: 0,
            })
          }

          // Constraint: sum of auxiliary vars respects MIN/MAX threshold
          const windowCoefficients: CoefficientMap = {}

          for (const auxVar of auxVariables) {
            windowCoefficients[auxVar] = 1
          }

          model.constraints.push({
            name: `payGradeRule__${rule.id}__uniqueMembers_window_${windowIndex}`,
            coefficients: windowCoefficients,
            operator: this.getOperatorForRule(rule.operator),
            rhs: rule.threshold,
          })
        })
      } else {
        for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
          const dayIndices = this.getDaysForTimeWindow(
            rule.timeWindow,
            dayIndex,
          )
          for (const tm of this.ctx.teamMembers) {
            if (rule.payGradeId && tm.payGradeId !== rule.payGradeId) continue
            // build metric expression
            const { coefficients, adjustRhs, flipOperator } =
              this.computeMetricExpression(rule.metric, tm.id, dayIndices)

            const operator = flipOperator
              ? this.flipOperator(this.getOperatorForRule(rule.operator))
              : this.getOperatorForRule(rule.operator)
            const rhs = adjustRhs ? adjustRhs(rule.threshold) : rule.threshold

            model.constraints.push({
              name: `payGradeRule__${rule.id}__${tm.id}__${dayIndex}`,
              coefficients,
              operator,
              rhs,
            })
          }
        }
      }
    }
  }

  private addOperationalCoverageConstraint(model: OptimizationModel) {
    const numDays = this.getNumDays()

    for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
      const dayOfWeek = this.ctx.period.start.plus({ days: dayIndex }).weekday

      const operationalHours =
        this.ctx.operationalHours[
          dayOfWeek as keyof typeof this.ctx.operationalHours
        ]

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

      const operationalMinutes = opEnd.diff(opStart, 'minutes').as('minutes')

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

          const overlapStart = opStart > shiftStart ? opStart : shiftStart
          const overlapEnd = opEnd < shiftEnd ? opEnd : shiftEnd

          if (overlapStart < overlapEnd) {
            const overlapMinutes = overlapEnd
              .diff(overlapStart, 'minutes')
              .as('minutes')

            if (overlapMinutes > 0) {
              const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)

              coefficients[varName] = overlapMinutes
            }
          }
        }
      }

      if (Object.keys(coefficients).length > 0) {
        model.constraints.push({
          name: `operationalCoverage__${dayIndex}`,
          coefficients,
          operator: '>=',
          rhs: operationalMinutes,
        })
      } else {
        console.warn(`Operational coverage impossible on day ${dayIndex}`)
      }
    }
  }

  // ------ Objective Terms (Soft) ------
  private addBalanceWorkloadObjective(model: OptimizationModel) {
    if (this.ctx.teamMembers.length === 0) return

    const numDays = this.getNumDays()
    const maxShiftMinutes = Math.max(
      ...this.ctx.shiftTypes.map(st =>
        st.endTime.diff(st.startTime, 'minutes').as('minutes'),
      ),
    )

    const maxPossibleMinutes = numDays * maxShiftMinutes

    const memberHourVars: string[] = []

    // create memberHours variables
    for (const tm of this.ctx.teamMembers) {
      const memberHoursVar = `memberHours_${tm.id}`
      memberHourVars.push(memberHoursVar)

      model.variables.push({
        name: memberHoursVar,
        type: 'integer',
        min: 0,
        max: maxPossibleMinutes,
      })

      // create vars for memberHours = sum(shiftMinutes * assignmentVar)
      const coefficients: CoefficientMap = {
        [memberHoursVar]: -1,
      }

      for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
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

      model.constraints.push({
        name: `define_memberHours_${tm.id}`,
        coefficients,
        operator: '==',
        rhs: 0,
      })
    }

    // create max/min vars
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

    // link memberHours to max/min vars
    for (const tm of this.ctx.teamMembers) {
      const memberHoursVar = `memberHours_${tm.id}`

      // memberHours <= maxHours
      model.constraints.push({
        name: `balance_upper_${tm.id}`,
        coefficients: {
          [memberHoursVar]: 1,
          [maxHoursVar]: -1,
        },
        operator: '<=',
        rhs: 0,
      })

      // memberHours >= minHours
      model.constraints.push({
        name: `balance_lower_${tm.id}`,
        coefficients: {
          [memberHoursVar]: 1,
          [minHoursVar]: -1,
        },
        operator: '>=',
        rhs: 0,
      })
    }

    // objective: minimize maxHours - minHours to balance workload
    model.objective!.terms.push({
      variable: maxHoursVar,
      coefficient: 0.8,
    })

    model.objective!.terms.push({
      variable: minHoursVar,
      coefficient: -0.8,
    })
  }

  private addMinimizeShiftTypeChangesObjective(model: OptimizationModel) {
    const numDays = this.getNumDays()
    const auxVariables: string[] = []

    for (const tm of this.ctx.teamMembers) {
      for (let dayIndex = 0; dayIndex < numDays - 1; dayIndex++) {
        const auxVarName = `shiftChange__${tm.id}__${dayIndex}`
        auxVariables.push(auxVarName)

        model.variables.push({
          name: auxVarName,
          type: 'binary',
        })

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

            model.constraints.push({
              name: `shiftChange__${tm.id}__${dayIndex}__${shift1.id}__${shift2.id}`,
              coefficients: {
                [auxVarName]: 1,
                [varDay1]: -1,
                [varDay2]: -1,
              },
              operator: '>=',
              rhs: -1,
            })
          }
        }
      }
    }

    for (const auxVar of auxVariables) {
      model.objective!.terms.push({
        variable: auxVar,
        coefficient: 0.2,
      })
    }
  }

  private addMaximizeMemberShiftTypeObjective(model: OptimizationModel) {
    const numDays = this.getNumDays()
    for (const tm of this.ctx.teamMembers) {
      for (const st of this.ctx.shiftTypes) {
        const auxVarName = `member_${tm.id}_assigned_${st.id}`
        model.variables.push({
          name: auxVarName,
          type: 'binary',
        })
        for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
          const assignmentVar = getAssignmentVariableName(
            tm.id,
            dayIndex,
            st.id,
          )
          // auxVar >= assignmentVar for all days
          model.constraints.push({
            name: `link_memberShiftType_${tm.id}_${st.id}_day_${dayIndex}`,
            coefficients: {
              [auxVarName]: 1,
              [assignmentVar]: -1,
            },
            operator: '>=',
            rhs: 0,
          })
        }
        // objective: minimize the number of different shift types assigned to each member to balance experience
        model.objective!.terms.push({
          variable: `member_${tm.id}_assigned_${st.id}`,
          coefficient: -0.6,
        })
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

  private getOperatorForRule(operator: RuleOperator): Operator {
    return operator === OperatorValues.MAX ? '<=' : '>='
  }

  private computeMetricExpression(
    metric: Metric,
    teamMemberId: string,
    dayIndices: number[],
  ): MetricExpression {
    const coefficients: CoefficientMap = {}

    let adjustRhs
    let flipOperator = false

    switch (metric) {
      case MetricValues.DAYS_WORKED: {
        for (const dayIndex of dayIndices) {
          for (const st of this.ctx.shiftTypes) {
            const varName = getAssignmentVariableName(
              teamMemberId,
              dayIndex,
              st.id,
            )
            coefficients[varName] = 1
          }
        }

        break
      }
      case MetricValues.HOURS_WORKED: {
        for (const dayIndex of dayIndices) {
          for (const st of this.ctx.shiftTypes) {
            const varName = getAssignmentVariableName(
              teamMemberId,
              dayIndex,
              st.id,
            )
            coefficients[varName] = st.endTime
              .diff(st.startTime, 'hours')
              .as('hours')
          }
        }
        break
      }
      case MetricValues.DAYS_OFF: {
        // for the days that there are no assignments, assign = 1
        for (const dayIndex of dayIndices) {
          for (const st of this.ctx.shiftTypes) {
            const varName = getAssignmentVariableName(
              teamMemberId,
              dayIndex,
              st.id,
            )
            coefficients[varName] = 1
          }
        }
        adjustRhs = (rhs: number) => dayIndices.length - rhs
        flipOperator = true
        break
      }
      default: {
        break
      }
    }

    return {
      coefficients,
      adjustRhs,
      flipOperator,
    }
  }

  private getDaysForTimeWindow(
    timeWindow: TimeWindow,
    startDayIndex: number,
  ): number[] {
    const numDays = this.getNumDays()
    const minDayIndex = 0
    const maxDayIndex = numDays - 1
    const days: number[] = []

    const daysInWeek = 6 // 7 - 1 because dayIndex is 0-based
    const daysInMonth =
      this.ctx.period.start.plus({
        days: startDayIndex,
      }).daysInMonth! - 1 // -1 because dayIndex is 0-based

    switch (timeWindow) {
      case TimeWindowValues.DAY: {
        days.push(startDayIndex)
        break
      }
      case TimeWindowValues.WEEK: {
        const end = Math.min(startDayIndex + daysInWeek, maxDayIndex)
        for (let d = startDayIndex; d <= end; d++) days.push(d)
        break
      }
      case TimeWindowValues.MONTH: {
        const end = Math.min(startDayIndex + daysInMonth, maxDayIndex)
        for (let d = startDayIndex; d <= end; d++) days.push(d)
        break
      }
      case TimeWindowValues.ROLLING_WEEK: {
        const start = Math.max(startDayIndex - daysInWeek, minDayIndex)
        for (let d = start; d <= startDayIndex; d++) days.push(d)
        break
      }
      case TimeWindowValues.ROLLING_MONTH: {
        const start = Math.max(startDayIndex - daysInMonth, minDayIndex)
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
}
