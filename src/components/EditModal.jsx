import React from 'react'
import { useAppState } from '../contexts/AppContext'

export default function EditModal() {
  const { state, dispatch } = useAppState()
  const { editingStep } = state.ui
  
  if (!editingStep) return null
  
  const handleClose = () => {
    dispatch({ type: 'CLOSE_EDIT_MODAL' })
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">Edit Note</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-gray-300 block mb-2">Symbol</label>
            <input
              type="text"
              value={editingStep.symbol || ''}
              className="bg-slate-700 text-white px-3 py-2 rounded"
              onChange={(e) => {
                // TODO: Update note symbol
              }}
            />
          </div>
          
          <div>
            <label className="text-gray-300 block mb-2">Modifier</label>
            <input
              type="text"
              value={editingStep.modifier || ''}
              className="bg-slate-700 text-white px-3 py-2 rounded"
              onChange={(e) => {
                // TODO: Update note modifier
              }}
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded"
            onClick={() => {
              // TODO: Save changes
              handleClose()
            }}
          >
            Save
          </button>
          <button
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded"
            onClick={handleClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}