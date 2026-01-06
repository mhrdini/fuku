import z from 'zod/v4'

export const numberFromInput = (opts?: { min?: number; max?: number }) =>
  z.preprocess(
    value => {
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed === '') return 0
        return Number(trimmed)
      }
      return value
    },
    z
      .number({
        error: 'invalid_not_a_number',
      })
      .min(opts?.min ?? -Infinity, { error: 'invalid_number_too_small' })
      .max(opts?.max ?? Infinity, {
        error: 'invalid_number_too_large',
      }),
  )
