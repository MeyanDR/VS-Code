import { useEffect, useRef } from 'react'
import { parseStepKey, makeStepKey, getSelectedCellsBetween } from '../lib/selection'

export function useKeyboard(dispatch, state) {
  const keysPressed = useRef({
    shift: false,
    ctrl: false,
    meta: false
  })
  
  // Track anchor bounds for keyboard selection (stores min/max of original selection)
  const keyboardAnchor = useRef(null)
  
  // Helper function to extract complete pattern from selected steps
  const getPatternFromSelection = () => {
    const section = state.project.sections[state.project.currentSection]
    if (!section || !state.ui.selectedSteps || state.ui.selectedSteps.size === 0) return null
    
    // Parse all selected cells to find bounds
    const selectedCells = []
    let minBeat = Infinity, maxBeat = -Infinity
    let minSubdiv = Infinity, maxSubdiv = -Infinity
    const instrumentsInvolved = new Set()
    
    state.ui.selectedSteps.forEach(stepKey => {
      const parsed = parseStepKey(stepKey)
      selectedCells.push(parsed)
      instrumentsInvolved.add(parsed.instrumentId)
      
      if (parsed.beatIndex < minBeat) minBeat = parsed.beatIndex
      if (parsed.beatIndex > maxBeat) maxBeat = parsed.beatIndex
      if (parsed.beatIndex === minBeat && parsed.subdivision < minSubdiv) minSubdiv = parsed.subdivision
      if (parsed.beatIndex === maxBeat && parsed.subdivision > maxSubdiv) maxSubdiv = parsed.subdivision
    })
    
    // For multi-beat selections, we need to consider full beat ranges
    const beatSubdivisions = section.grid.beatSubdivisions || 
      Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions || 4)
    
    // Build complete pattern including empty cells
    const pattern = []
    
    instrumentsInvolved.forEach(instrumentId => {
      const instrument = section.instruments.find(i => i.id === instrumentId)
      if (!instrument) return
      
      for (let beat = minBeat; beat <= maxBeat; beat++) {
        const subdivCount = beatSubdivisions[beat] || section.grid.subdivisions
        const startSubdiv = (beat === minBeat) ? minSubdiv : 0
        const endSubdiv = (beat === maxBeat) ? maxSubdiv : subdivCount - 1
        
        for (let subdiv = startSubdiv; subdiv <= endSubdiv; subdiv++) {
          const cellKey = makeStepKey(instrumentId, beat, subdiv)
          
          // Check if this cell is in selection
          if (state.ui.selectedSteps.has(cellKey)) {
            // Find if there's a note at this position
            const note = instrument.pattern.find(n => 
              n.beatIndex === beat && n.subdivision === subdiv
            )
            
            pattern.push({
              instrumentId,
              beatOffset: beat - minBeat,
              subdivOffset: subdiv - minSubdiv,
              hasNote: !!note,
              note: note ? { 
                symbol: note.symbol, 
                modifier: note.modifier 
              } : null
            })
          }
        }
      }
    })
    
    console.log('[Copy] Complete pattern captured:', {
      bounds: { minBeat, maxBeat, minSubdiv, maxSubdiv },
      cellCount: pattern.length,
      noteCount: pattern.filter(p => p.hasNote).length
    })
    
    return {
      bounds: { minBeat, maxBeat, minSubdiv, maxSubdiv },
      pattern
    }
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
              const patternData = getPatternFromSelection()
              if (patternData) {
                dispatch({ 
                  type: 'COPY_SELECTION',
                  payload: { pattern: patternData }
                })
                console.log('[Copy] Copied pattern with', patternData.pattern.length, 'cells')
              }
            } else {
              console.log('[Copy] Nothing selected to copy')
            }
            break
          case 'x':
            e.preventDefault()
            console.log('[Cut] Selected steps:', state.ui.selectedSteps)
            if (state.ui.selectedSteps && state.ui.selectedSteps.size > 0) {
              const selectedStepsArray = Array.from(state.ui.selectedSteps)
              const patternData = getPatternFromSelection()
              if (patternData) {
                dispatch({ 
                  type: 'CUT_SELECTION',
                  payload: { 
                    pattern: patternData,
                    selectedSteps: selectedStepsArray 
                  }
                })
                console.log('[Cut] Cut pattern with', patternData.pattern.length, 'cells')
              }
            } else {
              console.log('[Cut] Nothing selected to cut')
            }
            break
          case 'v':
            e.preventDefault()
            console.log('[Paste] state.ui.clipboard:', state.ui.clipboard)
            
            // Get target position from first selected cell, or default to 0,0
            let targetBeat = 0
            let targetSubdivision = 0
            
            if (state.ui.selectedSteps && state.ui.selectedSteps.size > 0) {
              const firstSelected = Array.from(state.ui.selectedSteps)[0]
              const parsed = parseStepKey(firstSelected)
              targetBeat = parsed.beatIndex || 0
              targetSubdivision = parsed.subdivision || 0
              console.log('[Paste] Using selected cell as target:', { targetBeat, targetSubdivision })
            } else {
              console.log('[Paste] No selection, pasting at 0,0')
            }
            
            dispatch({ 
              type: 'PASTE_SELECTION',
              payload: {
                clipboard: state.ui.clipboard,
                targetBeat,
                targetSubdivision
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
      
      // Escape key - clear selection and anchor
      if (e.key === 'Escape') {
        dispatch({ type: 'CLEAR_SELECTION' })
        keyboardAnchor.current = null
      }
      
      // Check for single character shortcut keys (not with modifiers)
      if (!isModKey && e.key.length === 1 && state.ui.selectedSteps.size > 0) {
        const key = e.key.toLowerCase()
        
        // Don't trigger shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return
        }
        
        // Check all available shortcuts
        const { availableSymbols, availableArticulationModifiers, 
                availableTechniqueModifiers, availableEffectModifiers } = state.ui
        
        // Check symbol shortcuts
        const symbolMatch = availableSymbols.find(s => s.shortcut === key)
        if (symbolMatch) {
          e.preventDefault()
          // Apply this symbol to all selected steps
          const selectedSteps = Array.from(state.ui.selectedSteps)
          selectedSteps.forEach(stepKey => {
            const { instrumentId, beatIndex, subdivision } = parseStepKey(stepKey)
            dispatch({
              type: 'ADD_NOTE',
              payload: {
                instrumentId,
                beatIndex,
                subdivision,
                symbol: symbolMatch.value,
                modifier: state.ui.activeModifier,
                technique: state.ui.activeTechnique,
                effect: state.ui.activeEffect
              }
            })
          })
          // Also set this as the active symbol
          dispatch({ type: 'SET_ACTIVE_SYMBOL', payload: symbolMatch.value })
          return
        }
        
        // Check articulation shortcuts
        const articulationMatch = availableArticulationModifiers.find(m => m.shortcut === key)
        if (articulationMatch) {
          e.preventDefault()
          // Apply this articulation to all selected steps
          const selectedSteps = Array.from(state.ui.selectedSteps)
          const section = state.project.sections[state.project.currentSection]
          
          selectedSteps.forEach(stepKey => {
            const { instrumentId, beatIndex, subdivision } = parseStepKey(stepKey)
            const instrument = section?.instruments.find(i => i.id === instrumentId)
            const existingNote = instrument?.pattern.find(n => 
              n.beatIndex === beatIndex && n.subdivision === subdivision
            )
            
            if (existingNote) {
              // Update existing note, preserving its symbol
              dispatch({
                type: 'UPDATE_NOTE',
                payload: {
                  instrumentId,
                  beatIndex,
                  subdivision,
                  symbol: existingNote.symbol,  // Preserve existing symbol
                  modifier: articulationMatch.value,  // Only update modifier
                  technique: existingNote.technique,
                  effect: existingNote.effect
                }
              })
            }
            // Don't create new notes for modifiers
          })
          // Also set this as the active modifier
          dispatch({ type: 'SET_ACTIVE_MODIFIER', payload: articulationMatch.value })
          return
        }
        
        // Check technique shortcuts
        const techniqueMatch = availableTechniqueModifiers.find(m => m.shortcut === key)
        if (techniqueMatch) {
          e.preventDefault()
          // Apply this technique to all selected steps
          const selectedSteps = Array.from(state.ui.selectedSteps)
          const section = state.project.sections[state.project.currentSection]
          
          selectedSteps.forEach(stepKey => {
            const { instrumentId, beatIndex, subdivision } = parseStepKey(stepKey)
            const instrument = section?.instruments.find(i => i.id === instrumentId)
            const existingNote = instrument?.pattern.find(n => 
              n.beatIndex === beatIndex && n.subdivision === subdivision
            )
            
            if (existingNote) {
              // Update existing note, preserving its symbol
              dispatch({
                type: 'UPDATE_NOTE',
                payload: {
                  instrumentId,
                  beatIndex,
                  subdivision,
                  symbol: existingNote.symbol,  // Preserve existing symbol
                  modifier: existingNote.modifier,
                  technique: techniqueMatch.value,  // Only update technique
                  effect: existingNote.effect
                }
              })
            }
            // Don't create new notes for modifiers
          })
          // Also set this as the active technique
          dispatch({ type: 'SET_ACTIVE_TECHNIQUE', payload: techniqueMatch.value })
          return
        }
        
        // Check effect shortcuts
        const effectMatch = availableEffectModifiers.find(m => m.shortcut === key)
        if (effectMatch) {
          e.preventDefault()
          // Apply this effect to all selected steps
          const selectedSteps = Array.from(state.ui.selectedSteps)
          const section = state.project.sections[state.project.currentSection]
          
          selectedSteps.forEach(stepKey => {
            const { instrumentId, beatIndex, subdivision } = parseStepKey(stepKey)
            const instrument = section?.instruments.find(i => i.id === instrumentId)
            const existingNote = instrument?.pattern.find(n => 
              n.beatIndex === beatIndex && n.subdivision === subdivision
            )
            
            if (existingNote) {
              // Update existing note, preserving its symbol
              dispatch({
                type: 'UPDATE_NOTE',
                payload: {
                  instrumentId,
                  beatIndex,
                  subdivision,
                  symbol: existingNote.symbol,  // Preserve existing symbol
                  modifier: existingNote.modifier,
                  technique: existingNote.technique,
                  effect: effectMatch.value  // Only update effect
                }
              })
            }
            // Don't create new notes for modifiers
          })
          // Also set this as the active effect
          dispatch({ type: 'SET_ACTIVE_EFFECT', payload: effectMatch.value })
          return
        }
      }
      
      // Arrow key navigation
      if (e.key.startsWith('Arrow')) {
        const section = state.project.sections[state.project.currentSection]
        if (!section || state.ui.selectedSteps.size === 0) return
        
        e.preventDefault()
        
        // Determine starting position based on direction for shift selection
        let baseCell;
        const selectedArray = Array.from(state.ui.selectedSteps);
        
        // Find edge cells based on actual position, not array order
        if (e.shiftKey) {
          const parsedCells = selectedArray.map(cell => ({
            key: cell,
            ...parseStepKey(cell)
          }));
          
          if (e.key === 'ArrowRight') {
            // Find rightmost cell (max beatIndex, then max subdivision)
            baseCell = parsedCells.reduce((max, cell) => {
              const maxParsed = parseStepKey(max.key);
              if (cell.beatIndex > maxParsed.beatIndex || 
                  (cell.beatIndex === maxParsed.beatIndex && cell.subdivision > maxParsed.subdivision)) {
                return cell;
              }
              return max;
            }).key;
          } else if (e.key === 'ArrowLeft') {
            // Find leftmost cell (min beatIndex, then min subdivision)
            baseCell = parsedCells.reduce((min, cell) => {
              const minParsed = parseStepKey(min.key);
              if (cell.beatIndex < minParsed.beatIndex || 
                  (cell.beatIndex === minParsed.beatIndex && cell.subdivision < minParsed.subdivision)) {
                return cell;
              }
              return min;
            }).key;
          } else if (e.key === 'ArrowDown') {
            // Find bottom cell (max instrument index)
            const instruments = section.instruments;
            baseCell = parsedCells.reduce((max, cell) => {
              const maxIndex = instruments.findIndex(i => i.id === parseStepKey(max.key).instrumentId);
              const cellIndex = instruments.findIndex(i => i.id === cell.instrumentId);
              return cellIndex > maxIndex ? cell : max;
            }).key;
          } else if (e.key === 'ArrowUp') {
            // Find top cell (min instrument index)
            const instruments = section.instruments;
            baseCell = parsedCells.reduce((min, cell) => {
              const minIndex = instruments.findIndex(i => i.id === parseStepKey(min.key).instrumentId);
              const cellIndex = instruments.findIndex(i => i.id === cell.instrumentId);
              return cellIndex < minIndex ? cell : min;
            }).key;
          } else {
            // For any other key, just use first cell
            baseCell = selectedArray[0];
          }
        } else {
          // For non-shift navigation, start from first selected cell
          baseCell = selectedArray[0];
        }
        
        const { instrumentId, beatIndex, subdivision } = parseStepKey(baseCell)
        
        const instruments = section.instruments
        const instrumentIndex = instruments.findIndex(i => i.id === instrumentId)
        const beatSubdivisions = section.grid.beatSubdivisions || 
          Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions)
        const maxBeats = section.grid.bars * section.grid.beats
        
        let newInstrumentIndex = instrumentIndex
        let newBeatIndex = beatIndex
        let newSubdivision = subdivision
        
        switch(e.key) {
          case 'ArrowLeft':
            newSubdivision--
            if (newSubdivision < 0) {
              newBeatIndex--
              if (newBeatIndex >= 0) {
                newSubdivision = (beatSubdivisions[newBeatIndex] || section.grid.subdivisions) - 1
              } else {
                newBeatIndex = 0
                newSubdivision = 0
              }
            }
            break
            
          case 'ArrowRight':
            newSubdivision++
            const currentBeatSubdivs = beatSubdivisions[newBeatIndex] || section.grid.subdivisions
            if (newSubdivision >= currentBeatSubdivs) {
              newBeatIndex++
              newSubdivision = 0
              if (newBeatIndex >= maxBeats) {
                newBeatIndex = maxBeats - 1
                newSubdivision = (beatSubdivisions[newBeatIndex] || section.grid.subdivisions) - 1
              }
            }
            break
            
          case 'ArrowUp':
            newInstrumentIndex--
            if (newInstrumentIndex < 0) {
              newInstrumentIndex = 0
            }
            break
            
          case 'ArrowDown':
            newInstrumentIndex++
            if (newInstrumentIndex >= instruments.length) {
              newInstrumentIndex = instruments.length - 1
            }
            break
        }
        
        const newInstrument = instruments[newInstrumentIndex]
        if (!newInstrument) return
        
        const newCell = { instrumentId: newInstrument.id, beatIndex: newBeatIndex, subdivision: newSubdivision }
        const newCellKey = makeStepKey(newInstrument.id, newBeatIndex, newSubdivision)
        
        if (e.shiftKey) {
          // Extend selection from anchor bounds
          if (!keyboardAnchor.current) {
            // Store the bounds of the current selection as anchor
            const selectedKeys = Array.from(state.ui.selectedSteps)
            const parsedCells = selectedKeys.map(key => {
              const parsed = parseStepKey(key)
              return { 
                instrumentId: parsed.instrumentId, 
                beatIndex: parsed.beatIndex, 
                subdivision: parsed.subdivision,
                instrumentIndex: instruments.findIndex(i => i.id === parsed.instrumentId)
              }
            })
            
            // Find the bounds of the current selection
            const minInstrumentIdx = Math.min(...parsedCells.map(c => c.instrumentIndex))
            const maxInstrumentIdx = Math.max(...parsedCells.map(c => c.instrumentIndex))
            const minBeat = Math.min(...parsedCells.map(c => c.beatIndex))
            const maxBeat = Math.max(...parsedCells.map(c => c.beatIndex))
            
            // Find min/max subdivisions considering beat context
            let minCell, maxCell
            
            // Find the global min/max positions across ALL cells
            let globalMinBeat = Infinity, globalMinSub = Infinity
            let globalMaxBeat = -Infinity, globalMaxSub = -Infinity
            
            parsedCells.forEach(cell => {
              if (cell.beatIndex < globalMinBeat || 
                  (cell.beatIndex === globalMinBeat && cell.subdivision < globalMinSub)) {
                globalMinBeat = cell.beatIndex
                globalMinSub = cell.subdivision
              }
              if (cell.beatIndex > globalMaxBeat || 
                  (cell.beatIndex === globalMaxBeat && cell.subdivision > globalMaxSub)) {
                globalMaxBeat = cell.beatIndex
                globalMaxSub = cell.subdivision
              }
            })
            
            // Create corner anchors using the true bounds
            minCell = {
              instrumentId: instruments[minInstrumentIdx].id,
              beatIndex: globalMinBeat,
              subdivision: globalMinSub
            }
            maxCell = {
              instrumentId: instruments[maxInstrumentIdx].id,
              beatIndex: globalMaxBeat,
              subdivision: globalMaxSub
            }
            
            keyboardAnchor.current = { minCell, maxCell }
          }
          
          // Extend selection by including both anchor bounds and new position
          const { minCell, maxCell } = keyboardAnchor.current
          
          // Get selection from min anchor to new position
          const cells1 = getSelectedCellsBetween(minCell, newCell, section)
          // Get selection from max anchor to new position  
          const cells2 = getSelectedCellsBetween(maxCell, newCell, section)
          // Merge both ranges
          const allCells = new Set([...cells1, ...cells2])
          
          dispatch({ type: 'SET_SELECTION', payload: Array.from(allCells) })
        } else {
          // Move selection and clear anchor
          keyboardAnchor.current = null
          dispatch({ type: 'SET_SELECTION', payload: [newCellKey] })
        }
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
      const beatSubdivisions = section.grid.beatSubdivisions || 
        Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions)
      
      section.instruments.forEach(instrument => {
        // Iterate through all beats
        const totalBeats = section.grid.bars * section.grid.beats
        for (let beatIndex = 0; beatIndex < totalBeats; beatIndex++) {
          const subdivisions = beatSubdivisions[beatIndex] || section.grid.subdivisions
          for (let subdivision = 0; subdivision < subdivisions; subdivision++) {
            // Check if note exists at this position
            if (instrument.pattern.some(n => 
              n.beatIndex === beatIndex && n.subdivision === subdivision
            )) {
              allSteps.push(makeStepKey(instrument.id, beatIndex, subdivision))
            }
          }
        }
      })
      
      dispatch({ type: 'SET_SELECTION', payload: allSteps })
    }
    
    const deleteSelection = () => {
      const selected = Array.from(state.ui.selectedSteps)
      selected.forEach(stepKey => {
        const { instrumentId, beatIndex, subdivision } = parseStepKey(stepKey)
        dispatch({
          type: 'REMOVE_NOTE',
          payload: { instrumentId, beatIndex, subdivision }
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