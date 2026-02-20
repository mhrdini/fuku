import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
} from '@fuku/ui/components'

import { useDialogStore } from '~/store/dialog.store'

interface DiscardChangesAlertDialogProps {
  onDiscard?: () => void
}

export const DiscardChangesAlertDialogContent = ({
  onDiscard,
}: DiscardChangesAlertDialogProps) => {
  const { closeDialog } = useDialogStore()

  return (
    <AlertDialogContent>
      <AlertDialogTitle>Discard changes?</AlertDialogTitle>
      <AlertDialogDescription>
        You have unsaved changes. If you discard them, your edits will be lost.
      </AlertDialogDescription>
      <AlertDialogFooter>
        <AlertDialogCancel asChild>
          <Button variant='outline'>Keep editing</Button>
        </AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button
            onClick={onDiscard || closeDialog}
            variant='destructive'
            className='bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60'
          >
            Discard
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}
