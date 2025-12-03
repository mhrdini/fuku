'use client'

import { Sheet, SheetContent } from '@fuku/ui/components'

import { SheetId } from '~/lib/sheet'
import { useSheetStore } from '~/store/sheet'
import { AddLocationFormSheet } from '../dashboard/team/locations/add-location-form-sheet'
import { EditPayGradeFormSheet } from '../dashboard/team/overview/edit-pay-grade-form-sheet'
import { EditShiftTypeFormSheet } from '../dashboard/team/overview/edit-shift-type-form-sheet'

export const SheetManager = () => {
  const { id, closeSheet } = useSheetStore()

  return (
    <Sheet open={!!id} onOpenChange={() => closeSheet()}>
      <SheetContent side='right'>
        {id === SheetId.ADD_LOCATION && <AddLocationFormSheet />}
        {id === SheetId.ADD_SHIFT_TYPE && <EditShiftTypeFormSheet />}
        {id === SheetId.ADD_PAY_GRADE && <EditPayGradeFormSheet />}
      </SheetContent>
    </Sheet>
  )
}
