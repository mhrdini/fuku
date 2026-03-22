'use client'

import { useSortable } from '@dnd-kit/react/sortable'

interface EmptySortableSlotProps {
  cellKey: string
}

export const EmptySortableSlot = ({ cellKey }: EmptySortableSlotProps) => {
  const { ref } = useSortable({
    id: `empty-${cellKey}`,
    index: 0,
    group: cellKey,
    type: 'assignment',
    data: {
      cellKey,
    },
  })

  return <div ref={ref} className='h-0' />
}
