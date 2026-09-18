import { useTranslation } from '@fuku/i18n/react'
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

type DiscardChangesAlertDialogProps = {
  onDiscard?: () => void
}

export function DiscardChangesAlertDialogContent({
  onDiscard,
}: DiscardChangesAlertDialogProps) {
  const { t } = useTranslation()
  const { closeDialog } = useDialogStore()

  return (
    <AlertDialogContent>
      <AlertDialogTitle>
        {t('discardChanges', 'Discard changes?')}
      </AlertDialogTitle>
      <AlertDialogDescription>
        {t(
          'youHaveUnsavedChangesIfYouDiscardThemYourEditsWillBeLost',
          'You have unsaved changes. If you discard them, your edits will be lost.',
        )}
      </AlertDialogDescription>
      <AlertDialogFooter>
        <AlertDialogCancel asChild>
          <Button variant='outline'>{t('keepEditing', 'Keep editing')}</Button>
        </AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button
            onClick={onDiscard || closeDialog}
            variant='destructive'
            className='bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white'
          >
            {t('discard', 'Discard')}
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}
