'use client'

import { Fragment, useCallback } from 'react'

import { useTranslation } from '@fuku/i18n/react'
import { Button, Label, Separator } from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import type { ZodObject } from 'zod/v4'

export type Step = {
  label: string
  schema: ZodObject
}

type StepperProps = {
  steps: Step[]
  currentIndex: number
  setCurrentIndex: (index: number) => void
}

export default function Stepper({
  steps,
  currentIndex,
  setCurrentIndex,
}: StepperProps) {
  const { t } = useTranslation()
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
        <ChevronLeftIcon />
      </Button>
      <ol className='flex items-center justify-center gap-2'>
        {steps.map((step, index) => {
          return (
            <Fragment key={step.label}>
              <li
                className={cn(
                  'gap-2',
                  currentIndex !== index
                    ? 'hidden items-center justify-center md:flex'
                    : 'flex items-center justify-center',
                )}
              >
                <Label className='flex md:hidden'>
                  {t('step', 'Step')}
                  {' '}
                  {index + 1}
                  {t('ofLength', 'of {{length}}', { length: steps.length })}
                </Label>
                <Button
                  size='icon-sm'
                  role='tab'
                  variant={index === currentIndex ? 'default' : 'secondary'}
                  className='hidden rounded-none md:flex' // TODO: or rounded-full?
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
                    'cursor-default text-center text-sm underline  underline-offset-4 md:cursor-pointer md:no-underline',
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
                    'hidden !w-4 md:flex',
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
        <ChevronRightIcon />
      </Button>
    </div>
  )
}
