export const getCurrentSection = (state) => {
  return state.project.sections[state.project.currentSection]
}

export const getInstruments = (state) => {
  const section = getCurrentSection(state)
  return section ? section.instruments : []
}

export const getInstrumentById = (state, instrumentId) => {
  const instruments = getInstruments(state)
  return instruments.find(i => i.id === instrumentId)
}

export const getGridSettings = (state) => {
  const section = getCurrentSection(state)
  return section ? section.grid : { bars: 4, beats: 4, subdivisions: 4 }
}

export const getTotalSteps = (state) => {
  const grid = getGridSettings(state)
  return grid.bars * grid.beats * grid.subdivisions
}

export const getStepPosition = (instrumentId, stepIndex) => {
  return `${instrumentId}-${stepIndex}`
}

import { parseStepKey } from '../lib/selection'

export const parseStepPosition = (stepPosition) => {
  const { instrumentId, position } = parseStepKey(stepPosition)
  return { instrumentId, stepIndex: parseInt(position) }
}

export const hasNoteAtPosition = (state, instrumentId, position) => {
  const instrument = getInstrumentById(state, instrumentId)
  if (!instrument) return false
  return instrument.pattern.some(n => n.position === position)
}

export const getNoteAtPosition = (state, instrumentId, position) => {
  const instrument = getInstrumentById(state, instrumentId)
  if (!instrument) return null
  return instrument.pattern.find(n => n.position === position)
}

export const isStepSelected = (state, stepId) => {
  return state.ui.selectedSteps.has(stepId)
}

export const getSelectedSteps = (state) => {
  return Array.from(state.ui.selectedSteps)
}

export const hasSelection = (state) => {
  return state.ui.selectedSteps.size > 0
}

export const getActiveSymbol = (state) => {
  return state.ui.activeSymbol
}

export const getActiveModifier = (state) => {
  return state.ui.activeModifier
}

export const getEditingStep = (state) => {
  return state.ui.editingStep
}

export const isDragging = (state) => {
  return state.ui.isDragging
}

export const getDragMode = (state) => {
  return state.ui.dragMode
}

export const isBeatStart = (stepIndex, grid) => {
  return stepIndex % grid.subdivisions === 0
}

export const isBarStart = (stepIndex, grid) => {
  const stepsPerBar = grid.beats * grid.subdivisions
  return stepIndex % stepsPerBar === 0
}

export const getProjectName = (state) => {
  return state.project.name
}

export const isMidiImported = (state) => {
  return state.midi.imported
}

export const getQuantization = (state) => {
  return state.midi.quantization
}

export const getVelocityThreshold = (state) => {
  return state.midi.velocityThreshold
}
