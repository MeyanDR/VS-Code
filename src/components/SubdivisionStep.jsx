import React from 'react'
import { useAppState } from '../contexts/AppContext'

export default function SubdivisionStep({ 
  instrumentId, 
  beatIndex, 
  subdivisionIndex,
  note, 
  isSelected 
}) {
  const { state, dispatch } = useAppState()
  
  const handleClick = (e) => {
    e.stopPropagation()
    
    if (note) {
      // Open edit modal for existing note
      dispatch({
        type: 'OPEN_EDIT_MODAL',
        payload: {
          instrumentId,
          beatIndex,
          subdivision: subdivisionIndex,
          symbol: note.symbol,
          modifier: note.modifier,
          position: note.position
        }
      })
    } else {
      // Add new note at subdivision
      dispatch({
        type: 'ADD_NOTE',
        payload: {
          instrumentId,
          beatIndex,
          subdivision: subdivisionIndex,
          symbol: state.ui.activeSymbol,
          modifier: state.ui.activeModifier
        }
      })
    }
  }
  
  return (
    <div
      className={`
        w-full h-7 border rounded flex items-center justify-center relative
        cursor-pointer transition-all duration-150 shadow-sm text-xs
        ${note 
          ? 'bg-cyan-700 border-cyan-500 text-white shadow-cyan-900/30' 
          : 'bg-gray-800/60 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
        }
        ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-gray-900' : ''}
      `}
      onClick={handleClick}
      title={`Step ${subdivisionIndex + 1}`}
    >
      {/* Note symbol */}
      <span className="font-semibold truncate px-0.5">
        {note ? note.symbol : ''}
      </span>
      
      {/* Modifier indicator */}
      {note?.modifier && (
        <span className="absolute -top-1 -right-1 text-[8px] text-yellow-400">
          {note.modifier}
        </span>
      )}
    </div>
  )
}