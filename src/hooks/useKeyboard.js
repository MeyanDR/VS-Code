import { useEffect, useRef } from 'react'

export function useKeyboard(dispatch, state) {
  const keysPressed = useRef({
    shift: false,
    ctrl: false,
    meta: false
  })
  
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
            if (e.shiftKey) {
              dispatch({ type: 'REDO' })
            } else {
              dispatch({ type: 'UNDO' })
            }
            break
          case 'y':
            e.preventDefault()
            dispatch({ type: 'REDO' })
            break
          case 'c':
            e.preventDefault()
            dispatch({ type: 'COPY_SELECTION' })
            break
          case 'x':
            e.preventDefault()
            dispatch({ type: 'CUT_SELECTION' })
            break
          case 'v':
            e.preventDefault()
            dispatch({ type: 'PASTE_SELECTION' })
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
        const [instrumentId, position] = stepKey.split('-')
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