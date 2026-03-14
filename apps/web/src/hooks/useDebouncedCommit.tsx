import { useEffect, useRef } from 'react'

export function useDebouncedCommit<T extends any[]>(
  fn: (...args: T) => void,
  delay = 200,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const schedule = (...args: T) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      fn(...args)
    }, delay)
  }

  const flush = (...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    fn(...args)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { schedule, flush }
}
