export const initialState = {
  project: {
    name: 'Untitled',
    sections: {
      'intro': {
        id: 'intro',
        name: 'Intro',
        instruments: [
          {
            id: 'kick',
            name: 'Kick',
            midiNote: 36,
            pattern: []
          },
          {
            id: 'snare',
            name: 'Snare',
            midiNote: 38,
            pattern: []
          },
          {
            id: 'hihat',
            name: 'Hi-Hat',
            midiNote: 42,
            pattern: []
          },
          {
            id: 'crash',
            name: 'Crash',
            midiNote: 49,
            pattern: []
          }
        ],
        grid: {
          bars: 4,
          beats: 4,
          subdivisions: 4
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
  midi: {
    imported: false,
    quantization: 16,
    velocityThreshold: 64
  }
}

class Store {
  constructor(initialState) {
    this.state = initialState
    this.listeners = []
  }

  getState() {
    return this.state
  }

  dispatch(action) {
    this.state = rootReducer(this.state, action)
    this.listeners.forEach(listener => listener(this.state))
  }

  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }
}

function rootReducer(state = initialState, action) {
  return {
    project: projectReducer(state.project, action),
    ui: uiReducer(state.ui, action),
    midi: midiReducer(state.midi, action)
  }
}

function projectReducer(state = initialState.project, action) {
  switch (action.type) {
    case 'ADD_NOTE': {
      const section = state.sections[state.currentSection]
      const instrument = section.instruments.find(i => i.id === action.payload.instrumentId)
      if (!instrument) return state
      
      const newPattern = [...instrument.pattern]
      const existingIndex = newPattern.findIndex(n => n.position === action.payload.position)
      
      if (existingIndex >= 0) {
        newPattern[existingIndex] = {
          position: action.payload.position,
          symbol: action.payload.symbol,
          modifier: action.payload.modifier
        }
      } else {
        newPattern.push({
          position: action.payload.position,
          symbol: action.payload.symbol,
          modifier: action.payload.modifier
        })
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
      
      const newPattern = instrument.pattern.filter(n => n.position !== action.payload.position)
      
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
      
      const newPattern = instrument.pattern.map(n => 
        n.position === action.payload.position
          ? { ...n, symbol: action.payload.symbol, modifier: action.payload.modifier }
          : n
      )
      
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
      return action.payload
    
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
    
    case 'CLEAR_ALL':
      // Clear all patterns in current section
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
      // Store selected notes in clipboard
      return { ...state, clipboard: { type: 'copy', data: Array.from(state.selectedSteps) } }
    
    case 'CUT_SELECTION':
      // Store selected notes in clipboard and mark for removal
      return { ...state, clipboard: { type: 'cut', data: Array.from(state.selectedSteps) } }
    
    case 'PASTE_SELECTION':
      // Paste is handled in project reducer, just clear cut clipboard if needed
      if (state.clipboard?.type === 'cut') {
        return { ...state, clipboard: null, selectedSteps: new Set() }
      }
      return state
    
    case 'SET_PATTERN_TYPE':
      // Store pattern type preference
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

export const store = new Store(initialState)