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
}

export class ConstraintModelBuilder {
  constructor(private ctx: SchedulerContext) {}

  build(): OptimizationModel {
    const model: OptimizationModel = {
      variables: [],
      constraints: [],
      objective: {
        sense: 'maximize',
        terms: [],
      },
    }

    this.buildDecisionVariables(model)
    this.addEligibilityConstraints(model)
    this.addAvailabilityConstraints(model)
    this.addMaxOneShiftTypePerDayConstraints(model)
    this.addMinMembersPerDayConstraints(model)
    this.addPayGradeRuleConstraints(model)
    this.addOperationalCoverageConstraint(model)

    console.log('variables:', model.variables.length)
    console.log('constraints:', model.constraints.length)
    console.log('diff:', model.variables.length - model.constraints.length)

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
              operator: '=',
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
              operator: '=',
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
        const windows = Array.from({ length: numDays }, (_, i) =>
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
          }

          // Constraint: sum of auxiliary vars respects MIN/MAX threshold
          const coefficients: CoefficientMap = {}
          for (const auxVar of auxVariables) coefficients[auxVar] = 1

          model.constraints.push({
            name: `payGradeRule__${rule.id}__uniqueMembers_window_${windowIndex}`,
            coefficients: coefficients,
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
            const { coefficients, adjustRhs } = this.computeMetricExpression(
              rule.metric,
              tm.id,
              dayIndices,
            )

            // adjust rhs
            const rhs = adjustRhs ? adjustRhs(rule.threshold) : rule.threshold

            model.constraints.push({
              name: `payGradeRule__${rule.id}__${tm.id}__${dayIndex}`,
              coefficients,
              operator: this.getOperatorForRule(rule.operator),
              rhs,
            })
          }
        }
      }
    }
  }

  private addOperationalCoverageConstraint(model: OptimizationModel) {
    for (let dayIndex = 0; dayIndex < this.getNumDays(); dayIndex++) {
      const coefficients: CoefficientMap = {}
      const dayOfWeek = this.ctx.period.start.plus({
        days: dayIndex,
      }).weekday
      const operationalHours =
        this.ctx.operationalHours[
          dayOfWeek as keyof typeof this.ctx.operationalHours
        ]

      for (const tm of this.ctx.teamMembers) {
        for (const st of this.ctx.shiftTypes) {
          const varName = getAssignmentVariableName(tm.id, dayIndex, st.id)

          const opStart = operationalHours.startTime
          const opEnd = operationalHours.endTime
          const shiftStart = st.startTime
          const shiftEnd = st.endTime

          let overlap = 0

          const overlapStart = opStart > shiftStart ? opStart : shiftStart
          const overlapEnd = opEnd < shiftEnd ? opEnd : shiftEnd

          if (overlapStart < overlapEnd) {
            overlap = overlapEnd.diff(overlapStart, 'hours').as('hours')
          }

          coefficients[varName] = overlap
        }
      }

      model.constraints.push({
        name: `operationalCoverage__${dayIndex}`,
        coefficients,
        operator: '>=',
        rhs: operationalHours.endTime
          .diff(operationalHours.startTime, 'hours')
          .as('hours'),
      })
    }
  }

  // ------ Objective Terms (Soft) ------

  private addBalanceWorkloadObbjective(model: OptimizationModel) {}

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
        break
      }
      default: {
        break
      }
    }

    return {
      coefficients,
      adjustRhs,
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
        const end = Math.min(startDayIndex + daysInWeek, minDayIndex)
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
}
