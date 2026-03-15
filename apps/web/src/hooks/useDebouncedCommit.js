import { useEffect, useRef } from 'react'

export function useDebouncedCommit(fn, delay = 200) {
  const timeoutRef = useRef(null)
  const schedule = (...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      fn(...args)
    }, delay)
  }
  const flush = (...args) => {
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
