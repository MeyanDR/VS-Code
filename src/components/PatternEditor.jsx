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
    <div className="w-64 bg-slate-800/50 p-4 rounded-lg">
      <h3 className="text-cyan-400 font-bold mb-4">Pattern Editor</h3>
      
      <div className="mb-6">
        <h4 className="text-gray-300 text-sm font-semibold mb-2">Symbols</h4>
        <div className="grid grid-cols-5 gap-2">
          {symbols.map(symbol => (
            <button
              key={symbol}
              className={`p-2 rounded text-white font-bold transition-colors ${
                state.ui.activeSymbol === symbol
                  ? 'bg-cyan-600'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              onClick={() => handleSymbolClick(symbol)}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-gray-300 text-sm font-semibold mb-2">Modifiers</h4>
        <div className="grid grid-cols-3 gap-2">
          {modifiers.map(modifier => (
            <button
              key={modifier || 'none'}
              className={`p-2 rounded text-white text-sm transition-colors ${
                state.ui.activeModifier === modifier
                  ? 'bg-cyan-600'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              onClick={() => handleModifierClick(modifier)}
            >
              {modifier || 'None'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-6 p-3 bg-slate-700/50 rounded">
        <p className="text-gray-300 text-sm">
          Active: <span className="text-cyan-400 font-bold">{state.ui.activeSymbol}</span>
          {state.ui.activeModifier && (
            <span className="text-pink-400 ml-1">({state.ui.activeModifier})</span>
          )}
        </p>
      </div>
    </div>
  )
}