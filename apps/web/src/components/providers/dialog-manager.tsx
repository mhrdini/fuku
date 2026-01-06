'use client'

import {
  AlertDialog,
  AlertDialogContent,
  Dialog,
  DialogContent,
} from '@fuku/ui/components'

import { DialogId } from '~/lib/dialog'
import { useDialogStore } from '~/store/dialog'
import { RemoveLocationAlertDialog } from '../dashboard/team/locations/remove-location-alert-dialog'
import { CreateMemberFormDialog } from '../dashboard/team/members/create-member-form-dialog'
import { RemoveMemberAlertDialog } from '../dashboard/team/members/remove-member-alert-dialog'
import { UpdateMemberFormDialog } from '../dashboard/team/members/update-member-form-dialog'
import { RemoveShiftTypeAlertDialog } from '../dashboard/team/shift-types/remove-shift-type-alert-dialog'

export const DialogManager = () => {
  const { open, id, isAlert, closeDialog } = useDialogStore()

  const handleClose = () => {
    closeDialog()
  }

  return (
    <>
      <Dialog open={open && !isAlert} onOpenChange={handleClose}>
        <DialogContent>
          {id === DialogId.CREATE_TEAM_MEMBER && <CreateMemberFormDialog />}
          {id === DialogId.UPDATE_TEAM_MEMBER && <UpdateMemberFormDialog />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={open && isAlert} onOpenChange={closeDialog}>
        <AlertDialogContent>
          {id === DialogId.REMOVE_TEAM_MEMBER && <RemoveMemberAlertDialog />}
          {id === DialogId.REMOVE_LOCATION && <RemoveLocationAlertDialog />}
          {id === DialogId.REMOVE_SHIFT_TYPE && <RemoveShiftTypeAlertDialog />}
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
