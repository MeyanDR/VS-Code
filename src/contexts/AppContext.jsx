import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { migrateProjectToNewFormat } from '../utils/patternMigration'

const initialState = {
  project: {
    name: 'Untitled',
    sections: {
      'intro': {
        id: 'intro',
        name: 'Intro',
        notes: '',
        instruments: [
          {
            id: 'kick',
            name: 'Kick',
            midiNote: 36,
            visible: true,
            groupId: null,
            groupColor: null,
            order: 0,
            pattern: []
          },
          {
            id: 'snare',
            name: 'Snare',
            midiNote: 38,
            visible: true,
            groupId: null,
            groupColor: null,
            order: 1,
            pattern: []
          },
          {
            id: 'hihat',
            name: 'Hi-Hat',
            midiNote: 42,
            visible: true,
            groupId: null,
            groupColor: null,
            order: 2,
            pattern: []
          },
          {
            id: 'crash',
            name: 'Crash',
            midiNote: 49,
            visible: true,
            groupId: null,
            groupColor: null,
            order: 3,
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
      
      // Calculate position from beat and subdivision if provided
      let position = action.payload.position
      if (action.payload.beatIndex !== undefined && action.payload.subdivision !== undefined) {
        position = 0
        const beatSubdivisions = section.grid.beatSubdivisions || Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions)
        for (let i = 0; i < action.payload.beatIndex; i++) {
          position += beatSubdivisions[i] || 4
        }
        position += action.payload.subdivision
      }
      
      // Find existing note at this position
      const existingIndex = newPattern.findIndex(n => {
        if (action.payload.beatIndex !== undefined && action.payload.subdivision !== undefined) {
          return n.beatIndex === action.payload.beatIndex && n.subdivision === action.payload.subdivision
        }
        return n.position === position
      })
      
      const newNote = {
        position: position,
        beatIndex: action.payload.beatIndex,
        subdivision: action.payload.subdivision,
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
    
    case 'UPDATE_BEAT_SUBDIVISION': {
      const section = state.sections[state.currentSection]
      const beatIndex = action.payload.beatIndex
      const newSubdivision = action.payload.subdivision
      const newBeatSubdivisions = [...section.grid.beatSubdivisions]
      newBeatSubdivisions[beatIndex] = newSubdivision
      
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
    
    case 'COPY_SELECTION':
      return { ...state, clipboard: { type: 'copy', data: Array.from(state.selectedSteps) } }
    
    case 'CUT_SELECTION':
      return { ...state, clipboard: { type: 'cut', data: Array.from(state.selectedSteps) } }
    
    case 'PASTE_SELECTION':
      if (state.clipboard?.type === 'cut') {
        return { ...state, clipboard: null, selectedSteps: new Set() }
      }
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
    project: projectReducer(state.project, action),
    ui: uiReducer(state.ui, action),
    layout: layoutReducer(state.layout, action),
    breaks: breaksReducer(state.breaks, action),
    history: historyReducer(state.history, action, prevState),
    themes: themesReducer(state.themes, action),
    midi: midiReducer(state.midi, action)
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

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(rootReducer, initialState)

  // Auto-save to localStorage
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem('tromklub_autosave', JSON.stringify(state))
    }, 5000)

    return () => clearInterval(saveInterval)
  }, [state])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tromklub_autosave')
    if (saved) {
      try {
        const parsedState = JSON.parse(saved)
        // Convert selectedSteps back to Set
        if (parsedState.ui && Array.isArray(parsedState.ui.selectedSteps)) {
          parsedState.ui.selectedSteps = new Set(parsedState.ui.selectedSteps)
        }
        // Load project with migration
        dispatch({ type: 'LOAD_PROJECT', payload: parsedState.project })
      } catch (error) {
        console.error('Failed to load saved state:', error)
      }
    }
  }, [])

  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('tromklub_autosave', JSON.stringify(state))
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