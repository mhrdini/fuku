import { appRouter } from '../../src/routers/app'
import { createTestContext } from './context'

// creates/configures tRPC caller used by tests
export function createCaller(
  options: Parameters<typeof createTestContext>[0] = {},
) {
  return appRouter.createCaller(createTestContext(options))
}
