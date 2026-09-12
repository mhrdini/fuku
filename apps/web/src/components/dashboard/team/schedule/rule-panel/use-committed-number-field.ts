import { useEffect, useState } from 'react'

export function useCommittedNumberField(
  value: number | null | undefined,
  onCommit: (value: number | null) => void,
  { allowNull = false }: { allowNull?: boolean } = {},
) {
  const [input, setInput] = useState(value != null ? String(value) : '')

  useEffect(() => {
    setInput(value != null ? String(value) : '')
  }, [value])

  const commit = () => {
    if (input.trim() === '') {
      if (allowNull) onCommit(null)
      return
    }
    const num = Number(input)
    if (Number.isNaN(num) || num < 0 || num === value) return
    onCommit(num)
  }

  const inputProps = {
    value: input,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setInput(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') commit()
    },
  }

  return { input, setInput, commit, inputProps }
}
