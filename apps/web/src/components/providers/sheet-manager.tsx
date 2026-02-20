'use client'

import { Sheet, SheetContent } from '@fuku/ui/components'

import { SheetId } from '~/lib/sheet'
import { useSheetStore } from '~/store/sheet.store'
import { CreateLocationFormSheet } from '../dashboard/team/locations/create-location-form-sheet'
import { CreatePayGradeFormSheet } from '../dashboard/team/pay-grades/create-pay-grade-form-sheet'
import { CreateShiftTypeFormSheet } from '../dashboard/team/shift-types/create-shift-type-form-sheet'

export const SheetManager = () => {
  const { open, id, closeSheet } = useSheetStore()

  const handleClose = () => closeSheet()

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side='right'>
        {id === SheetId.CREATE_LOCATION && <CreateLocationFormSheet />}
        {id === SheetId.CREATE_SHIFT_TYPE && <CreateShiftTypeFormSheet />}
        {id === SheetId.CREATE_PAY_GRADE && <CreatePayGradeFormSheet />}
      </SheetContent>
    </Sheet>
  )
}
