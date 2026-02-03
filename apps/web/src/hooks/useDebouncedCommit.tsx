import { useEffect, useRef } from 'react'

export function useDebouncedCommit(fn: () => void, delay = 200) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const schedule = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(fn, delay)
  }

  const flush = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    fn()
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { schedule, flush }
}
