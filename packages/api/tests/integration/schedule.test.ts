import { createUser } from '@fuku/db/testing/factories'
import { describe, expect, it, vi } from 'vitest'

import { createCaller } from '../helpers/caller'
import { createSessionContext } from '../helpers/context'
import { createTestSchedulerService } from '../helpers/scheduler'

describe('schedule', () => {
  describe('generate', () => {
    it('generates a schedule using the scheduler service', async () => {
      const user = await createUser()

      const result = {
        teamId: 'team-id',
        period: {
          start: '2026-01-01',
          end: '2026-01-31',
          timeZone: 'Asia/Tokyo',
        },
        assignments: [],
      }

      const generate = vi.fn().mockResolvedValue(result)

      const caller = createCaller({
        session: createSessionContext(user),
        schedulerService: createTestSchedulerService({
          generate,
        }),
      })

      const input = {
        teamId: 'team-id',
        start: '2026-01-01',
        end: '2026-01-31',
        timeZone: 'Asia/Tokyo',
      }

      await expect(
        caller.schedule.generate(input),
      ).resolves.toEqual(result)

      expect(generate).toHaveBeenCalledWith(input)
    })
  })
})
