import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DragHandleDots2Icon } from '@radix-ui/react-icons'

export default function SortablePanel({ id, children, showDragHandle = true }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'z-50 opacity-50' : ''}`}
    >
      {showDragHandle && (
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-10 opacity-30 hover:opacity-70 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded hover:bg-daw-bg-primary"
        >
          <DragHandleDots2Icon className="h-4 w-4 text-daw-text-dim" />
        </button>
      )}
      <div className="panel-hover-group pl-8">
        {children}
      </div>
    </div>
  )
}