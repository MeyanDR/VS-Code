import { useEffect, useRef, useCallback } from 'react'

export function useInteraction(dispatch, state) {
  const dragStateRef = useRef({
    isDragging: false,
    dragMode: null, // 'paint' | 'select' | 'delete'
    startCell: null,
    lastCell: null,
    paintedCells: new Set(),
    currentNote: null
  })
  
  const selectionRef = useRef({
    isSelecting: false,
    startPoint: null,
    endPoint: null,
    selectedCells: new Set()
  })
  
  const handleCellMouseDown = useCallback((instrumentId, position, event) => {
    const { shiftKey, ctrlKey, metaKey } = event
    
    // Prevent text selection while dragging
    event.preventDefault()
    
    const cellKey = `${instrumentId}-${position}`
    const hasNote = state.project.sections[state.project.currentSection]
      ?.instruments.find(i => i.id === instrumentId)
      ?.pattern.some(n => n.position === position)
    
    if (ctrlKey || metaKey) {
      // Cmd/Ctrl + Click: Delete mode
      if (hasNote) {
        // Delete single note
        dispatch({
          type: 'REMOVE_NOTE',
          payload: { instrumentId, position }
        })
        
        // Start delete drag mode
        dragStateRef.current = {
          isDragging: true,
          dragMode: 'delete',
          startCell: { instrumentId, position },
          lastCell: { instrumentId, position },
          paintedCells: new Set([cellKey]),
          currentNote: null
        }
      }
    } else if (shiftKey) {
      // Shift + Click: Selection mode
      // Toggle selection of this cell
      if (state.ui.selectedSteps.has(cellKey)) {
        dispatch({ type: 'REMOVE_FROM_SELECTION', payload: cellKey })
      } else {
        dispatch({ type: 'ADD_TO_SELECTION', payload: cellKey })
      }
      
      // Start selection drag
      dragStateRef.current = {
        isDragging: true,
        dragMode: 'select',
        startCell: { instrumentId, position },
        lastCell: { instrumentId, position },
        paintedCells: new Set([cellKey]),
        currentNote: null
      }
    } else {
      // Plain Click/Drag: Add/Edit/Paint mode
      if (hasNote) {
        // Click on existing note: Open edit modal
        const note = state.project.sections[state.project.currentSection]
          ?.instruments.find(i => i.id === instrumentId)
          ?.pattern.find(n => n.position === position)
        
        if (note) {
          // Find beat and subdivision from position
          const section = state.project.sections[state.project.currentSection]
          const beatSubdivisions = section.grid.beatSubdivisions || 
            Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions)
          
          let beatIndex = 0
          let remainingPosition = position
          
          while (beatIndex < beatSubdivisions.length && remainingPosition >= beatSubdivisions[beatIndex]) {
            remainingPosition -= beatSubdivisions[beatIndex]
            beatIndex++
          }
          
          dispatch({
            type: 'OPEN_EDIT_MODAL',
            payload: {
              instrumentId,
              beatIndex,
              subdivision: remainingPosition,
              symbol: note.symbol,
              modifier: note.modifier,
              position
            }
          })
        }
      } else {
        // Add note and start paint mode
        dispatch({
          type: 'ADD_NOTE',
          payload: {
            instrumentId,
            position,
            symbol: state.ui.activeSymbol,
            modifier: state.ui.activeModifier
          }
        })
        
        dragStateRef.current = {
          isDragging: true,
          dragMode: 'paint',
          startCell: { instrumentId, position },
          lastCell: { instrumentId, position },
          paintedCells: new Set([cellKey]),
          currentNote: {
            symbol: state.ui.activeSymbol,
            modifier: state.ui.activeModifier
          }
        }
      }
      
      // Clear selection if not using modifier keys
      if (!ctrlKey && !metaKey && !shiftKey) {
        dispatch({ type: 'CLEAR_SELECTION' })
      }
    }
  }, [dispatch, state])
  
  const handleCellMouseEnter = useCallback((instrumentId, position, event) => {
    if (!dragStateRef.current.isDragging) return
    
    const cellKey = `${instrumentId}-${position}`
    const { dragMode, paintedCells } = dragStateRef.current
    
    // Don't process the same cell twice during the same drag
    if (paintedCells.has(cellKey)) return
    
    dragStateRef.current.lastCell = { instrumentId, position }
    paintedCells.add(cellKey)
    
    const hasNote = state.project.sections[state.project.currentSection]
      ?.instruments.find(i => i.id === instrumentId)
      ?.pattern.some(n => n.position === position)
    
    switch (dragMode) {
      case 'paint':
        // Paint mode: Add note with same symbol/modifier
        if (!hasNote && dragStateRef.current.currentNote) {
          dispatch({
            type: 'ADD_NOTE',
            payload: {
              instrumentId,
              position,
              symbol: dragStateRef.current.currentNote.symbol,
              modifier: dragStateRef.current.currentNote.modifier
            }
          })
        }
        break
        
      case 'delete':
        // Delete mode: Remove note if exists
        if (hasNote) {
          dispatch({
            type: 'REMOVE_NOTE',
            payload: { instrumentId, position }
          })
        }
        break
        
      case 'select':
        // Selection mode: Update area selection
        const startCell = dragStateRef.current.startCell
        const selectedCells = getSelectedCellsBetween(
          startCell,
          { instrumentId, position },
          state.project.sections[state.project.currentSection]
        )
        dispatch({ type: 'SET_SELECTION', payload: Array.from(selectedCells) })
        break
    }
  }, [dispatch, state])
  
  const handleMouseUp = useCallback(() => {
    if (dragStateRef.current.isDragging) {
      dragStateRef.current = {
        isDragging: false,
        dragMode: null,
        startCell: null,
        lastCell: null,
        paintedCells: new Set(),
        currentNote: null
      }
    }
  }, [])
  
  const handleDoubleClick = useCallback((instrumentId, position) => {
    const section = state.project.sections[state.project.currentSection]
    const instrument = section?.instruments.find(i => i.id === instrumentId)
    const note = instrument?.pattern.find(n => n.position === position)
    
    if (note) {
      // Find beat and subdivision from position
      const beatSubdivisions = section.grid.beatSubdivisions || 
        Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions)
      
      let beatIndex = 0
      let remainingPosition = position
      
      while (beatIndex < beatSubdivisions.length && remainingPosition >= beatSubdivisions[beatIndex]) {
        remainingPosition -= beatSubdivisions[beatIndex]
        beatIndex++
      }
      
      dispatch({
        type: 'OPEN_EDIT_MODAL',
        payload: {
          instrumentId,
          beatIndex,
          subdivision: remainingPosition,
          symbol: note.symbol,
          modifier: note.modifier,
          position
        }
      })
    }
  }, [dispatch, state])
  
  // Set up global mouse event listeners
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleMouseUp()
    }
    
    const handleGlobalMouseLeave = (e) => {
      // If mouse leaves the window, stop dragging
      if (!e.relatedTarget) {
        handleMouseUp()
      }
    }
    
    const handleGlobalClick = (e) => {
      // Clear selection if clicking outside grid cells
      // Only clear if not using modifier keys and not currently dragging
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !dragStateRef.current.isDragging) {
        // Check if the click target is a grid cell
        const isGridCell = e.target.closest('[data-grid-cell]')
        if (!isGridCell && state.ui.selectedSteps.size > 0) {
          dispatch({ type: 'CLEAR_SELECTION' })
        }
      }
    }
    
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('mouseleave', handleGlobalMouseLeave)
    document.addEventListener('click', handleGlobalClick)
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mouseleave', handleGlobalMouseLeave)
      document.removeEventListener('click', handleGlobalClick)
    }
  }, [handleMouseUp, dispatch, state.ui.selectedSteps])
  
  return {
    handleCellMouseDown,
    handleCellMouseEnter,
    handleDoubleClick,
    isDragging: () => dragStateRef.current.isDragging,
    getDragMode: () => dragStateRef.current.dragMode
  }
}

// Helper function to get all cells between two points
function getSelectedCellsBetween(startCell, endCell, section) {
  if (!section) return new Set()
  
  const selectedCells = new Set()
  const instruments = section.instruments
  
  // Find instrument indices
  const startInstrumentIndex = instruments.findIndex(i => i.id === startCell.instrumentId)
  const endInstrumentIndex = instruments.findIndex(i => i.id === endCell.instrumentId)
  
  const minInstrument = Math.min(startInstrumentIndex, endInstrumentIndex)
  const maxInstrument = Math.max(startInstrumentIndex, endInstrumentIndex)
  
  const minPosition = Math.min(startCell.position, endCell.position)
  const maxPosition = Math.max(startCell.position, endCell.position)
  
  // Select all cells in the rectangle
  for (let i = minInstrument; i <= maxInstrument; i++) {
    const instrument = instruments[i]
    if (!instrument) continue
    
    for (let pos = minPosition; pos <= maxPosition; pos++) {
      selectedCells.add(`${instrument.id}-${pos}`)
    }
  }
  
  return selectedCells
}