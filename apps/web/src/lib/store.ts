export function serialize(value: unknown) {
  return JSON.stringify(value, (_key, val) => {
    if (val instanceof Map) {
      return {
        __type: 'Map',
        value: Array.from(val.entries()),
      }
    }
    return val
  })
}

export function deserialize(value: string) {
  return JSON.parse(value, (_key, val) => {
    if (val?.__type === 'Map') {
      return new Map(val.value)
    }
    return val
  })
}

export const mapStorage = {
  getItem: (name: string) => {
    const value = localStorage.getItem(name)
    return value ? deserialize(value) : null
  },

  setItem: (name: string, value: unknown) => {
    localStorage.setItem(name, serialize(value))
  },

  removeItem: (name: string) => {
    localStorage.removeItem(name)
  },
}
