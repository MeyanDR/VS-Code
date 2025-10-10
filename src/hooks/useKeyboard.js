import { useEffect, useRef } from 'react'
import { parseStepKey } from '../lib/selection'

export function useKeyboard(dispatch, state) {
  const keysPressed = useRef({
    shift: false,
    ctrl: false,
    meta: false
  })
  
  // Helper function to extract note data from selected steps
  const getNotesFromSelection = () => {
    const section = state.project.sections[state.project.currentSection]
    if (!section || !state.ui.selectedSteps) return []
    
    const notes = []
    const beatSubdivisions = section.grid.beatSubdivisions || 
      Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions || 4)
    
    state.ui.selectedSteps.forEach(stepKey => {
      const { instrumentId, position } = parseStepKey(stepKey)
      
      console.log('[Copy] Looking for note:', { instrumentId, position })
      const instrument = section.instruments.find(i => i.id === instrumentId)
      if (instrument) {
        console.log('[Copy] Found instrument, pattern:', instrument.pattern)
        const note = instrument.pattern.find(n => n.position === position)
        if (note) {
          console.log('[Copy] Found note:', note)
          // Ensure note has beatIndex and subdivision
          let beatIndex = note.beatIndex
          let subdivision = note.subdivision
          
          // Calculate beatIndex and subdivision if not present
          if (beatIndex === undefined || subdivision === undefined) {
            let remainingPosition = position
            beatIndex = 0
            
            // Find which beat this position falls into
            while (beatIndex < beatSubdivisions.length && remainingPosition >= beatSubdivisions[beatIndex]) {
              remainingPosition -= beatSubdivisions[beatIndex]
              beatIndex++
            }
            
            subdivision = remainingPosition
          }
          
          notes.push({
            ...note,
            beatIndex: beatIndex,
            subdivision: subdivision,
            instrumentId: instrumentId  // Add instrument ID to note data
          })
        } else {
          console.log('[Copy] No note found at position:', position)
        }
      } else {
        console.log('[Copy] No instrument found with id:', instrumentId)
      }
    })
    
    return notes
  }
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current.shift = e.shiftKey
      keysPressed.current.ctrl = e.ctrlKey
      keysPressed.current.meta = e.metaKey
      
      const isModKey = e.ctrlKey || e.metaKey
      
      if (isModKey) {
        switch(e.key.toLowerCase()) {
          case 'z':
            e.preventDefault()
            dispatch({ type: 'UNDO' })
            break
          case 'y':
            e.preventDefault()
            dispatch({ type: 'REDO' })
            break
          case 'c':
            e.preventDefault()
            console.log('[Copy] Selected steps:', state.ui.selectedSteps)
            if (state.ui.selectedSteps && state.ui.selectedSteps.size > 0) {
              const noteData = getNotesFromSelection()
              console.log('[Copy] Note data to copy:', noteData)
              dispatch({ 
                type: 'COPY_SELECTION',
                payload: { notes: noteData }
              })
              console.log('[Copy] Copied', noteData.length, 'notes')
            } else {
              console.log('[Copy] Nothing selected to copy')
            }
            break
          case 'x':
            e.preventDefault()
            console.log('[Cut] Selected steps:', state.ui.selectedSteps)
            if (state.ui.selectedSteps && state.ui.selectedSteps.size > 0) {
              // Store selectedSteps BEFORE any dispatch to avoid race condition
              const selectedStepsArray = Array.from(state.ui.selectedSteps)
              const noteData = getNotesFromSelection()
              console.log('[Cut] Note data to cut:', noteData)
              console.log('[Cut] Selected steps array:', selectedStepsArray)
              
              // Single dispatch with unified payload for both reducers
              dispatch({ 
                type: 'CUT_SELECTION',
                payload: { 
                  notes: noteData,
                  selectedSteps: selectedStepsArray 
                }
              })
              console.log('[Cut] Cut', noteData.length, 'notes')
            } else {
              console.log('[Cut] Nothing selected to cut')
            }
            break
          case 'v':
            e.preventDefault()
            console.log('[Paste] state.ui.clipboard:', state.ui.clipboard)
            console.log('[Paste] state.clipboard:', state.clipboard)
            // Fix: Use state.ui.clipboard (where it's actually stored)
            dispatch({ 
              type: 'PASTE_SELECTION',
              payload: {
                clipboard: state.ui.clipboard,
                targetBeat: 0,
                targetSubdivision: 0
              }
            })
            break
          case 'a':
            e.preventDefault()
            selectAll()
            break
          case 's':
            e.preventDefault()
            // Trigger save
            const event = new CustomEvent('save-project')
            window.dispatchEvent(event)
            break
        }
      }
      
      // Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.ui.selectedSteps.size > 0) {
          e.preventDefault()
          deleteSelection()
        }
      }
      
      // Escape key - clear selection
      if (e.key === 'Escape') {
        dispatch({ type: 'CLEAR_SELECTION' })
      }
    }
    
    const handleKeyUp = (e) => {
      keysPressed.current.shift = e.shiftKey
      keysPressed.current.ctrl = e.ctrlKey
      keysPressed.current.meta = e.metaKey
    }
    
    const selectAll = () => {
      const section = state.project.sections[state.project.currentSection]
      if (!section) return
      
      const allSteps = []
      const totalSteps = section.grid.bars * section.grid.beats * section.grid.subdivisions
      
      section.instruments.forEach(instrument => {
        for (let i = 0; i < totalSteps; i++) {
          if (instrument.pattern.some(n => n.position === i)) {
            allSteps.push(`${instrument.id}-${i}`)
          }
        }
      })
      
      dispatch({ type: 'SET_SELECTION', payload: allSteps })
    }
    
    const deleteSelection = () => {
      const selected = Array.from(state.ui.selectedSteps)
      selected.forEach(stepKey => {
        const { instrumentId, position } = parseStepKey(stepKey)
        dispatch({
          type: 'REMOVE_NOTE',
          payload: { instrumentId, position: parseInt(position) }
        })
      })
      dispatch({ type: 'CLEAR_SELECTION' })
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [dispatch, state])
  
  return keysPressed.current
}

// Export a singleton-like function for components that need to check key states
let globalKeysPressed = { shift: false, ctrl: false, meta: false }

export function getKeyboardState() {
  return globalKeysPressed
}

export function updateKeyboardState(keys) {
  globalKeysPressed = { ...keys }
}
