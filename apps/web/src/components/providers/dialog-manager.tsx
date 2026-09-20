'use client'

import {
  AlertDialog,
  AlertDialogContent,
  Dialog,
  DialogContent,
} from '@fuku/ui/components'

import { DialogId } from '~/lib/dialog'
import { useDialogStore } from '~/store/dialog.store'

import { RemoveLocationAlertDialog } from '../dashboard/team/locations/remove-location-alert-dialog'
import { CreateMemberFormDialog } from '../dashboard/team/members/create-member-form-dialog'
import { RemoveMemberAlertDialog } from '../dashboard/team/members/remove-member-alert-dialog'
import { UpdateMemberFormDialog } from '../dashboard/team/members/update-member-form-dialog'
import { RemovePayGradeAlertDialog } from '../dashboard/team/pay-grades/remove-pay-grade-alert-dialog'
import { RemoveShiftTypeAlertDialog } from '../dashboard/team/shift-types/remove-shift-type-alert-dialog'

export function DialogManager() {
  const { open, id, isAlert, isDirty, closeDialog, toggleDiscardDialog } = useDialogStore()

  const handleClose = () => {
    if (id === DialogId.UPDATE_TEAM_MEMBER && isDirty) {
      toggleDiscardDialog()
      return
    }
    closeDialog()
  }

  return (
    <>
      <Dialog open={open && !isAlert} onOpenChange={handleClose}>
        <DialogContent showCloseButton={false}>
          {id === DialogId.CREATE_TEAM_MEMBER && <CreateMemberFormDialog />}
          {id === DialogId.UPDATE_TEAM_MEMBER && <UpdateMemberFormDialog />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={open && isAlert} onOpenChange={closeDialog}>
        <AlertDialogContent>
          {id === DialogId.REMOVE_TEAM_MEMBER && <RemoveMemberAlertDialog />}
          {id === DialogId.REMOVE_LOCATION && <RemoveLocationAlertDialog />}
          {id === DialogId.REMOVE_SHIFT_TYPE && <RemoveShiftTypeAlertDialog />}
          {id === DialogId.REMOVE_PAY_GRADE && <RemovePayGradeAlertDialog />}
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
