import React from 'react'

export default function InstructionPanel() {
  const shortcuts = [
    { key: 'Click', action: 'Add/Remove note', color: 'text-daw-accent' },
    { key: 'Drag', action: 'Paint notes', color: 'text-green-400' },
    { key: 'Shift+Drag', action: 'Select multiple', color: 'text-yellow-400' },
    { key: 'Space', action: 'Play/Pause', color: 'text-pink-400' },
    { key: 'Ctrl+Z', action: 'Undo', color: 'text-orange-400' },
    { key: 'Ctrl+Y', action: 'Redo', color: 'text-purple-400' },
    { key: 'Delete', action: 'Clear selection', color: 'text-red-400' },
    { key: 'Double-click', action: 'Edit properties', color: 'text-blue-400' },
    { key: 'Ctrl+C', action: 'Copy', color: 'text-teal-400' },
    { key: 'Ctrl+V', action: 'Paste', color: 'text-indigo-400' }
  ]

  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-6 text-xs">
        <span className="text-daw-text-dim font-semibold">Keyboard Shortcuts:</span>
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