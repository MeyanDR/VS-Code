export const actionTypes = {
  ADD_NOTE: 'ADD_NOTE',
  REMOVE_NOTE: 'REMOVE_NOTE',
  UPDATE_NOTE: 'UPDATE_NOTE',
  SET_SELECTION: 'SET_SELECTION',
  ADD_TO_SELECTION: 'ADD_TO_SELECTION',
  REMOVE_FROM_SELECTION: 'REMOVE_FROM_SELECTION',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  SET_ACTIVE_SYMBOL: 'SET_ACTIVE_SYMBOL',
  SET_ACTIVE_MODIFIER: 'SET_ACTIVE_MODIFIER',
  OPEN_EDIT_MODAL: 'OPEN_EDIT_MODAL',
  CLOSE_EDIT_MODAL: 'CLOSE_EDIT_MODAL',
  SET_DRAG_MODE: 'SET_DRAG_MODE',
  SET_IS_DRAGGING: 'SET_IS_DRAGGING',
  SET_PROJECT_NAME: 'SET_PROJECT_NAME',
  LOAD_PROJECT: 'LOAD_PROJECT',
  IMPORT_MIDI_PATTERN: 'IMPORT_MIDI_PATTERN',
  SET_MIDI_IMPORTED: 'SET_MIDI_IMPORTED',
  SET_QUANTIZATION: 'SET_QUANTIZATION',
  SET_VELOCITY_THRESHOLD: 'SET_VELOCITY_THRESHOLD',
  UNDO: 'UNDO',
  REDO: 'REDO',
  CLEAR_ALL: 'CLEAR_ALL',
  // New actions for enhanced features
  SET_PATTERN_TYPE: 'SET_PATTERN_TYPE',
  COPY_SELECTION: 'COPY_SELECTION',
  CUT_SELECTION: 'CUT_SELECTION',
  PASTE_SELECTION: 'PASTE_SELECTION',
  REORDER_INSTRUMENT: 'REORDER_INSTRUMENT',
  ADD_INSTRUMENT_GROUP: 'ADD_INSTRUMENT_GROUP',
  ADD_SECTION: 'ADD_SECTION',
  DUPLICATE_SECTION: 'DUPLICATE_SECTION',
  DELETE_SECTION: 'DELETE_SECTION',
  REORDER_SECTION: 'REORDER_SECTION',
  UPDATE_SECTION: 'UPDATE_SECTION',
  IMPORT_MIDI: 'IMPORT_MIDI',
  UPDATE_GRID: 'UPDATE_GRID',
  TOGGLE_STEP_SELECTION: 'TOGGLE_STEP_SELECTION'
}

export const addNote = (instrumentId, position, symbol = 'o', modifier = '') => ({
  type: actionTypes.ADD_NOTE,
  payload: { instrumentId, position, symbol, modifier }
})

export const removeNote = (instrumentId, position) => ({
  type: actionTypes.REMOVE_NOTE,
  payload: { instrumentId, position }
})

export const updateNote = (instrumentId, position, symbol, modifier) => ({
  type: actionTypes.UPDATE_NOTE,
  payload: { instrumentId, position, symbol, modifier }
})

export const setSelection = (stepIds) => ({
  type: actionTypes.SET_SELECTION,
  payload: stepIds
})

export const addToSelection = (stepId) => ({
  type: actionTypes.ADD_TO_SELECTION,
  payload: stepId
})

export const removeFromSelection = (stepId) => ({
  type: actionTypes.REMOVE_FROM_SELECTION,
  payload: stepId
})

export const clearSelection = () => ({
  type: actionTypes.CLEAR_SELECTION
})

export const toggleStepSelection = (stepId) => ({
  type: actionTypes.TOGGLE_STEP_SELECTION,
  payload: stepId
})

export const setActiveSymbol = (symbol) => ({
  type: actionTypes.SET_ACTIVE_SYMBOL,
  payload: symbol
})

export const setActiveModifier = (modifier) => ({
  type: actionTypes.SET_ACTIVE_MODIFIER,
  payload: modifier
})

export const openEditModal = (stepInfo) => ({
  type: actionTypes.OPEN_EDIT_MODAL,
  payload: stepInfo
})

export const closeEditModal = () => ({
  type: actionTypes.CLOSE_EDIT_MODAL
})

export const setDragMode = (mode) => ({
  type: actionTypes.SET_DRAG_MODE,
  payload: mode
})

export const setIsDragging = (isDragging) => ({
  type: actionTypes.SET_IS_DRAGGING,
  payload: isDragging
})

export const setProjectName = (name) => ({
  type: actionTypes.SET_PROJECT_NAME,
  payload: name
})

export const loadProject = (projectData) => ({
  type: actionTypes.LOAD_PROJECT,
  payload: projectData
})

export const importMidiPattern = (instruments) => ({
  type: actionTypes.IMPORT_MIDI_PATTERN,
  payload: { instruments }
})

export const setMidiImported = (imported) => ({
  type: actionTypes.SET_MIDI_IMPORTED,
  payload: imported
})

export const setQuantization = (value) => ({
  type: actionTypes.SET_QUANTIZATION,
  payload: value
})

export const setVelocityThreshold = (value) => ({
  type: actionTypes.SET_VELOCITY_THRESHOLD,
  payload: value
})

export const undo = () => ({
  type: actionTypes.UNDO
})

export const redo = () => ({
  type: actionTypes.REDO
})

export const clearAll = () => ({
  type: actionTypes.CLEAR_ALL
})

// New action creators for enhanced features
export const setPatternType = (patternType) => ({
  type: actionTypes.SET_PATTERN_TYPE,
  payload: patternType
})

export const copySelection = () => ({
  type: actionTypes.COPY_SELECTION
})

export const cutSelection = () => ({
  type: actionTypes.CUT_SELECTION
})

export const pasteSelection = (targetPosition) => ({
  type: actionTypes.PASTE_SELECTION,
  payload: targetPosition
})

export const reorderInstrument = (draggedId, targetId) => ({
  type: actionTypes.REORDER_INSTRUMENT,
  payload: { draggedId, targetId }
})

export const addInstrumentGroup = (index) => ({
  type: actionTypes.ADD_INSTRUMENT_GROUP,
  payload: index
})

export const addSection = (section) => ({
  type: actionTypes.ADD_SECTION,
  payload: section
})

export const duplicateSection = (sectionId) => ({
  type: actionTypes.DUPLICATE_SECTION,
  payload: sectionId
})

export const deleteSection = (sectionId) => ({
  type: actionTypes.DELETE_SECTION,
  payload: sectionId
})

export const reorderSection = (draggedId, targetId) => ({
  type: actionTypes.REORDER_SECTION,
  payload: { draggedId, targetId }
})

export const updateSection = (sectionId, updates) => ({
  type: actionTypes.UPDATE_SECTION,
  payload: { sectionId, updates }
})

export const importMidi = (midiData) => ({
  type: actionTypes.IMPORT_MIDI,
  payload: midiData
})

export const updateGrid = (gridSettings) => ({
  type: actionTypes.UPDATE_GRID,
  payload: gridSettings
})