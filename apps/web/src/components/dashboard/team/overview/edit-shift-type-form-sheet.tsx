import { SheetHeader, SheetTitle } from '@fuku/ui/components'

export const EditShiftTypeFormSheet = () => {
  const title = 'Shift Types'

  return (
    <>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
      </SheetHeader>
      <div className='grid flex-1 auto-rows-min gap-6 px-4'>
        <div className='grid gap-3'>{/* Insert Label and Input here */}</div>
      </div>
    </>
  )
}
