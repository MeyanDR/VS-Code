import React from 'react'
import { useAppState } from '../contexts/AppContext'

export default function InstructionPanel() {
  const { state } = useAppState()
  const selectOnlyMode = state.ui.selectOnlyMode

  const shortcuts = [
    { key: 'Click', action: selectOnlyMode ? 'Select cell' : 'Add/Edit note', color: 'text-daw-accent' },
    { key: 'Drag', action: selectOnlyMode ? 'Select area' : 'Paint notes', color: 'text-green-400' },
    { key: 'Shift+Click', action: 'Range select', color: 'text-yellow-400' },
    { key: 'Shift+Drag', action: 'Select area', color: 'text-yellow-400' },
    { key: 'Cmd+Click', action: 'Delete note', color: 'text-red-400' },
    { key: 'Cmd+Drag', action: 'Delete multiple', color: 'text-red-400' },
    { key: 'Arrow Keys', action: 'Navigate cells', color: 'text-blue-400' },
    { key: 'Shift+Arrow', action: 'Extend selection', color: 'text-blue-400' },
    { key: 'Ctrl+Z/Y', action: 'Undo/Redo', color: 'text-orange-400' },
    { key: 'Delete', action: 'Clear selection', color: 'text-pink-400' },
    { key: 'Ctrl+C/X/V', action: 'Copy/Cut/Paste', color: 'text-teal-400' }
  ]

  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-6 text-xs">
        <span className="text-daw-text-dim font-semibold">Shortcuts:</span>
        {shortcuts.map(({ key, action, color }) => (
          <div key={key} className="flex items-center gap-1">
            <kbd className={`px-1.5 py-0.5 bg-daw-button rounded text-xs font-mono ${color}`}>
              {key}
            </kbd>
            <span className="text-daw-text-secondary">{action}</span>
          </div>
        ))}
      </div>
    </div>
  )
}