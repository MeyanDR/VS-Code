import React from 'react'
import { useAppState } from '../contexts/AppContext'

export default function PatternEditor() {
  const { state, dispatch } = useAppState()
  const symbols = ['o', 'x', '+', 'O', 'X', '◯', '●', '◆', '▲', '■']
  const modifiers = ['', 'f', 'p', 'mf', 'mp', 'ff', 'pp', '>', '^']
  
  const handleSymbolClick = (symbol) => {
    dispatch({ type: 'SET_ACTIVE_SYMBOL', payload: symbol })
  }
  
  const handleModifierClick = (modifier) => {
    dispatch({ type: 'SET_ACTIVE_MODIFIER', payload: modifier })
  }
  
  return (
    <div className="bg-daw-bg-secondary rounded-lg p-3 border border-daw-border">
      <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">Pattern Type</h3>
      
      <div className="mb-4">
        <h4 className="text-xs text-daw-text-dim mb-2">Note Type</h4>
        <div className="grid grid-cols-5 gap-1">
          {symbols.map(symbol => (
            <button
              key={symbol}
              className={`py-1.5 px-2 rounded text-xs font-bold transition-colors ${
                state.ui.activeSymbol === symbol
                  ? 'bg-daw-accent text-daw-bg-primary'
                  : 'bg-daw-button text-daw-text-primary hover:bg-daw-button-hover'
              }`}
              onClick={() => handleSymbolClick(symbol)}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-xs text-daw-text-dim mb-2">Modifiers</h4>
        <div className="grid grid-cols-3 gap-1">
          {modifiers.map(modifier => (
            <button
              key={modifier || 'none'}
              className={`py-1 px-2 rounded text-xs transition-colors ${
                state.ui.activeModifier === modifier
                  ? 'bg-daw-accent text-daw-bg-primary'
                  : 'bg-daw-button text-daw-text-primary hover:bg-daw-button-hover'
              }`}
              onClick={() => handleModifierClick(modifier)}
            >
              {modifier || 'None'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-4 p-2 bg-daw-bg-panel rounded border border-daw-border">
        <p className="text-xs text-daw-text-secondary">
          Active: <span className="text-daw-accent font-bold">{state.ui.activeSymbol}</span>
          {state.ui.activeModifier && (
            <span className="text-daw-warning ml-1">({state.ui.activeModifier})</span>
          )}
        </p>
      </div>
    </div>
  )
}