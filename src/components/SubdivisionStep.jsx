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
  onDoubleClick,
  nestedSubdivisions = null,
  stepPath = [],
  width,
  height,
  getNestedSubdivisionFn,
  getNoteAtFn,
  isSelectedFn
}) {
  const { state, dispatch } = useAppState()
  
  const handleClick = (e) => {
    e.stopPropagation()

    // Use actual subdivision path (array or number)
    const actualSubdiv = Array.isArray(subdivisionIndex) ? subdivisionIndex : subdivisionIndex

    // Use interaction handler if provided
    if (onMouseDown) {
      onMouseDown(instrumentId, beatIndex, actualSubdiv, e)
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
              subdivision: actualSubdiv,
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
              subdivision: actualSubdiv,
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
      const actualSubdiv = Array.isArray(subdivisionIndex) ? subdivisionIndex : subdivisionIndex
      onMouseEnter(instrumentId, beatIndex, actualSubdiv, e)
    }
  }

  const handleDoubleClick = (e) => {
    e.stopPropagation()
    if (onDoubleClick) {
      const actualSubdiv = Array.isArray(subdivisionIndex) ? subdivisionIndex : subdivisionIndex
      onDoubleClick(instrumentId, beatIndex, actualSubdiv)
    }
  }

  // Check if this step has nested subdivisions
  const hasNested = nestedSubdivisions && nestedSubdivisions > 0

  // If there are nested subdivisions, render them recursively
  if (hasNested) {
    const NESTED_GAP = 2
    const nestedStepWidth = (width - (nestedSubdivisions - 1) * NESTED_GAP) / nestedSubdivisions

    return (
      <div
        style={{ width: `${width}px`, height: `${height}px` }}
        className="flex items-center"
      >
        <div
          className="flex items-center"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            gap: `${NESTED_GAP}px`
          }}
        >
          {Array.from({ length: nestedSubdivisions }, (_, nestedIndex) => {
            // Build the nested path
            const currentPath = stepPath.length > 0 ? [...stepPath, nestedIndex] : [subdivisionIndex, nestedIndex]

            // Get nested instrument data from state
            const section = state.project.sections[state.project.currentSection]
            const instrument = section.instruments.find(i => i.id === instrumentId)

            // Check if there's a note at this nested position
            const nestedNote = instrument ? getNoteAtFn?.(instrument, beatIndex, currentPath) : null

            // Check for deeper nesting
            const deeperNested = instrument && getNestedSubdivisionFn
              ? getNestedSubdivisionFn(instrument, beatIndex, currentPath)
              : null

            return (
              <SubdivisionStep
                key={nestedIndex}
                instrumentId={instrumentId}
                beatIndex={beatIndex}
                subdivisionIndex={currentPath}
                note={nestedNote}
                isSelected={isSelectedFn?.(instrumentId, beatIndex, currentPath) || false}
                onMouseDown={onMouseDown}
                onMouseEnter={onMouseEnter}
                onDoubleClick={onDoubleClick}
                nestedSubdivisions={deeperNested}
                stepPath={currentPath}
                width={nestedStepWidth}
                height={height}
                getNestedSubdivisionFn={getNestedSubdivisionFn}
                getNoteAtFn={getNoteAtFn}
                isSelectedFn={isSelectedFn}
              />
            )
          })}
        </div>
      </div>
    )
  }
  
  // Regular step rendering (no nested subdivisions)
  return (
    <div
      className={`
        drum-step border rounded flex flex-col items-center justify-center relative
        cursor-pointer transition-all duration-150 shadow-sm text-xs
        ${note
          ? 'bg-cyan-700 border-cyan-500 text-white shadow-cyan-900/30'
          : 'bg-gray-800/60 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
        }
        ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-gray-900' : ''}
      `}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '48px'
      }}
      onMouseDown={handleClick}
      onMouseEnter={handleMouseEnter}
      onDoubleClick={handleDoubleClick}
      data-grid-cell
      data-instrument-id={instrumentId}
      data-beat-index={beatIndex}
      data-subdivision={Array.isArray(subdivisionIndex) ? JSON.stringify(subdivisionIndex) : subdivisionIndex}
      data-has-note={!!note}
      title={`Step ${Array.isArray(subdivisionIndex) ? subdivisionIndex.join('.') : subdivisionIndex + 1}`}
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