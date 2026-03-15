export declare function useDebouncedCommit<T extends any[]>(
  fn: (...args: T) => void,
  delay?: number,
): {
  schedule: (...args: T) => void
  flush: (...args: T) => void
}
//# sourceMappingURL=useDebouncedCommit.d.ts.map
