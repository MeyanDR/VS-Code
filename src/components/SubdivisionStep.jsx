import React from 'react'
import { useAppState } from '../contexts/AppContext'

export default function SubdivisionStep({ 
  instrumentId, 
  beatIndex, 
  subdivisionIndex,
  note, 
  isSelected,
  onMouseDown,
  onMouseEnter,
  onDoubleClick
}) {
  const { state, dispatch } = useAppState()
  
  const handleClick = (e) => {
    e.stopPropagation()
    
    // Use interaction handler if provided
    if (onMouseDown) {
      onMouseDown(instrumentId, beatIndex, subdivisionIndex, e)
    } else {
      // Fallback for basic functionality
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
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
              technique: note.technique || '',
              effect: note.effect || ''
            }
          })
        } else {
          // Add new note
          dispatch({
            type: 'ADD_NOTE',
            payload: {
              instrumentId,
              beatIndex,
              subdivision: subdivisionIndex,
              symbol: state.ui.activeSymbol,
              modifier: state.ui.activeModifier,
              technique: state.ui.activeTechnique,
              effect: state.ui.activeEffect
            }
          })
        }
      }
    }
  }
  
  const handleMouseEnter = (e) => {
    if (onMouseEnter) {
      onMouseEnter(instrumentId, beatIndex, subdivisionIndex, e)
    }
  }
  
  const handleDoubleClick = (e) => {
    e.stopPropagation()
    if (onDoubleClick) {
      onDoubleClick(instrumentId, beatIndex, subdivisionIndex)
    }
  }
  
  return (
    <div
      className={`
        drum-step w-full h-12 border rounded flex flex-col items-center justify-center relative
        cursor-pointer transition-all duration-150 shadow-sm text-xs
        ${note 
          ? 'bg-cyan-700 border-cyan-500 text-white shadow-cyan-900/30' 
          : 'bg-gray-800/60 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
        }
        ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-gray-900' : ''}
      `}
      onMouseDown={handleClick}
      onMouseEnter={handleMouseEnter}
      onDoubleClick={handleDoubleClick}
      data-grid-cell
      data-instrument-id={instrumentId}
      data-beat-index={beatIndex}
      data-subdivision={subdivisionIndex}
      data-has-note={!!note}
      title={`Step ${subdivisionIndex + 1}`}
    >
      {note ? (
        <div className="flex flex-col items-center justify-center w-full h-full py-0.5">
          {/* Effect (top) */}
          <div className="h-3 flex items-center justify-center">
            {note.effect && (
              <span className="text-[10px] text-green-400 font-bold">
                {note.effect}
              </span>
            )}
          </div>
          
          {/* Main symbol + modifier (middle) */}
          <div className="flex items-start justify-center">
            {note.modifier === '(...)' ? (
              /* Roll notation - wrap symbol in parentheses */
              <span className="font-semibold text-base">
                ({note.symbol})
              </span>
            ) : (
              <>
                {/* Note symbol */}
                <span className="font-semibold text-base">
                  {note.symbol}
                </span>
                
                {/* Modifier as superscript */}
                {note.modifier && (
                  <span className="text-[10px] text-yellow-400 font-bold -mt-1">
                    {note.modifier}
                  </span>
                )}
              </>
            )}
          </div>
          
          {/* Technique (bottom) */}
          <div className="h-3 flex items-center justify-center">
            {note.technique && (
              <span className="text-[10px] text-blue-400 font-bold">
                {note.technique}
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Empty step - maintain spacing */
        <div className="h-full w-full"></div>
      )}
    </div>
  )
}