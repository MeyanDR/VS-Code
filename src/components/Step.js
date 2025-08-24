import { store } from '../core/state.js'
import { getNoteAtPosition, isStepSelected, isBeatStart, isBarStart, getGridSettings } from '../core/selectors.js'

export function Step({ instrumentId, stepIndex }) {
  const state = store.getState()
  const note = getNoteAtPosition(state, instrumentId, stepIndex)
  const stepId = `${instrumentId}-${stepIndex}`
  const isSelected = isStepSelected(state, stepId)
  const grid = getGridSettings(state)
  const isBeat = isBeatStart(stepIndex, grid)
  const isBar = isBarStart(stepIndex, grid)
  
  const colorMap = {
    'kick': 'bg-red-500',
    'snare': 'bg-blue-500',
    'hihat': 'bg-yellow-500',
    'crash': 'bg-emerald-500'
  }
  
  const classes = [
    'step-cell',
    'drum-step',
    note ? (colorMap[instrumentId] || 'bg-gray-500') : '',
    isSelected ? 'selected' : '',
    isBeat ? 'beat-start' : '',
    isBar ? 'bar-start' : ''
  ].filter(Boolean).join(' ')
  
  const element = document.createElement('div')
  element.className = classes
  element.dataset.stepId = stepId
  element.dataset.instrumentId = instrumentId
  element.dataset.stepIndex = stepIndex
  
  if (note) {
    let display = note.symbol || 'x';
    
    // Handle number modifiers
    if (note.modifier && ['1', '2', '3'].includes(note.modifier)) {
      display += note.modifier;
    }
    
    // Handle ghost notation
    if (note.modifier === 'ghost') {
      display = `(${display})`;
    }
    
    // Handle accent
    if (note.modifier === 'accent') {
      display = `<${display}`;
    }
    
    const symbolEl = document.createElement('span')
    symbolEl.className = 'text-white text-sm font-mono'
    symbolEl.textContent = display
    element.appendChild(symbolEl)
  }
  
  return element
}