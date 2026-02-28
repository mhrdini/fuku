import {
  Button,
  ButtonGroup,
  Input,
} from '@fuku/ui/components'
import { Minus, Plus } from 'lucide-react'

interface NumberStepperInputProps {
  value: number
  min?: number
  max?: number
  disabled?: boolean
  onValueChange: (v: number) => void
}

export function NumberStepperInput({
  value,
  min = 0,
  max = 999,
  disabled = false,
  onValueChange,
}: NumberStepperInputProps) {
  const increment = () => onValueChange(Math.min(max, value + 1))
  const decrement = () => onValueChange(Math.max(min, value - 1))

  return (
    <ButtonGroup orientation='horizontal' className='max-w-full'>
      {/* Input */}
      <Input
        type='number'
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={e => onValueChange(Number(e.target.value))}
        className='grow'
      />
      {/* Decrement */}
      <Button
        type='button'
        variant='outline'
        size='icon'
        onClick={decrement}
        disabled={disabled || value <= min}
        aria-label='Decrement'
      >
        <Minus />
      </Button>

      {/* Increment */}
      <Button
        type='button'
        variant='outline'
        size='icon'
        onClick={increment}
        disabled={disabled || value >= max}
        aria-label='Increment'
      >
        <Plus />
      </Button>
    </ButtonGroup>
  )
}
