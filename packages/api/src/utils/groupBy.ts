export function groupBy<T, K extends PropertyKey>(
  items: T[],
  getKey: (item: T) => K,
): Record<K, T[]> {
  const result = {} as Record<K, T[]>
  for (const item of items) {
    const key = getKey(item)
    const list = result[key] ?? (result[key] = [])
    list.push(item)
  }
  return result
}
