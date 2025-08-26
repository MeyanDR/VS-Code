import { useEffect, useRef, useCallback } from 'react'

export function useInteraction(dispatch, state) {
  const dragStateRef = useRef({
    isDragging: false,
    dragMode: null, // 'paint' | 'select' | 'erase'
    startCell: null,
    lastCell: null,
    paintedCells: new Set()
  })
  
  const selectionRef = useRef({
    isSelecting: false,
    startPoint: null,
    endPoint: null,
    selectedCells: new Set()
  })
  
  const handleCellMouseDown = useCallback((instrumentId, position, event) => {
    const { shiftKey, ctrlKey, metaKey, altKey } = event
    
    // Prevent text selection while dragging
    event.preventDefault()
    
    const cellKey = `${instrumentId}-${position}`
    const hasNote = state.project.sections[state.project.currentSection]
      ?.instruments.find(i => i.id === instrumentId)
      ?.pattern.some(n => n.position === position)
    
    if (shiftKey) {
      // Start selection
      dragStateRef.current = {
        isDragging: true,
        dragMode: 'select',
        startCell: { instrumentId, position },
        lastCell: { instrumentId, position },
        paintedCells: new Set([cellKey])
      }
      
      dispatch({ type: 'SET_SELECTION', payload: [cellKey] })
    } else if (altKey) {
      // Start erase mode
      dragStateRef.current = {
        isDragging: true,
        dragMode: 'erase',
        startCell: { instrumentId, position },
        lastCell: { instrumentId, position },
        paintedCells: new Set([cellKey])
      }
      
      if (hasNote) {
        dispatch({
          type: 'REMOVE_NOTE',
          payload: { instrumentId, position }
        })
      }
    } else if (ctrlKey || metaKey) {
      // Toggle selection
      if (state.ui.selectedSteps.has(cellKey)) {
        dispatch({ type: 'REMOVE_FROM_SELECTION', payload: cellKey })
      } else {
        dispatch({ type: 'ADD_TO_SELECTION', payload: cellKey })
      }
    } else {
      // Start paint mode or toggle single note
      if (hasNote) {
        // Remove note
        dispatch({
          type: 'REMOVE_NOTE',
          payload: { instrumentId, position }
        })
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
          paintedCells: new Set([cellKey])
        }
      }
      
      // Clear selection if not using modifier keys
      if (!ctrlKey && !metaKey) {
        dispatch({ type: 'CLEAR_SELECTION' })
      }
    }
  }, [dispatch, state])
  
  const handleCellMouseEnter = useCallback((instrumentId, position, event) => {
    if (!dragStateRef.current.isDragging) return
    
    const cellKey = `${instrumentId}-${position}`
    const { dragMode, paintedCells } = dragStateRef.current
    
    // Don't process the same cell twice
    if (paintedCells.has(cellKey)) return
    
    dragStateRef.current.lastCell = { instrumentId, position }
    paintedCells.add(cellKey)
    
    switch (dragMode) {
      case 'paint':
        dispatch({
          type: 'ADD_NOTE',
          payload: {
            instrumentId,
            position,
            symbol: state.ui.activeSymbol,
            modifier: state.ui.activeModifier
          }
        })
        break
        
      case 'erase':
        dispatch({
          type: 'REMOVE_NOTE',
          payload: { instrumentId, position }
        })
        break
        
      case 'select':
        // Add to selection
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
        paintedCells: new Set()
      }
    }
  }, [])
  
  const handleDoubleClick = useCallback((instrumentId, position) => {
    const section = state.project.sections[state.project.currentSection]
    const instrument = section?.instruments.find(i => i.id === instrumentId)
    const note = instrument?.pattern.find(n => n.position === position)
    
    if (note) {
      dispatch({
        type: 'OPEN_EDIT_MODAL',
        payload: {
          instrumentId,
          position,
          symbol: note.symbol,
          modifier: note.modifier
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
    
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('mouseleave', handleGlobalMouseLeave)
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mouseleave', handleGlobalMouseLeave)
    }
  }, [handleMouseUp])
  
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