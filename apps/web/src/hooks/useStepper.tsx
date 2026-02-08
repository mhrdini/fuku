import { useState } from 'react'

import Stepper, { Step } from '~/components/ui/stepper'

export const useStepper = (steps: Step[]) => {
  const [index, setIndex] = useState(0)

  const currentStep = () => {
    return steps[index]
  }

  const prevStep = () => {
    setIndex(index => index - 1)
  }

  const nextStep = () => {
    setIndex(index => index + 1)
  }

  const stepper = (
    <Stepper steps={steps} currentIndex={index} setCurrentIndex={setIndex} />
  )
  return {
    stepper,
    index,
    currentStep: steps[index],
    setStep: setIndex,
    prevStep,
    nextStep,
  }
}
