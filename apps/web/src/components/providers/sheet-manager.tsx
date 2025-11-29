'use client'

import {
  Sheet,
  SheetContent,
} from '@fuku/ui/components'

import { SheetId } from '~/lib/sheet'
import { useSheetStore } from '~/store/sheet'
import { EditLocationFormSheet } from '../dashboard/team/overview/edit-location-form-sheet'
import { EditPayGradeFormSheet } from '../dashboard/team/overview/edit-pay-grade-form-sheet'
import { EditShiftTypeFormSheet } from '../dashboard/team/overview/edit-shift-type-form-sheet'

interface SheetManagerProps {
  children?: React.ReactNode
}

export const SheetManager = ({ children }: SheetManagerProps) => {
  const { id, closeSheet } = useSheetStore()

  return (
    <Sheet open={!!id} onOpenChange={() => closeSheet()}>
      <SheetContent side='right'>
        {id === SheetId.MANAGE_LOCATIONS && <EditLocationFormSheet />}
        {id === SheetId.MANAGE_SHIFT_TYPES && <EditShiftTypeFormSheet />}
        {id === SheetId.MANAGE_PAY_GRADES && <EditPayGradeFormSheet />}
      </SheetContent>
    </Sheet>
  )
}
