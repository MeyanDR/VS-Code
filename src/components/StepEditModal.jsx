import React, { useState } from 'react'
import { useAppState } from '../contexts/AppContext'

export default function StepEditModal() {
  const { state, dispatch } = useAppState()
  const { editingStep } = state.ui
  
  const [symbol, setSymbol] = useState(editingStep?.symbol || 'o')
  const [modifier, setModifier] = useState(editingStep?.modifier || '')
  
  if (!editingStep) return null
  
  const handleSave = () => {
    dispatch({
      type: 'UPDATE_NOTE',
      payload: {
        instrumentId: editingStep.instrumentId,
        position: editingStep.position,
        symbol: symbol,
        modifier: modifier
      }
    })
    handleClose()
  }
  
  const handleClose = () => {
    dispatch({ type: 'CLOSE_EDIT_MODAL' })
  }
  
  const availableSymbols = ['o', 'x', '+', 'O', 'X', '●', '○', '◆', '◇', '▲', '△', '■', '□']
  const availableModifiers = ['', '>', 'v', '^', 'f', 'p', 'mf', 'ff', 'pp', 'accent', 'ghost']
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-daw-bg-panel border border-daw-border p-6 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-daw-text-primary mb-4">Edit Note</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-daw-text-secondary block mb-2 text-sm">Symbol</label>
            <div className="grid grid-cols-7 gap-2">
              {availableSymbols.map(s => (
                <button
                  key={s}
                  className={`w-10 h-10 border rounded transition-colors ${
                    symbol === s 
                      ? 'bg-cyan-600 text-white border-cyan-400' 
                      : 'bg-daw-bg-secondary text-daw-text-primary border-daw-border hover:bg-daw-button'
                  }`}
                  onClick={() => setSymbol(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-daw-text-secondary block mb-2 text-sm">Modifier</label>
            <select
              value={modifier}
              onChange={(e) => setModifier(e.target.value)}
              className="bg-daw-bg-secondary text-daw-text-primary border border-daw-border px-3 py-2 rounded w-full"
            >
              {availableModifiers.map(m => (
                <option key={m} value={m}>
                  {m || 'None'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="bg-daw-bg-secondary p-4 rounded border border-daw-border">
            <div className="text-daw-text-secondary text-xs mb-1">Preview</div>
            <div className="text-2xl text-daw-text-primary text-center">
              {symbol}
              {modifier && <span className="text-xs ml-1 text-cyan-400">{modifier}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className="px-4 py-2 bg-daw-bg-secondary hover:bg-daw-button text-daw-text-primary border border-daw-border rounded transition-colors"
            onClick={handleClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}