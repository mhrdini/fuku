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
import { AddMemberFormDialog } from '../dashboard/team/members/add-member-form-dialog'
import { EditMemberFormDialog } from '../dashboard/team/members/edit-member-form-dialog'
import { RemoveMemberAlertDialog } from '../dashboard/team/members/remove-member-alert-dialog'

export const DialogManager = () => {
  const { open, id, isAlert, closeDialog } = useDialogStore()

  const handleClose = () => {
    closeDialog()
  }

  return (
    <>
      <Dialog open={open && !isAlert} onOpenChange={handleClose}>
        <DialogContent>
          {id === DialogId.ADD_TEAM_MEMBER && <AddMemberFormDialog />}
          {id === DialogId.EDIT_TEAM_MEMBER && <EditMemberFormDialog />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={open && isAlert} onOpenChange={closeDialog}>
        <AlertDialogContent>
          {id === DialogId.REMOVE_TEAM_MEMBER && <RemoveMemberAlertDialog />}
          {id === DialogId.REMOVE_LOCATION && <RemoveLocationAlertDialog />}
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
