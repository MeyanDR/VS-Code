import { useEffect, useRef, useCallback } from 'react'
import { makeStepKey, getSelectedCellsBetween } from '../lib/selection'

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
    selectedCells: new Set(),
    anchorCell: null // Store the anchor point for shift-drag
  })
  
  const handleCellMouseDown = useCallback((instrumentId, beatIndex, subdivision, event) => {
    const { shiftKey, ctrlKey, metaKey } = event
    
    console.log('[handleCellMouseDown] Called with:', { instrumentId, beatIndex, subdivision, shiftKey, ctrlKey, metaKey })
    
    // Prevent text selection while dragging
    event.preventDefault()
    
    const cellKey = makeStepKey(instrumentId, beatIndex, subdivision)
    console.log('[handleCellMouseDown] Created cellKey:', cellKey)

    const hasNote = state.project.sections[state.project.currentSection]
      ?.instruments.find(i => i.id === instrumentId)
      ?.pattern.some(n => {
        if (n.beatIndex !== beatIndex) return false
        // Handle array subdivision paths
        if (Array.isArray(n.subdivision) && Array.isArray(subdivision)) {
          return JSON.stringify(n.subdivision) === JSON.stringify(subdivision)
        }
        return n.subdivision === subdivision
      })
    console.log('[handleCellMouseDown] Has note:', hasNote)
    
    if (ctrlKey || metaKey) {
      // Cmd/Ctrl + Click: Delete mode
      if (hasNote) {
        // Delete single note
        dispatch({
          type: 'REMOVE_NOTE',
          payload: { instrumentId, beatIndex, subdivision }
        })
        
        // Start delete drag mode
        dragStateRef.current = {
          isDragging: true,
          dragMode: 'delete',
          startCell: { instrumentId, beatIndex, subdivision },
          lastCell: { instrumentId, beatIndex, subdivision },
          paintedCells: new Set([cellKey]),
          currentNote: null
        }
      }
    } else if (shiftKey) {
      // Shift + Click: Selection mode (like Word text selection)
      console.log('[handleCellMouseDown] Shift click - starting selection')
      console.log('[handleCellMouseDown] Current selectedSteps:', Array.from(state.ui.selectedSteps))
      
      // Only do range selection if there's an existing selection
      if (state.ui.selectedSteps.size > 0 && selectionRef.current.anchorCell) {
        // Calculate range from anchor to clicked cell
        const selectedCells = getSelectedCellsBetween(
          selectionRef.current.anchorCell,
          { instrumentId, beatIndex, subdivision },
          state.project.sections[state.project.currentSection]
        )
        
        // Set the selection (don't merge, just replace)
        dispatch({ type: 'SET_SELECTION', payload: Array.from(selectedCells) })
        
        // Start selection drag from anchor
        dragStateRef.current = {
          isDragging: true,
          dragMode: 'select',
          startCell: selectionRef.current.anchorCell,
          lastCell: { instrumentId, beatIndex, subdivision },
          paintedCells: new Set([cellKey]),
          currentNote: null
        }
      } else {
        // No selection exists - treat as regular click
        selectionRef.current.anchorCell = { instrumentId, beatIndex, subdivision }
        dispatch({ type: 'SET_SELECTION', payload: [cellKey] })
      }
    } else {
      // Plain Click/Drag: Add/Edit/Paint mode OR Select-Only mode
      
      // Set anchor point for future shift+click selections
      selectionRef.current.anchorCell = { instrumentId, beatIndex, subdivision }
      
      // Check if we're in select-only mode
      const selectOnlyMode = state.ui.selectOnlyMode
      
      if (selectOnlyMode) {
        // Select-Only Mode: Only select the cell, don't add/edit notes
        console.log('[handleCellMouseDown] Select-only mode - just selecting cell')
        
        // Clear previous selection and select only this cell
        dispatch({ type: 'SET_SELECTION', payload: [cellKey] })
        
        // Start selection drag (not paint)
        dragStateRef.current = {
          isDragging: true,
          dragMode: 'select',
          startCell: { instrumentId, beatIndex, subdivision },
          lastCell: { instrumentId, beatIndex, subdivision },
          paintedCells: new Set([cellKey]),
          currentNote: null
        }
      } else {
        // Write Mode: Normal behavior
        if (hasNote) {
          // Click on existing note: Open edit modal
          const note = state.project.sections[state.project.currentSection]
            ?.instruments.find(i => i.id === instrumentId)
            ?.pattern.find(n => {
              if (n.beatIndex !== beatIndex) return false
              // Handle array subdivision paths
              if (Array.isArray(n.subdivision) && Array.isArray(subdivision)) {
                return JSON.stringify(n.subdivision) === JSON.stringify(subdivision)
              }
              return n.subdivision === subdivision
            })
          
          if (note) {
            dispatch({
              type: 'OPEN_EDIT_MODAL',
              payload: {
                instrumentId,
                beatIndex,
                subdivision,
                symbol: note.symbol,
                modifier: note.modifier
              }
            })
          }
        } else {
          // Add note and start paint mode
          dispatch({
            type: 'ADD_NOTE',
            payload: {
              instrumentId,
              beatIndex,
              subdivision,
              symbol: state.ui.activeSymbol,
              modifier: state.ui.activeModifier,
              technique: state.ui.activeTechnique,
              effect: state.ui.activeEffect
            }
          })
          
          dragStateRef.current = {
            isDragging: true,
            dragMode: 'paint',
            startCell: { instrumentId, beatIndex, subdivision },
            lastCell: { instrumentId, beatIndex, subdivision },
            paintedCells: new Set([cellKey]),
            currentNote: {
              symbol: state.ui.activeSymbol,
              modifier: state.ui.activeModifier,
              technique: state.ui.activeTechnique,
              effect: state.ui.activeEffect
            }
          }
        }
        
        // Select the clicked cell after adding note
        dispatch({ type: 'SET_SELECTION', payload: [cellKey] })
      }
    }
  }, [dispatch, state])
  
  const handleCellMouseEnter = useCallback((instrumentId, beatIndex, subdivision, event) => {
    if (!dragStateRef.current.isDragging) return
    
    const cellKey = makeStepKey(instrumentId, beatIndex, subdivision)
    const { dragMode, paintedCells } = dragStateRef.current
    
    // Don't process the same cell twice during the same drag
    if (paintedCells.has(cellKey)) return
    
    dragStateRef.current.lastCell = { instrumentId, beatIndex, subdivision }
    paintedCells.add(cellKey)
    
    const hasNote = state.project.sections[state.project.currentSection]
      ?.instruments.find(i => i.id === instrumentId)
      ?.pattern.some(n => {
        if (n.beatIndex !== beatIndex) return false
        // Handle array subdivision paths
        if (Array.isArray(n.subdivision) && Array.isArray(subdivision)) {
          return JSON.stringify(n.subdivision) === JSON.stringify(subdivision)
        }
        return n.subdivision === subdivision
      })

    switch (dragMode) {
      case 'paint':
        // Paint mode: Add note with same symbol/modifier
        if (!hasNote && dragStateRef.current.currentNote) {
          dispatch({
            type: 'ADD_NOTE',
            payload: {
              instrumentId,
              beatIndex,
              subdivision,
              symbol: dragStateRef.current.currentNote.symbol,
              modifier: dragStateRef.current.currentNote.modifier,
              technique: dragStateRef.current.currentNote.technique,
              effect: dragStateRef.current.currentNote.effect
            }
          })
        }
        break
        
      case 'delete':
        // Delete mode: Remove note if exists
        if (hasNote) {
          dispatch({
            type: 'REMOVE_NOTE',
            payload: { instrumentId, beatIndex, subdivision }
          })
        }
        break
        
      case 'select':
        // Selection mode: Calculate selection from anchor to current position
        // This works like Word - selection is always just the range from anchor to current
        const anchorCell = selectionRef.current.anchorCell || dragStateRef.current.startCell
        const selectedCells = getSelectedCellsBetween(
          anchorCell,
          { instrumentId, beatIndex, subdivision },
          state.project.sections[state.project.currentSection]
        )
        
        // Replace entire selection (don't merge/accumulate)
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
      
      // Don't clear anchor point - keep it for future shift+clicks
      // Only clear anchor when clicking without shift key (handled in handleCellMouseDown)
    }
  }, [])
  
  const handleDoubleClick = useCallback((instrumentId, beatIndex, subdivision) => {
    const section = state.project.sections[state.project.currentSection]
    const instrument = section?.instruments.find(i => i.id === instrumentId)
    const note = instrument?.pattern.find(n => {
      if (n.beatIndex !== beatIndex) return false
      // Handle array subdivision paths
      if (Array.isArray(n.subdivision) && Array.isArray(subdivision)) {
        return JSON.stringify(n.subdivision) === JSON.stringify(subdivision)
      }
      return n.subdivision === subdivision
    })
    
    if (note) {
      dispatch({
        type: 'OPEN_EDIT_MODAL',
        payload: {
          instrumentId,
          beatIndex,
          subdivision,
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
    
    const handleGlobalClick = (e) => {
      // Clear selection if clicking outside grid cells
      // Only clear if not using modifier keys and not currently dragging
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !dragStateRef.current.isDragging) {
        // Check if the click target is a grid cell
        const isGridCell = e.target.closest('[data-grid-cell]')
        if (!isGridCell && state.ui.selectedSteps.size > 0) {
          dispatch({ type: 'CLEAR_SELECTION' })
          selectionRef.current.anchorCell = null  // Clear the anchor!
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

