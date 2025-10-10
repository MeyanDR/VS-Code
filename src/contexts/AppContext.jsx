import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { migrateProjectToNewFormat } from '../utils/patternMigration'
import { arrayMove } from '@dnd-kit/sortable'

const initialState = {
  schemaVersion: 2,  // Version 2: Changed from 4 drum instruments to single "Instrument 1"
  project: {
    name: 'Untitled',
    sections: {
      'intro': {
        id: 'intro',
        name: 'Intro',
        notes: '',
        instruments: [
          {
            id: 'instrument1',
            name: 'Instrument 1',
            midiNote: 60,
            visible: true,
            groupId: null,
            groupColor: null,
            order: 0,
            pattern: []
          }
        ],
        grid: {
          bars: 4,
          beats: 4,
          subdivisions: 4,  // Keep for backward compatibility
          beatSubdivisions: Array(16).fill(4)  // 4 bars * 4 beats = 16 beats total
        }
      }
    },
    currentSection: 'intro'
  },
  ui: {
    selectedSteps: new Set(),
    activeSymbol: 'o',
    activeModifier: '',
    editingStep: null,
    dragMode: null,
    isDragging: false,
    clipboard: null
  },
  layout: {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
    barsPerLine: { min: 2, max: 4 },
    cellWidth: 20,
    beatGap: 4,
    sectionGap: 30,
    showBarNumbers: true,
    showBeatNumbers: true,
    showLegend: true,
    textScale: 1.0
  },
  breaks: [],
  history: {
    past: [],
    present: null,
    future: []
  },
  themes: {
    current: 'default',
    presets: {
      'default': {
        backgroundColor: '#0f172a',
        noteColor: '#ffffff',
        gridColor: '#374151',
        fontFamily: 'monospace'
      },
      'classic-engraved': {
        backgroundColor: '#f5f5dc',
        noteColor: '#000000',
        gridColor: '#333333',
        fontFamily: 'serif'
      },
      'modern-minimal': {
        backgroundColor: '#ffffff',
        noteColor: '#000000',
        gridColor: '#e5e5e5',
        fontFamily: 'sans-serif'
      },
      'jazz-standard': {
        backgroundColor: '#f9f7f4',
        noteColor: '#2c3e50',
        gridColor: '#bdc3c7',
        fontFamily: 'Georgia, serif'
      }
    }
  },
  midi: {
    imported: false,
    quantization: 16,
    velocityThreshold: 64
  }
}

const AppContext = createContext()

function shouldAddToHistory(action) {
  const historyActions = [
    'ADD_NOTE', 'REMOVE_NOTE', 'UPDATE_NOTE', 'CLEAR_ALL',
    'UPDATE_GRID', 'PASTE_SELECTION', 'CUT_SELECTION',
    'UPDATE_BEAT_SUBDIVISION'
  ]
  return historyActions.includes(action.type)
}

function projectReducer(state = initialState.project, action) {
  switch (action.type) {
    case 'ADD_NOTE': {
      const section = state.sections[state.currentSection]
      const instrument = section.instruments.find(i => i.id === action.payload.instrumentId)
      if (!instrument) return state
      
      const newPattern = [...instrument.pattern]
      const beatSubdivisions = section.grid.beatSubdivisions || Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions)
      
      // Calculate position and beat/subdivision
      let position = action.payload.position
      let beatIndex = action.payload.beatIndex
      let subdivision = action.payload.subdivision
      
      if (beatIndex !== undefined && subdivision !== undefined) {
        // Calculate position from beat and subdivision
        position = 0
        for (let i = 0; i < beatIndex; i++) {
          position += beatSubdivisions[i] || 4
        }
        position += subdivision
      } else if (position !== undefined) {
        // Calculate beat and subdivision from position
        let remainingPosition = position
        beatIndex = 0
        
        while (beatIndex < beatSubdivisions.length && remainingPosition >= beatSubdivisions[beatIndex]) {
          remainingPosition -= beatSubdivisions[beatIndex]
          beatIndex++
        }
        
        subdivision = remainingPosition
      }
      
      // Find existing note at this position - use CALCULATED values, not payload values
      const existingIndex = newPattern.findIndex(n => {
        // Always use the calculated beatIndex and subdivision for comparison
        if (beatIndex !== undefined && subdivision !== undefined) {
          return n.beatIndex === beatIndex && n.subdivision === subdivision
        }
        return n.position === position
      })
      
      const newNote = {
        position: position,
        beatIndex: beatIndex,
        subdivision: subdivision,
        symbol: action.payload.symbol,
        modifier: action.payload.modifier
      }
      
      if (existingIndex >= 0) {
        newPattern[existingIndex] = newNote
      } else {
        newPattern.push(newNote)
      }
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            instruments: section.instruments.map(i => 
              i.id === action.payload.instrumentId 
                ? { ...i, pattern: newPattern }
                : i
            )
          }
        }
      }
    }
    
    case 'REMOVE_NOTE': {
      const section = state.sections[state.currentSection]
      const instrument = section.instruments.find(i => i.id === action.payload.instrumentId)
      if (!instrument) return state
      
      const newPattern = instrument.pattern.filter(n => {
        if (action.payload.beatIndex !== undefined && action.payload.subdivision !== undefined) {
          return !(n.beatIndex === action.payload.beatIndex && n.subdivision === action.payload.subdivision)
        }
        return n.position !== action.payload.position
      })
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            instruments: section.instruments.map(i => 
              i.id === action.payload.instrumentId 
                ? { ...i, pattern: newPattern }
                : i
            )
          }
        }
      }
    }
    
    case 'UPDATE_NOTE': {
      const section = state.sections[state.currentSection]
      const instrument = section.instruments.find(i => i.id === action.payload.instrumentId)
      if (!instrument) return state
      
      const newPattern = instrument.pattern.map(n => {
        const isTarget = action.payload.beatIndex !== undefined && action.payload.subdivision !== undefined
          ? (n.beatIndex === action.payload.beatIndex && n.subdivision === action.payload.subdivision)
          : n.position === action.payload.position
        
        if (isTarget) {
          return {
            ...n,
            symbol: action.payload.symbol,
            modifier: action.payload.modifier
          }
        }
        return n
      })
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            instruments: section.instruments.map(i => 
              i.id === action.payload.instrumentId 
                ? { ...i, pattern: newPattern }
                : i
            )
          }
        }
      }
    }
    
    case 'SET_PROJECT_NAME':
      return { ...state, name: action.payload }
    
    case 'LOAD_PROJECT':
      // Migrate project to new format if needed
      return migrateProjectToNewFormat(action.payload)
    
    case 'IMPORT_MIDI_PATTERN':
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...state.sections[state.currentSection],
            instruments: action.payload.instruments
          }
        }
      }
    
    case 'UPDATE_GRID':
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...state.sections[state.currentSection],
            grid: action.payload
          }
        }
      }
    
    case 'TOGGLE_INSTRUMENT_VISIBILITY': {
      const section = state.sections[state.currentSection]
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            instruments: section.instruments.map(i => 
              i.id === action.payload.instrumentId 
                ? { ...i, visible: !i.visible }
                : i
            )
          }
        }
      }
    }
    
    case 'UPDATE_INSTRUMENT_SETTINGS': {
      const section = state.sections[state.currentSection]
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            instruments: section.instruments.map(i => 
              i.id === action.payload.instrumentId 
                ? { 
                    ...i, 
                    subdivision: action.payload.settings.subdivision || i.subdivision,
                    beats: action.payload.settings.beats || i.beats,
                    measures: action.payload.settings.measures || i.measures
                  }
                : i
            )
          }
        }
      }
    }
    
    case 'UPDATE_INSTRUMENT_NAME': {
      const section = state.sections[state.currentSection]
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            instruments: section.instruments.map(i => 
              i.id === action.payload.instrumentId 
                ? { ...i, name: action.payload.name }
                : i
            )
          }
        }
      }
    }
    
    case 'UPDATE_BEAT_SUBDIVISION': {
      const section = state.sections[state.currentSection]
      const beatIndex = action.payload.beatIndex
      const newSubdivision = action.payload.subdivision
      const newBeatSubdivisions = [...section.grid.beatSubdivisions]
      newBeatSubdivisions[beatIndex] = newSubdivision
      
      console.log('UPDATE_BEAT_SUBDIVISION reducer:', {
        beatIndex,
        newSubdivision,
        oldValue: section.grid.beatSubdivisions[beatIndex],
        newBeatSubdivisions
      })
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            grid: {
              ...section.grid,
              beatSubdivisions: newBeatSubdivisions
            }
          }
        }
      }
    }
    
    case 'REORDER_INSTRUMENTS': {
      const section = state.sections[state.currentSection]
      const { oldIndex, newIndex } = action.payload
      const instruments = [...section.instruments]
      const [movedInstrument] = instruments.splice(oldIndex, 1)
      instruments.splice(newIndex, 0, movedInstrument)
      
      // Update order property for all instruments
      const reorderedInstruments = instruments.map((inst, index) => ({
        ...inst,
        order: index
      }))
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            instruments: reorderedInstruments
          }
        }
      }
    }
    
    case 'ADD_INSTRUMENT': {
      const section = state.sections[state.currentSection]
      
      // Find the highest existing instrument number
      const existingNumbers = section.instruments
        .filter(i => i.name.startsWith('Instrument '))
        .map(i => {
          const num = parseInt(i.name.replace('Instrument ', ''))
          return isNaN(num) ? 0 : num
        })
      
      const nextNumber = existingNumbers.length > 0 
        ? Math.max(...existingNumbers) + 1 
        : 1
      
      const newInstrument = {
        id: `instrument${Date.now()}`,
        name: `Instrument ${nextNumber}`,
        midiNote: 60 + (nextNumber - 1), // Start at middle C and increment
        visible: true,
        groupId: null,
        groupColor: null,
        order: section.instruments.length,
        pattern: []
      }
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            instruments: [...section.instruments, newInstrument]
          }
        }
      }
    }
    
    case 'CLEAR_ALL':
      const section = state.sections[state.currentSection]
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            instruments: section.instruments.map(i => ({ ...i, pattern: [] }))
          }
        }
      }
    
    case 'CUT_SELECTION': {
      const selectedSteps = action.payload.selectedSteps
      console.log('[projectReducer CUT] selectedSteps to remove:', selectedSteps)
      const section = state.sections[state.currentSection]
      const updatedInstruments = section.instruments.map(instrument => {
        const newPattern = instrument.pattern.filter(note => {
          // Match the format used in selectedSteps: {instrumentId}-{position}
          const stepKey = `${instrument.id}-${note.position}`
          const shouldKeep = !selectedSteps.includes(stepKey)
          if (!shouldKeep) {
            console.log(`[projectReducer CUT] Removing note at ${stepKey}`)
          }
          return shouldKeep
        })
        return { ...instrument, pattern: newPattern }
      })
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            instruments: updatedInstruments
          }
        }
      }
    }
    
    case 'PASTE_SELECTION': {
      const clipboard = action.payload.clipboard
      const targetBeat = action.payload.targetBeat || 0
      const targetSubdivision = action.payload.targetSubdivision || 0
      
      console.log('[projectReducer PASTE] clipboard:', clipboard)
      console.log('[projectReducer PASTE] targetBeat:', targetBeat, 'targetSubdivision:', targetSubdivision)
      
      // Check if we have the new notes format
      if (!clipboard || (!clipboard.notes || clipboard.notes.length === 0)) {
        console.log('[projectReducer PASTE] No note data in clipboard, aborting')
        return state
      }
      
      const section = state.sections[state.currentSection]
      const beatSubdivisions = section.grid.beatSubdivisions || Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions)
      
      // Find minimum position from the notes to calculate offset
      let minBeat = Infinity
      let minSubdiv = Infinity
      
      clipboard.notes.forEach(note => {
        // Skip notes without valid beatIndex/subdivision
        if (note.beatIndex === undefined || note.subdivision === undefined) {
          console.log('[PASTE] Warning: Note missing beatIndex/subdivision:', note)
          return
        }
        
        if (note.beatIndex < minBeat || (note.beatIndex === minBeat && note.subdivision < minSubdiv)) {
          minBeat = note.beatIndex
          minSubdiv = note.subdivision
        }
      })
      
      // If no valid notes found, abort paste
      if (minBeat === Infinity || minSubdiv === Infinity) {
        console.log('[PASTE] No valid notes to paste (all missing beatIndex/subdivision)')
        return state
      }
      
      const beatOffset = targetBeat - minBeat
      const subdivOffset = targetSubdivision - minSubdiv
      
      console.log('[PASTE] Found min position - beat:', minBeat, 'subdiv:', minSubdiv)
      console.log('[PASTE] Offsets - beat:', beatOffset, 'subdiv:', subdivOffset)
      console.log('[PASTE] Notes to paste:', clipboard.notes)
      
      const updatedInstruments = section.instruments.map(instrument => {
        // Filter notes for this instrument
        const notesToPaste = clipboard.notes.filter(n => n.instrumentId === instrument.id)
        
        if (notesToPaste.length === 0) {
          return instrument
        }
        
        console.log(`[PASTE] Pasting ${notesToPaste.length} notes to instrument ${instrument.id}`)
        
        const existingNotes = [...instrument.pattern]
        
        notesToPaste.forEach(note => {
          const newBeat = note.beatIndex + beatOffset
          const newSubdiv = note.subdivision + subdivOffset
          
          // Adjust subdivision overflow
          let finalBeat = newBeat
          let finalSubdiv = newSubdiv
          
          while (finalSubdiv >= (beatSubdivisions[finalBeat] || section.grid.subdivisions)) {
            finalSubdiv -= (beatSubdivisions[finalBeat] || section.grid.subdivisions)
            finalBeat++
          }
          
          while (finalSubdiv < 0) {
            finalBeat--
            finalSubdiv += (beatSubdivisions[finalBeat] || section.grid.subdivisions)
          }
          
          // Check bounds
          const maxBeats = section.grid.bars * section.grid.beats
          if (finalBeat < 0 || finalBeat >= maxBeats) {
            console.log('[PASTE] Skipping note - out of bounds. Beat:', finalBeat)
            return
          }
          
          // Calculate new position
          const newPosition = calculatePosition(finalBeat, finalSubdiv, section.grid)
          
          // Check if note already exists at this position
          const existingIndex = existingNotes.findIndex(n => n.position === newPosition)
          
          const newNote = {
            ...note,
            beatIndex: finalBeat,
            subdivision: finalSubdiv,
            position: newPosition,
            // Remove instrumentId as it's not part of the note structure
            instrumentId: undefined
          }
          delete newNote.instrumentId
          
          if (existingIndex >= 0) {
            // Replace existing note
            console.log('[PASTE] Replacing existing note at position:', newPosition)
            existingNotes[existingIndex] = newNote
          } else {
            // Add new note
            console.log('[PASTE] Adding new note at position:', newPosition, 'note:', newNote)
            existingNotes.push(newNote)
          }
        })
        
        return { ...instrument, pattern: existingNotes }
      })
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            instruments: updatedInstruments
          }
        }
      }
    }
    
    case 'ADD_SECTION': {
      // Generate a unique section name
      const sectionNames = ['verse', 'chorus', 'bridge', 'outro', 'interlude', 'pre-chorus', 'solo']
      const existingSectionIds = Object.keys(state.sections)
      
      // Find an unused section name
      let newSectionId = ''
      let newSectionName = ''
      for (const baseName of sectionNames) {
        let counter = 1
        let testId = baseName
        while (existingSectionIds.includes(testId)) {
          testId = `${baseName}${counter}`
          counter++
        }
        if (!existingSectionIds.includes(testId)) {
          newSectionId = testId
          newSectionName = baseName.charAt(0).toUpperCase() + baseName.slice(1)
          if (counter > 1) {
            newSectionName += ` ${counter - 1}`
          }
          break
        }
      }
      
      // If all standard names are taken, use a generic name
      if (!newSectionId) {
        let counter = 1
        while (existingSectionIds.includes(`section${counter}`)) {
          counter++
        }
        newSectionId = `section${counter}`
        newSectionName = `Section ${counter}`
      }
      
      // Copy grid settings from current section
      const currentSection = state.sections[state.currentSection]
      
      const newSection = {
        id: newSectionId,
        name: newSectionName,
        notes: '',
        instruments: [
          {
            id: `instrument1_${newSectionId}`,
            name: 'Instrument 1',
            midiNote: 60,
            visible: true,
            groupId: null,
            groupColor: null,
            order: 0,
            pattern: []
          }
        ],
        grid: {
          ...currentSection.grid,
          beatSubdivisions: [...currentSection.grid.beatSubdivisions]
        }
      }
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [newSectionId]: newSection
        },
        currentSection: newSectionId  // Automatically switch to the new section
      }
    }
    
    case 'SET_CURRENT_SECTION': {
      if (state.sections[action.payload]) {
        return {
          ...state,
          currentSection: action.payload
        }
      }
      return state
    }
    
    case 'DUPLICATE_SECTION': {
      const sectionToDuplicate = state.sections[action.payload]
      if (!sectionToDuplicate) return state
      
      // Generate a unique ID for the duplicate
      let duplicateId = `${action.payload}-copy`
      let counter = 1
      while (state.sections[duplicateId]) {
        duplicateId = `${action.payload}-copy${counter}`
        counter++
      }
      
      // Deep copy the section
      const duplicateSection = {
        ...sectionToDuplicate,
        id: duplicateId,
        name: `${sectionToDuplicate.name} (Copy)`,
        instruments: sectionToDuplicate.instruments.map(instrument => ({
          ...instrument,
          id: `${instrument.id}_${duplicateId}`,
          pattern: [...instrument.pattern]
        })),
        grid: {
          ...sectionToDuplicate.grid,
          beatSubdivisions: [...sectionToDuplicate.grid.beatSubdivisions]
        }
      }
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [duplicateId]: duplicateSection
        },
        currentSection: duplicateId  // Switch to the duplicated section
      }
    }
    
    case 'DELETE_SECTION': {
      const sectionToDelete = action.payload
      const sectionIds = Object.keys(state.sections)
      
      // Don't delete if it's the only section
      if (sectionIds.length <= 1) return state
      
      // Remove the section
      const newSections = { ...state.sections }
      delete newSections[sectionToDelete]
      
      // If we're deleting the current section, switch to another one
      let newCurrentSection = state.currentSection
      if (state.currentSection === sectionToDelete) {
        // Switch to the first available section
        newCurrentSection = Object.keys(newSections)[0]
      }
      
      return {
        ...state,
        sections: newSections,
        currentSection: newCurrentSection
      }
    }
    
    case 'REORDER_SECTIONS': {
      const { oldIndex, newIndex } = action.payload
      const sectionsArray = Object.values(state.sections)
      
      // Reorder the array
      const reorderedSections = arrayMove(sectionsArray, oldIndex, newIndex)
      
      // Convert back to object while preserving the new order
      const newSectionsObject = {}
      reorderedSections.forEach(section => {
        newSectionsObject[section.id] = section
      })
      
      return {
        ...state,
        sections: newSectionsObject
      }
    }
    
    case 'UPDATE_SECTION': {
      const { sectionId, updates } = action.payload
      const section = state.sections[sectionId]
      if (!section) return state
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [sectionId]: {
            ...section,
            ...updates
          }
        }
      }
    }
    
    default:
      return state
  }
}

function uiReducer(state = initialState.ui, action) {
  switch (action.type) {
    case 'SET_SELECTION':
      return { ...state, selectedSteps: new Set(action.payload) }
    
    case 'ADD_TO_SELECTION':
      const newSelection = new Set(state.selectedSteps)
      newSelection.add(action.payload)
      return { ...state, selectedSteps: newSelection }
    
    case 'REMOVE_FROM_SELECTION':
      const updatedSelection = new Set(state.selectedSteps)
      updatedSelection.delete(action.payload)
      return { ...state, selectedSteps: updatedSelection }
    
    case 'CLEAR_SELECTION':
      return { ...state, selectedSteps: new Set() }
    
    case 'TOGGLE_STEP_SELECTION': {
      const currentSelection = new Set(state.selectedSteps || [])
      if (currentSelection.has(action.payload)) {
        currentSelection.delete(action.payload)
      } else {
        currentSelection.add(action.payload)
      }
      return { ...state, selectedSteps: currentSelection }
    }
    
    case 'SET_ACTIVE_SYMBOL':
      return { ...state, activeSymbol: action.payload }
    
    case 'SET_ACTIVE_MODIFIER':
      return { ...state, activeModifier: action.payload }
    
    case 'OPEN_EDIT_MODAL':
      return { ...state, editingStep: action.payload }
    
    case 'CLOSE_EDIT_MODAL':
      return { ...state, editingStep: null }
    
    case 'SET_DRAG_MODE':
      return { ...state, dragMode: action.payload }
    
    case 'SET_IS_DRAGGING':
      return { ...state, isDragging: action.payload }
    
    case 'COPY_SELECTION': {
      // If payload contains notes, use them; otherwise fall back to old behavior
      const noteData = action.payload?.notes || []
      console.log('[uiReducer COPY] Note data:', noteData)
      const newClipboard = { 
        type: 'copy', 
        notes: noteData,
        // Keep old format for backward compatibility
        data: Array.from(state.selectedSteps) 
      }
      console.log('[uiReducer COPY] clipboard:', newClipboard)
      return { ...state, clipboard: newClipboard }
    }
    
    case 'CUT_SELECTION': {
      // If payload contains notes, use them; otherwise fall back to old behavior
      const noteData = action.payload?.notes || []
      console.log('[uiReducer CUT] Note data:', noteData)
      const cutClipboard = { 
        type: 'cut', 
        notes: noteData,
        // Keep old format for backward compatibility
        data: Array.from(state.selectedSteps) 
      }
      console.log('[uiReducer CUT] clipboard:', cutClipboard)
      return { ...state, clipboard: cutClipboard, selectedSteps: new Set() }
    }
    
    case 'PASTE_SELECTION':
      return state
    
    case 'SET_PATTERN_TYPE':
      return { ...state, patternType: action.payload }
    
    default:
      return state
  }
}

function midiReducer(state = initialState.midi, action) {
  switch (action.type) {
    case 'SET_MIDI_IMPORTED':
      return { ...state, imported: action.payload }
    
    case 'SET_QUANTIZATION':
      return { ...state, quantization: action.payload }
    
    case 'SET_VELOCITY_THRESHOLD':
      return { ...state, velocityThreshold: action.payload }
    
    default:
      return state
  }
}

function layoutReducer(state = initialState.layout, action) {
  switch (action.type) {
    case 'UPDATE_LAYOUT':
      return { ...state, ...action.payload }
    
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload }
    
    case 'SET_ORIENTATION':
      return { ...state, orientation: action.payload }
    
    case 'SET_MARGINS':
      return { ...state, margins: action.payload }
    
    case 'SET_BARS_PER_LINE':
      return { ...state, barsPerLine: action.payload }
    
    case 'TOGGLE_BAR_NUMBERS':
      return { ...state, showBarNumbers: !state.showBarNumbers }
    
    case 'TOGGLE_BEAT_NUMBERS':
      return { ...state, showBeatNumbers: !state.showBeatNumbers }
    
    case 'TOGGLE_LEGEND':
      return { ...state, showLegend: !state.showLegend }
    
    case 'SET_TEXT_SCALE':
      return { ...state, textScale: action.payload }
    
    default:
      return state
  }
}

function breaksReducer(state = initialState.breaks, action) {
  switch (action.type) {
    case 'ADD_BREAK':
      return [...state, action.payload]
    
    case 'REMOVE_BREAK':
      return state.filter(b => 
        !(b.sectionId === action.payload.sectionId && 
          b.barIndex === action.payload.barIndex && 
          b.beatIndex === action.payload.beatIndex)
      )
    
    case 'CLEAR_BREAKS':
      return []
    
    default:
      return state
  }
}

function historyReducer(state = initialState.history, action, prevState) {
  return state
}

function themesReducer(state = initialState.themes, action) {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, current: action.payload }
    
    case 'ADD_CUSTOM_THEME':
      return {
        ...state,
        presets: {
          ...state.presets,
          [action.payload.name]: action.payload.theme
        }
      }
    
    case 'UPDATE_THEME':
      return {
        ...state,
        presets: {
          ...state.presets,
          [state.current]: { ...state.presets[state.current], ...action.payload }
        }
      }
    
    default:
      return state
  }
}

function rootReducer(state = initialState, action) {
  const prevState = state
  
  const newState = {
    schemaVersion: state.schemaVersion,
    project: projectReducer(state.project, action),
    ui: uiReducer(state.ui, action),
    layout: layoutReducer(state.layout, action),
    breaks: breaksReducer(state.breaks, action),
    history: historyReducer(state.history, action, prevState),
    themes: themesReducer(state.themes, action),
    midi: midiReducer(state.midi, action)
  }
  
  if (action.type === 'LOAD_FULL_STATE') {
    const loadedState = action.payload
    return {
      project: loadedState.project ? migrateProjectToNewFormat(loadedState.project) : state.project,
      ui: loadedState.ui || state.ui,
      layout: loadedState.layout || state.layout,
      breaks: loadedState.breaks || state.breaks,
      themes: loadedState.themes || state.themes,
      midi: loadedState.midi || state.midi,
      history: {
        past: [],
        present: loadedState,
        future: []
      }
    }
  }
  
  if (action.type === 'UNDO' && state.history.past.length > 0) {
    const previous = state.history.past[state.history.past.length - 1]
    const newPast = state.history.past.slice(0, state.history.past.length - 1)
    return {
      ...previous,
      history: {
        past: newPast,
        present: previous,
        future: [state, ...state.history.future]
      }
    }
  }
  
  if (action.type === 'REDO' && state.history.future.length > 0) {
    const next = state.history.future[0]
    const newFuture = state.history.future.slice(1)
    return {
      ...next,
      history: {
        past: [...state.history.past, state],
        present: next,
        future: newFuture
      }
    }
  }
  
  if (shouldAddToHistory(action)) {
    return {
      ...newState,
      history: {
        past: [...state.history.past, state].slice(-50),
        present: newState,
        future: []
      }
    }
  }
  
  return newState
}

// Helper function to calculate position from beat and subdivision
const calculatePosition = (beatIndex, subdivision, grid) => {
  let position = 0
  const beatSubdivisions = grid.beatSubdivisions || Array(grid.bars * grid.beats).fill(grid.subdivisions)
  for (let i = 0; i < beatIndex; i++) {
    position += beatSubdivisions[i] || 4
  }
  position += subdivision
  return position
}

// Helper functions for safe serialization
const serializeState = (state) => {
  const serializable = {
    ...state,
    ui: {
      ...state.ui,
      selectedSteps: state.ui?.selectedSteps ? Array.from(state.ui.selectedSteps) : []
    }
  }
  return JSON.stringify(serializable)
}

const deserializeState = (jsonString) => {
  const parsed = JSON.parse(jsonString)
  if (parsed.ui && Array.isArray(parsed.ui.selectedSteps)) {
    parsed.ui.selectedSteps = new Set(parsed.ui.selectedSteps)
  }
  return parsed
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(rootReducer, initialState)

  // Auto-save to localStorage
  useEffect(() => {
    const saveInterval = setInterval(() => {
      try {
        localStorage.setItem('tromklub_autosave', serializeState(state))
      } catch (error) {
        console.error('Failed to save state:', error)
      }
    }, 5000)

    return () => clearInterval(saveInterval)
  }, [state])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tromklub_autosave')
    if (saved) {
      try {
        const parsedState = deserializeState(saved)
        
        // If no schema version exists, this is old data - clear it and use new defaults
        if (!parsedState.schemaVersion) {
          console.log('Clearing old data without schema version - using new defaults with single instrument')
          localStorage.removeItem('tromklub_autosave')
          // Don't load anything, let the app use the fresh initialState with single Instrument 1
          return
        }
        
        // Only load if schema version matches exactly
        if (parsedState.schemaVersion === initialState.schemaVersion) {
          // Load project with migration
          dispatch({ type: 'LOAD_PROJECT', payload: parsedState.project })
        } else {
          // Schema version mismatch - clear old data and use new defaults
          console.log('Schema version mismatch, clearing old data and using new defaults')
          localStorage.removeItem('tromklub_autosave')
        }
      } catch (error) {
        console.error('Failed to load saved state:', error)
        // Clear corrupted data
        localStorage.removeItem('tromklub_autosave')
      }
    }
  }, [])

  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem('tromklub_autosave', serializeState(state))
      } catch (error) {
        console.error('Failed to save state before unload:', error)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppState must be used within AppProvider')
  }
  return context
}

export default AppContext