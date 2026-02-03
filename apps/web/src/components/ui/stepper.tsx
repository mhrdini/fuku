'use client'

import { Fragment, useCallback } from 'react'
import { Button, Label, Separator } from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ZodObject } from 'zod'

export type Step = {
  label: string
  schema: ZodObject
}

interface StepperProps {
  steps: Step[]
  currentIndex: number
  setCurrentIndex: (index: number) => void
}

export default function Stepper({
  steps,
  currentIndex,
  setCurrentIndex,
}: StepperProps) {
  const setStep = useCallback(
    (index: number) => {
      setCurrentIndex(index)
    },
    [setCurrentIndex],
  )

  return (
    <div className='flex justify-between'>
      <Button
        size='icon-sm'
        variant='ghost'
        disabled={currentIndex === 0}
        className={cn('flex md:hidden', currentIndex === 0 && 'invisible')}
        onClick={() => setStep(currentIndex - 1)}
      >
        <ChevronLeft />
      </Button>
      <ol className='flex items-center justify-center gap-2'>
        {steps.map((step, index) => {
          return (
            <Fragment key={step.label}>
              <li
                className={cn(
                  'gap-2',
                  currentIndex !== index
                    ? 'hidden md:flex items-center justify-center'
                    : 'flex justify-center items-center',
                )}
              >
                <Label className='flex md:hidden'>
                  Step {index + 1} of {steps.length}
                </Label>
                <Button
                  size='icon-sm'
                  role='tab'
                  variant={index === currentIndex ? 'default' : 'secondary'}
                  className='hidden md:flex rounded-full'
                  onClick={() => setStep(index)}
                  aria-current={currentIndex === index ? 'step' : undefined}
                  aria-posinset={index + 1}
                  aria-setsize={steps.length}
                  aria-selected={currentIndex === index}
                >
                  {index + 1}
                </Button>
                <Label
                  onClick={() => setStep(index)}
                  className={cn(
                    'text-center text-sm underline underline-offset-4  cursor-default md:no-underline md:cursor-pointer',
                    currentIndex === index && 'font-medium',
                    currentIndex !== index && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </Label>
              </li>
              {index < steps.length - 1 && (
                <Separator
                  className={cn(
                    'hidden md:flex !w-4',
                    currentIndex > index && 'bg-primary',
                  )}
                />
              )}
            </Fragment>
          )
        })}
      </ol>
      <Button
        size='icon-sm'
        variant='ghost'
        disabled={currentIndex === steps.length - 1}
        className={cn(
          'flex md:hidden',
          currentIndex === steps.length - 1 && 'invisible',
        )}
        onClick={() => setStep(currentIndex + 1)}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
