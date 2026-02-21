import { ShiftCoverage } from '../engine/shift-coverage'
import { Candidate, ZonedSchedulerContext } from '../types'
import { ScoringRule } from './index'

// Each segment knows how many shifts cover it (coveringShiftIds.length)
// Segments with fewer covering shifts = scarcer → higher priority
// Candidate score = sum of scarcity for all segments the shift covers
export class SegmentScarcityRule implements ScoringRule {
  name = 'SegmentScarcityRule'
  weight = 0.7
  score(candidate: Candidate, ctx: ZonedSchedulerContext): number {
    const shiftCoverage = new ShiftCoverage(ctx)
    const { segments, shiftBitmasks } = shiftCoverage.calculate({
      dayOfWeek: candidate.date.weekday,
    })
    const shiftMask = shiftBitmasks[candidate.shiftTypeId]
    let score = 0
    segments.forEach((seg, idx) => {
      if (shiftMask & (1 << idx)) {
        score += 1 / seg.coveringShiftIds.length
      }
    })
    return score
  }
}
