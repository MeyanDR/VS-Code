import React from 'react'

export default function InstructionPanel() {
  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mt-4">
      <h3 className="text-cyan-400 font-bold mb-2">Quick Instructions</h3>
      <div className="text-gray-300 text-sm space-y-1">
        <p>• Click cells to add/remove notes</p>
        <p>• Drag to paint multiple notes</p>
        <p>• Shift+drag to select multiple cells</p>
        <p>• Ctrl+Z/Cmd+Z to undo, Ctrl+Y/Cmd+Y to redo</p>
        <p>• Double-click to edit note properties</p>
      </div>
    </div>
  )
}