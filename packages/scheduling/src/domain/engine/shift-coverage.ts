import { toMinutesFromMidnight } from '../../shared/utils/date'
import { ZonedSchedulerContext } from '../types'

type Segment = {
  startTime: number // minutes from midnight
  endTime: number // minutes from midnight
  coveringShiftIds: string[]
}

interface ShiftCoverageOptions {
  dayOfWeek: number // 1 = Monday, 7 = Sunday
}

interface ShiftCoverageOutput {
  segments: Segment[]
  shiftBitmasks: Record<string, number>
}

export class ShiftCoverage {
  constructor(private ctx: ZonedSchedulerContext) {}

  calculate(options: ShiftCoverageOptions): ShiftCoverageOutput {
    const segments = this.generateSortedSegments(options.dayOfWeek)
    const shiftBitmasks = this.generateShiftBitmasks(segments)
    return { segments, shiftBitmasks }
  }

  // By sorting time points, segments will be generated in chronological order.
  // Since we will no longer mutate the segments array,
  // we can refer to a segment by its index in future data structures,
  // assuming that 0-th index corresponds to the earliest segment in the day
  // and that segments are non-overlapping and contiguous.
  private generateSortedSegments(dayOfWeek: number): Segment[] {
    const segments: Segment[] = []
    const timePoints = new Set<number>()

    // Collect shift boundaries
    this.ctx.shiftTypes.forEach(st => {
      timePoints.add(toMinutesFromMidnight(st.startTime))
      timePoints.add(toMinutesFromMidnight(st.endTime))
    })

    // Collect operational boundaries
    const op = this.ctx.operationalHours[dayOfWeek]
    timePoints.add(toMinutesFromMidnight(op.startTime))
    timePoints.add(toMinutesFromMidnight(op.endTime))

    const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b)

    for (let i = 0; i < sortedTimePoints.length - 1; i++) {
      const segmentStart = sortedTimePoints[i]
      const segmentEnd = sortedTimePoints[i + 1]

      const coveringShiftIds: string[] = []

      for (const shift of this.ctx.shiftTypes) {
        const shiftStart = toMinutesFromMidnight(shift.startTime)
        const shiftEnd = toMinutesFromMidnight(shift.endTime)

        // Proper interval overlap check
        const overlaps = shiftStart < segmentEnd && shiftEnd > segmentStart

        if (overlaps) {
          coveringShiftIds.push(shift.id)
        }
      }

      // console.log(
      //   'Segments:',
      //   segments.map(s => ({
      //     start: getDateTimeFromMinutesFromMidnight(s.startTime).toFormat(
      //       'HH:mm',
      //     ),
      //     end: getDateTimeFromMinutesFromMidnight(s.endTime).toFormat('HH:mm'),
      //     coveringShiftIds: s.coveringShiftIds,
      //   })),
      // )

      segments.push({
        startTime: segmentStart,
        endTime: segmentEnd,
        coveringShiftIds,
      })
    }

    return segments
  }

  private generateShiftBitmasks(segments: Segment[]): Record<string, number> {
    const shiftBitmasks: Record<string, number> = {}
    segments.forEach((segment, idx) => {
      segment.coveringShiftIds.forEach(shiftId => {
        shiftBitmasks[shiftId] = (shiftBitmasks[shiftId] || 0) | (1 << idx)
      })
    })

    // console.log(
    //   'Shift Bitmasks:',
    //   Object.entries(shiftBitmasks).reduce(
    //     (acc, [shiftId, bitmask]) => ({
    //       ...acc,
    //       [shiftId]: bitmask.toString(2).padStart(segments.length, '0'), // Binary representation for visualization
    //     }),
    //     {},
    //   ),
    // )

    return shiftBitmasks
  }
}
