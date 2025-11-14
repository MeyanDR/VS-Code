import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { migrateProjectToNewFormat } from '../utils/patternMigration'
import { arrayMove } from '@dnd-kit/sortable'

const initialState = {
  schemaVersion: 4,  // Version 4: Added section metadata (tempo, type) and export config
  project: {
    name: 'Untitled',
    sections: {
      'intro': {
        id: 'intro',
        name: 'Intro',
        notes: '',
        metadata: {
          tempo: 120,
          type: 'loop',  // 'loop' or 'break'
          loopLength: null  // Optional custom loop length in beats
        },
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
        groups: [], // Array of instrument groups
        grid: {
          bars: 2,
          beats: 4,
          subdivisions: 4,  // Keep for backward compatibility
          beatSubdivisions: Array(8).fill(4)  // 2 bars * 4 beats = 8 beats total
        }
      }
    },
    currentSection: 'intro'
  },
  exportConfig: {
    scope: 'current',  // 'current' | 'full' | 'selected'
    selectedSections: [],
    format: 'pdf',  // 'pdf' | 'jpg'
    pageSize: 'A4',  // 'A4' | 'Letter' | 'A3'
    orientation: 'portrait',  // 'portrait' | 'landscape'
    quality: 90,  // For JPG export
    layout: {
      barsPerLine: 4,
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },  // mm (1 inch standard margins)
      spacing: {
        sectionGap: 30,
        barGap: 8,
        beatGap: 4,
        lineGap: 20
      },
      cellWidth: 24,
      typography: {
        titleSize: 32,
        sectionNameSize: 20,
        instrumentLabelSize: 14,
        symbolSize: 16,
        metadataSize: 11,
        legendSize: 12,
        fontFamily: 'Arial, sans-serif'
      },
      beatShading: true,
      shadingPattern: [1, 3],  // Which beats to shade (0-indexed)
      gridStyle: 'full',  // 'full' | 'minimal'
      showTitle: true,
      showTempo: true,
      showSectionMetadata: true,
      showSectionNotes: true,
      showBarNumbers: true,
      showBeatNumbers: true,
      showInstrumentLabels: true,
      showLegend: true,
      legendPosition: 'bottom',  // 'bottom' | 'end' | 'each-page'
      repeatHeadersOnNewPage: true,
      repeatInstrumentLabelsOnNewPage: true
    }
  },
  ui: {
    selectedSteps: new Set(),
    selectOnlyMode: false,
    activeSymbol: 'o',
    activeModifier: '',
    activeTechnique: '',
    activeEffect: '',
    patternType: 'loop',
    editingStep: null,
    editFieldSymbol: null,
    editFieldArticulation: null,
    editFieldTechnique: null,
    editFieldEffect: null,
    dragMode: null,
    isDragging: false,
    clipboard: null,
    gridScale: 1.0,
    availableSymbols: [
      { value: 'o', label: 'Open Note', description: 'Basic open note / Normal hit', shortcut: '' },
      { value: 'x', label: 'Cross Note', description: 'Muted or closed note / Stick shot', shortcut: '' },
      { value: '/', label: 'Rest/Tie', description: 'Rest or tie', shortcut: '' }
    ],
    availableArticulationModifiers: [
      { value: '', label: 'None', description: 'No modifier', shortcut: '' }
    ],
    availableTechniqueModifiers: [],
    availableEffectModifiers: []
  },
  layout: {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 }, // 1 inch standard margins
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
    // Pattern operations (already tracked)
    'ADD_NOTE', 'REMOVE_NOTE', 'UPDATE_NOTE', 'CLEAR_ALL',
    'UPDATE_GRID', 'PASTE_SELECTION', 'CUT_SELECTION',
    'UPDATE_BEAT_SUBDIVISION', 'UPDATE_GRID_BEAT_SUBDIVISION',
    'UPDATE_NESTED_SUBDIVISION',

    // Instrument operations (NEW)
    'ADD_INSTRUMENT', 'DELETE_INSTRUMENT', 'UPDATE_INSTRUMENT_NAME',
    'UPDATE_INSTRUMENT_SETTINGS', 'REORDER_INSTRUMENTS',
    'TOGGLE_INSTRUMENT_VISIBILITY',

    // Section operations (NEW)
    'ADD_SECTION', 'DELETE_SECTION', 'DUPLICATE_SECTION',
    'UPDATE_SECTION', 'UPDATE_SECTION_METADATA', 'REORDER_SECTIONS',

    // Group operations (NEW)
    'CREATE_GROUP', 'ADD_INSTRUMENT_TO_GROUP', 'UNGROUP',
    'UPDATE_GROUP_NAME',

    // Project operations (NEW)
    'SET_PROJECT_NAME'
  ]
  return historyActions.includes(action.type)
}

function projectReducer(state = initialState.project, action) {
  switch (action.type) {
    case 'ADD_NOTE': {
      const section = state.sections[state.currentSection]
      const instrument = section.instruments.find(i => i.id === action.payload.instrumentId)
      if (!instrument) return state
      
      // Now we ONLY use beatIndex and subdivision
      const { beatIndex, subdivision, symbol, modifier, technique, effect } = action.payload
      console.log('[ADD_NOTE] Received:', action.payload)
      if (beatIndex === undefined || subdivision === undefined) {
        console.error('[ADD_NOTE] Missing beatIndex or subdivision:', action.payload)
        return state
      }
      
      const newPattern = [...instrument.pattern]

      // Find existing note at this musical position
      // Support both flat subdivision (number) and nested paths (array)
      const existingIndex = newPattern.findIndex(n => {
        if (n.beatIndex !== beatIndex) return false
        if (Array.isArray(n.subdivision) && Array.isArray(subdivision)) {
          return JSON.stringify(n.subdivision) === JSON.stringify(subdivision)
        }
        return n.subdivision === subdivision
      })

      const newNote = {
        beatIndex,
        subdivision, // Can be number or array
        symbol: symbol || 'o',
        modifier: modifier || '',
        technique: technique || '',
        effect: effect || ''
      }
      console.log('[ADD_NOTE] Storing note:', newNote, 'at index:', existingIndex >= 0 ? existingIndex : 'new')

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
      
      const { beatIndex, subdivision } = action.payload
      if (beatIndex === undefined || subdivision === undefined) {
        console.error('[REMOVE_NOTE] Missing beatIndex or subdivision:', action.payload)
        return state
      }

      // Support both flat subdivision (number) and nested paths (array)
      const newPattern = instrument.pattern.filter(n => {
        if (n.beatIndex !== beatIndex) return true
        if (Array.isArray(n.subdivision) && Array.isArray(subdivision)) {
          return JSON.stringify(n.subdivision) !== JSON.stringify(subdivision)
        }
        return n.subdivision !== subdivision
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

      const { beatIndex, subdivision, symbol, modifier, technique, effect } = action.payload
      if (beatIndex === undefined || subdivision === undefined) {
        console.error('[UPDATE_NOTE] Missing beatIndex or subdivision:', action.payload)
        return state
      }

      // Support both flat subdivision (number) and nested paths (array)
      const newPattern = instrument.pattern.map(n => {
        const matches = (() => {
          if (n.beatIndex !== beatIndex) return false
          if (Array.isArray(n.subdivision) && Array.isArray(subdivision)) {
            return JSON.stringify(n.subdivision) === JSON.stringify(subdivision)
          }
          return n.subdivision === subdivision
        })()

        if (matches) {
          return {
            ...n,
            symbol,
            modifier,
            technique: technique || '',
            effect: effect || ''
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
    
    case 'UPDATE_GRID_BEAT_SUBDIVISION': {
      const section = state.sections[state.currentSection]
      const { beatIndex, subdivision } = action.payload
      
      // Initialize beatSubdivisions array if it doesn't exist
      const totalBeats = section.grid.bars * section.grid.beats
      const currentBeatSubdivisions = section.grid.beatSubdivisions || Array(totalBeats).fill(section.grid.subdivisions)
      
      // Update the specific beat subdivision at grid level
      const newBeatSubdivisions = [...currentBeatSubdivisions]
      newBeatSubdivisions[beatIndex] = subdivision
      
      console.log('UPDATE_GRID_BEAT_SUBDIVISION reducer:', {
        beatIndex,
        subdivision,
        oldValue: currentBeatSubdivisions[beatIndex],
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
      const updatedInstruments = section.instruments.map(i => 
        i.id === action.payload.instrumentId 
          ? { 
              ...i, 
              subdivision: action.payload.settings.subdivision || i.subdivision,
              beats: action.payload.settings.beats || i.beats,
              measures: action.payload.settings.measures || i.measures
            }
          : i
      )
      
      // DEBUG: Log the settings update
      const updatedInstrument = updatedInstruments.find(i => i.id === action.payload.instrumentId)
      console.log('💾 [DEBUG] Saved instrument settings to state:', {
        instrumentId: action.payload.instrumentId,
        inputSettings: action.payload.settings,
        finalInstrument: {
          subdivision: updatedInstrument.subdivision,
          beats: updatedInstrument.beats,
          measures: updatedInstrument.measures
        }
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
      const { instrumentId, beatIndex, subdivision: newSubdivision } = action.payload

      // Find the target instrument
      const instrumentIndex = section.instruments.findIndex(i => i.id === instrumentId)
      if (instrumentIndex === -1) return state

      const targetInstrument = section.instruments[instrumentIndex]

      // Initialize beatSubdivisions array if it doesn't exist
      const totalBeats = section.grid.bars * section.grid.beats
      const currentBeatSubdivisions = targetInstrument.beatSubdivisions || Array(totalBeats).fill(null)

      // Update the specific beat subdivision for this instrument
      const newBeatSubdivisions = [...currentBeatSubdivisions]
      newBeatSubdivisions[beatIndex] = newSubdivision

      console.log('UPDATE_BEAT_SUBDIVISION reducer (per-instrument):', {
        instrumentId,
        beatIndex,
        newSubdivision,
        oldValue: currentBeatSubdivisions[beatIndex],
        newBeatSubdivisions
      })

      // Update the instrument with new beat subdivisions
      const updatedInstruments = [...section.instruments]
      updatedInstruments[instrumentIndex] = {
        ...targetInstrument,
        beatSubdivisions: newBeatSubdivisions
      }

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

    case 'UPDATE_NESTED_SUBDIVISION': {
      const section = state.sections[state.currentSection]
      const { instrumentId, beatIndex, stepPath, subdivision: newSubdivision } = action.payload

      // Find the target instrument
      const instrumentIndex = section.instruments.findIndex(i => i.id === instrumentId)
      if (instrumentIndex === -1) return state

      const targetInstrument = section.instruments[instrumentIndex]

      // Initialize nested subdivisions if it doesn't exist
      const totalBeats = section.grid.bars * section.grid.beats
      const currentNestedSubdivisions = targetInstrument.nestedSubdivisions || {}

      // Create a deep copy of nested subdivisions
      const newNestedSubdivisions = JSON.parse(JSON.stringify(currentNestedSubdivisions))

      // Build the nested structure
      // stepPath is an array like [2, 1] for subdivision 2, nested step 1
      // or [2, 1, 0] for deeper nesting
      const beatKey = `${beatIndex}`
      if (!newNestedSubdivisions[beatKey]) {
        newNestedSubdivisions[beatKey] = {}
      }

      // Navigate to the correct nesting level
      let current = newNestedSubdivisions[beatKey]
      for (let i = 0; i < stepPath.length - 1; i++) {
        const pathKey = stepPath.slice(0, i + 1).join('-')
        if (!current[pathKey]) {
          current[pathKey] = {}
        }
        current = current[pathKey]
      }

      // Set the subdivision value at the final path
      const finalKey = stepPath.join('-')
      current[finalKey] = newSubdivision

      console.log('UPDATE_NESTED_SUBDIVISION reducer:', {
        instrumentId,
        beatIndex,
        stepPath,
        newSubdivision,
        newNestedSubdivisions
      })

      // Update the instrument with new nested subdivisions
      const updatedInstruments = [...section.instruments]
      updatedInstruments[instrumentIndex] = {
        ...targetInstrument,
        nestedSubdivisions: newNestedSubdivisions
      }

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

    case 'DELETE_INSTRUMENT': {
      const section = state.sections[state.currentSection]
      const instrumentId = action.payload

      // Filter out the instrument to be deleted
      const updatedInstruments = section.instruments.filter(i => i.id !== instrumentId)

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
    
    case 'NEW_PROJECT':
      // Return the initial project state
      return initialState.project
    
    case 'CUT_SELECTION': {
      const selectedSteps = action.payload.selectedSteps
      console.log('[projectReducer CUT] selectedSteps to remove:', selectedSteps)
      const section = state.sections[state.currentSection]
      const updatedInstruments = section.instruments.map(instrument => {
        const newPattern = instrument.pattern.filter(note => {
          // Match the new format used in selectedSteps: {instrumentId}-{beatIndex}-{subdivision}
          const stepKey = `${instrument.id}-${note.beatIndex}-${note.subdivision}`
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
      
      // Check if we have the new pattern format
      if (!clipboard || !clipboard.pattern) {
        console.log('[projectReducer PASTE] No pattern data in clipboard, aborting')
        return state
      }
      
      const section = state.sections[state.currentSection]
      const beatSubdivisions = section.grid.beatSubdivisions || Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions)
      const patternData = clipboard.pattern
      
      console.log('[PASTE] Pattern to paste:', patternData)
      console.log('[PASTE] Pattern cells detail:', patternData.pattern.map(p => 
        `${p.instrumentId} @ beat:${p.beatOffset} subdiv:${p.subdivOffset} hasNote:${p.hasNote}`
      ))
      
      // Group pattern cells by instrument
      const cellsByInstrument = {}
      patternData.pattern.forEach(cell => {
        if (!cellsByInstrument[cell.instrumentId]) {
          cellsByInstrument[cell.instrumentId] = []
        }
        cellsByInstrument[cell.instrumentId].push(cell)
      })
      
      const updatedInstruments = section.instruments.map(instrument => {
        const cellsToPaste = cellsByInstrument[instrument.id]
        if (!cellsToPaste || cellsToPaste.length === 0) {
          return instrument
        }
        
        console.log(`[PASTE] Processing ${cellsToPaste.length} cells for instrument ${instrument.id}`)
        
        // Start with existing notes
        let updatedPattern = [...instrument.pattern]
        
        // First pass: Remove all notes in the target area
        cellsToPaste.forEach(cell => {
          const targetBeatPos = targetBeat + cell.beatOffset
          const targetSubdivPos = targetSubdivision + cell.subdivOffset
          
          // Adjust for subdivision overflow
          let finalBeat = targetBeatPos
          let finalSubdiv = targetSubdivPos
          
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
            return
          }
          
          // Remove any existing note at this position
          updatedPattern = updatedPattern.filter(n => 
            !(n.beatIndex === finalBeat && n.subdivision === finalSubdiv)
          )
        })
        
        // Second pass: Add notes where the pattern has notes
        cellsToPaste.forEach(cell => {
          if (!cell.hasNote) {
            // This cell should be empty, we already cleared it
            return
          }
          
          const targetBeatPos = targetBeat + cell.beatOffset
          const targetSubdivPos = targetSubdivision + cell.subdivOffset
          
          // Adjust for subdivision overflow
          let finalBeat = targetBeatPos
          let finalSubdiv = targetSubdivPos
          
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
          
          // Add the note
          const newNote = {
            beatIndex: finalBeat,
            subdivision: finalSubdiv,
            symbol: cell.note.symbol,
            modifier: cell.note.modifier
          }
          
          console.log('[PASTE] Adding note at beat:', finalBeat, 'subdiv:', finalSubdiv)
          updatedPattern.push(newNote)
        })
        
        return { ...instrument, pattern: updatedPattern }
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
        metadata: {
          tempo: currentSection.metadata?.tempo || 120,
          type: 'loop',
          loopLength: null
        },
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
        groups: [], // Initialize groups array
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
        metadata: {
          ...(sectionToDuplicate.metadata || { tempo: 120, type: 'loop', loopLength: null })
        },
        instruments: sectionToDuplicate.instruments.map(instrument => ({
          ...instrument,
          id: `${instrument.id}_${duplicateId}`,
          pattern: [...instrument.pattern]
        })),
        groups: sectionToDuplicate.groups ? [...sectionToDuplicate.groups] : [], // Copy groups
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

    case 'UPDATE_SECTION_METADATA': {
      const { sectionId, metadata } = action.payload
      const section = state.sections[sectionId]
      if (!section) return state

      return {
        ...state,
        sections: {
          ...state.sections,
          [sectionId]: {
            ...section,
            metadata: {
              ...section.metadata,
              ...metadata
            }
          }
        }
      }
    }
    
    case 'CREATE_GROUP': {
      const section = state.sections[state.currentSection]
      const { instrumentIds, name } = action.payload
      
      // Create new group
      const newGroup = {
        id: `group_${Date.now()}`,
        name: name || 'Group',
        instrumentIds: instrumentIds,
        collapsed: false,
        color: '#06b6d4' // cyan-600
      }
      
      // Update instruments to have groupId
      const updatedInstruments = section.instruments.map(instrument => {
        if (instrumentIds.includes(instrument.id)) {
          return { ...instrument, groupId: newGroup.id }
        }
        return instrument
      })
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            groups: [...(section.groups || []), newGroup],
            instruments: updatedInstruments
          }
        }
      }
    }
    
    case 'ADD_INSTRUMENT_TO_GROUP': {
      const section = state.sections[state.currentSection]
      const { groupId, instrumentId } = action.payload
      
      // Find the group to add to
      const group = (section.groups || []).find(g => g.id === groupId)
      if (!group) return state
      
      // Check if instrument is already in this group
      if (group.instrumentIds.includes(instrumentId)) return state
      
      // Update the group to include the new instrument
      const updatedGroups = (section.groups || []).map(g => {
        if (g.id === groupId) {
          return { ...g, instrumentIds: [...g.instrumentIds, instrumentId] }
        }
        return g
      })
      
      // Update the instrument to have the groupId
      const updatedInstruments = section.instruments.map(instrument => {
        if (instrument.id === instrumentId) {
          return { ...instrument, groupId: groupId }
        }
        return instrument
      })
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            groups: updatedGroups,
            instruments: updatedInstruments
          }
        }
      }
    }
    
    case 'UNGROUP': {
      const section = state.sections[state.currentSection]
      const { groupId } = action.payload
      
      // Remove group
      const updatedGroups = (section.groups || []).filter(g => g.id !== groupId)
      
      // Update instruments to remove groupId
      const updatedInstruments = section.instruments.map(instrument => {
        if (instrument.groupId === groupId) {
          return { ...instrument, groupId: null }
        }
        return instrument
      })
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            groups: updatedGroups,
            instruments: updatedInstruments
          }
        }
      }
    }
    
    case 'TOGGLE_GROUP_COLLAPSE': {
      const section = state.sections[state.currentSection]
      const { groupId } = action.payload
      
      const updatedGroups = (section.groups || []).map(group => {
        if (group.id === groupId) {
          return { ...group, collapsed: !group.collapsed }
        }
        return group
      })
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            groups: updatedGroups
          }
        }
      }
    }
    
    case 'UPDATE_GROUP_NAME': {
      const section = state.sections[state.currentSection]
      const { groupId, name } = action.payload
      
      const updatedGroups = (section.groups || []).map(group => {
        if (group.id === groupId) {
          return { ...group, name }
        }
        return group
      })
      
      return {
        ...state,
        sections: {
          ...state.sections,
          [state.currentSection]: {
            ...section,
            groups: updatedGroups
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
    
    case 'SET_ACTIVE_TECHNIQUE':
      return { ...state, activeTechnique: action.payload }
    
    case 'SET_ACTIVE_EFFECT':
      return { ...state, activeEffect: action.payload }
    
    case 'ADD_AVAILABLE_SYMBOL':
      const existingSymbol = state.availableSymbols.find(s => s.value === action.payload.value)
      if (existingSymbol) return state
      return { ...state, availableSymbols: [...state.availableSymbols, action.payload] }
    
    case 'ADD_AVAILABLE_ARTICULATION':
      const existingArticulation = state.availableArticulationModifiers.find(m => m.value === action.payload.value)
      if (existingArticulation) return state
      return { ...state, availableArticulationModifiers: [...state.availableArticulationModifiers, action.payload] }

    case 'ADD_AVAILABLE_TECHNIQUE':
      const existingTechnique = state.availableTechniqueModifiers.find(m => m.value === action.payload.value)
      if (existingTechnique) return state
      return { ...state, availableTechniqueModifiers: [...state.availableTechniqueModifiers, action.payload] }

    case 'ADD_AVAILABLE_EFFECT':
      const existingEffect = state.availableEffectModifiers.find(m => m.value === action.payload.value)
      if (existingEffect) return state
      return { ...state, availableEffectModifiers: [...state.availableEffectModifiers, action.payload] }
    
    case 'REMOVE_AVAILABLE_SYMBOL':
      return { 
        ...state, 
        availableSymbols: state.availableSymbols.filter(s => s.value !== action.payload),
        activeSymbol: state.activeSymbol === action.payload ? (state.availableSymbols[0]?.value || 'o') : state.activeSymbol
      }
    
    case 'REMOVE_AVAILABLE_ARTICULATION':
      return { 
        ...state, 
        availableArticulationModifiers: state.availableArticulationModifiers.filter(m => m.value !== action.payload),
        activeModifier: state.activeModifier === action.payload ? (state.availableArticulationModifiers[0]?.value || '') : state.activeModifier
      }

    case 'REMOVE_AVAILABLE_TECHNIQUE':
      return { 
        ...state, 
        availableTechniqueModifiers: state.availableTechniqueModifiers.filter(m => m.value !== action.payload)
      }

    case 'REMOVE_AVAILABLE_EFFECT':
      return { 
        ...state, 
        availableEffectModifiers: state.availableEffectModifiers.filter(m => m.value !== action.payload)
      }
    
    case 'UPDATE_SYMBOL_SHORTCUT': {
      const newShortcut = action.payload.shortcut
      // Check for duplicates across all categories if shortcut is not empty
      if (newShortcut) {
        const isDuplicate = 
          state.availableSymbols.some(s => s.value !== action.payload.value && s.shortcut === newShortcut) ||
          state.availableArticulationModifiers.some(m => m.shortcut === newShortcut) ||
          state.availableTechniqueModifiers.some(m => m.shortcut === newShortcut) ||
          state.availableEffectModifiers.some(m => m.shortcut === newShortcut)
        
        if (isDuplicate) {
          console.warn(`Shortcut "${newShortcut}" is already in use`)
          return state // Don't update if duplicate
        }
      }
      
      return {
        ...state,
        availableSymbols: state.availableSymbols.map(s =>
          s.value === action.payload.value 
            ? { ...s, shortcut: newShortcut }
            : s
        )
      }
    }
    
    case 'UPDATE_ARTICULATION_SHORTCUT': {
      const newShortcut = action.payload.shortcut
      // Check for duplicates across all categories if shortcut is not empty
      if (newShortcut) {
        const isDuplicate = 
          state.availableSymbols.some(s => s.shortcut === newShortcut) ||
          state.availableArticulationModifiers.some(m => m.value !== action.payload.value && m.shortcut === newShortcut) ||
          state.availableTechniqueModifiers.some(m => m.shortcut === newShortcut) ||
          state.availableEffectModifiers.some(m => m.shortcut === newShortcut)
        
        if (isDuplicate) {
          console.warn(`Shortcut "${newShortcut}" is already in use`)
          return state // Don't update if duplicate
        }
      }
      
      return {
        ...state,
        availableArticulationModifiers: state.availableArticulationModifiers.map(m =>
          m.value === action.payload.value 
            ? { ...m, shortcut: newShortcut }
            : m
        )
      }
    }
    
    case 'UPDATE_TECHNIQUE_SHORTCUT': {
      const newShortcut = action.payload.shortcut
      // Check for duplicates across all categories if shortcut is not empty
      if (newShortcut) {
        const isDuplicate = 
          state.availableSymbols.some(s => s.shortcut === newShortcut) ||
          state.availableArticulationModifiers.some(m => m.shortcut === newShortcut) ||
          state.availableTechniqueModifiers.some(m => m.value !== action.payload.value && m.shortcut === newShortcut) ||
          state.availableEffectModifiers.some(m => m.shortcut === newShortcut)
        
        if (isDuplicate) {
          console.warn(`Shortcut "${newShortcut}" is already in use`)
          return state // Don't update if duplicate
        }
      }
      
      return {
        ...state,
        availableTechniqueModifiers: state.availableTechniqueModifiers.map(m =>
          m.value === action.payload.value 
            ? { ...m, shortcut: newShortcut }
            : m
        )
      }
    }
    
    case 'UPDATE_EFFECT_SHORTCUT': {
      const newShortcut = action.payload.shortcut
      // Check for duplicates across all categories if shortcut is not empty
      if (newShortcut) {
        const isDuplicate = 
          state.availableSymbols.some(s => s.shortcut === newShortcut) ||
          state.availableArticulationModifiers.some(m => m.shortcut === newShortcut) ||
          state.availableTechniqueModifiers.some(m => m.shortcut === newShortcut) ||
          state.availableEffectModifiers.some(m => m.value !== action.payload.value && m.shortcut === newShortcut)
        
        if (isDuplicate) {
          console.warn(`Shortcut "${newShortcut}" is already in use`)
          return state // Don't update if duplicate
        }
      }
      
      return {
        ...state,
        availableEffectModifiers: state.availableEffectModifiers.map(m =>
          m.value === action.payload.value 
            ? { ...m, shortcut: newShortcut }
            : m
        )
      }
    }
    
    case 'OPEN_EDIT_MODAL':
      return { ...state, editingStep: action.payload }
    
    case 'CLOSE_EDIT_MODAL':
      return { ...state, editingStep: null }
    
    case 'SET_DRAG_MODE':
      return { ...state, dragMode: action.payload }
    
    case 'SET_IS_DRAGGING':
      return { ...state, isDragging: action.payload }
    
    case 'COPY_SELECTION': {
      // Store the complete pattern with empty cells
      const patternData = action.payload?.pattern
      console.log('[uiReducer COPY] Pattern data:', patternData)
      const newClipboard = { 
        type: 'copy', 
        pattern: patternData,
        // Keep old format for backward compatibility
        data: Array.from(state.selectedSteps) 
      }
      console.log('[uiReducer COPY] clipboard:', newClipboard)
      return { ...state, clipboard: newClipboard }
    }
    
    case 'CUT_SELECTION': {
      // Store the complete pattern with empty cells
      const patternData = action.payload?.pattern
      console.log('[uiReducer CUT] Pattern data:', patternData)
      const cutClipboard = { 
        type: 'cut', 
        pattern: patternData,
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
    
    case 'SET_EDIT_FIELD_SYMBOL':
      return { ...state, editFieldSymbol: action.payload }
    
    case 'SET_EDIT_FIELD_ARTICULATION':
      return { ...state, editFieldArticulation: action.payload }
    
    case 'SET_EDIT_FIELD_TECHNIQUE':
      return { ...state, editFieldTechnique: action.payload }
    
    case 'SET_EDIT_FIELD_EFFECT':
      return { ...state, editFieldEffect: action.payload }
    
    case 'CLEAR_EDIT_FIELDS':
      return { 
        ...state, 
        editFieldSymbol: null,
        editFieldArticulation: null,
        editFieldTechnique: null,
        editFieldEffect: null 
      }
    
    case 'TOGGLE_SELECT_ONLY_MODE':
      return { ...state, selectOnlyMode: !state.selectOnlyMode }

    case 'SET_GRID_SCALE':
      return { ...state, gridScale: action.payload }

    case 'NEW_PROJECT':
      // Reset to initial UI state
      return initialState.ui

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
    
    case 'NEW_PROJECT':
      // Reset to initial midi state
      return initialState.midi
    
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
    
    case 'NEW_PROJECT':
      // Reset to initial layout state
      return initialState.layout
    
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
    
    case 'NEW_PROJECT':
      // Reset to initial breaks state
      return initialState.breaks
    
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

    case 'NEW_PROJECT':
      // Reset to initial themes state
      return initialState.themes

    default:
      return state
  }
}

function exportConfigReducer(state = initialState.exportConfig, action) {
  switch (action.type) {
    case 'UPDATE_EXPORT_CONFIG':
      return {
        ...state,
        ...action.payload
      }

    case 'UPDATE_EXPORT_LAYOUT':
      return {
        ...state,
        layout: {
          ...state.layout,
          ...action.payload
        }
      }

    case 'UPDATE_EXPORT_TYPOGRAPHY':
      return {
        ...state,
        layout: {
          ...state.layout,
          typography: {
            ...state.layout.typography,
            ...action.payload
          }
        }
      }

    case 'UPDATE_EXPORT_SPACING':
      return {
        ...state,
        layout: {
          ...state.layout,
          spacing: {
            ...state.layout.spacing,
            ...action.payload
          }
        }
      }

    case 'UPDATE_EXPORT_MARGINS':
      return {
        ...state,
        layout: {
          ...state.layout,
          margins: {
            ...state.layout.margins,
            ...action.payload
          }
        }
      }

    case 'SET_EXPORT_SCOPE':
      return { ...state, scope: action.payload }

    case 'SET_EXPORT_FORMAT':
      return { ...state, format: action.payload }

    case 'SET_EXPORT_PAGE_SIZE':
      return { ...state, pageSize: action.payload }

    case 'SET_EXPORT_ORIENTATION':
      return { ...state, orientation: action.payload }

    case 'SET_BARS_PER_LINE':
      return {
        ...state,
        layout: {
          ...state.layout,
          barsPerLine: action.payload
        }
      }

    case 'TOGGLE_EXPORT_OPTION': {
      const { option } = action.payload
      return {
        ...state,
        layout: {
          ...state.layout,
          [option]: !state.layout[option]
        }
      }
    }

    case 'NEW_PROJECT':
      // Reset to initial export config
      return initialState.exportConfig

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
    midi: midiReducer(state.midi, action),
    exportConfig: exportConfigReducer(state.exportConfig, action)
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
      exportConfig: loadedState.exportConfig || state.exportConfig,
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
  console.log('AppProvider: Initializing context provider...')
  const [state, dispatch] = useReducer(rootReducer, initialState)
  console.log('AppProvider: State initialized:', state ? 'Success' : 'Failed')

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