import { Instrument } from './Instrument.js'
import { getInstruments, getTotalSteps, getGridSettings } from '../core/selectors.js'
import { store } from '../core/state.js'
import * as actions from '../core/actions.js'

export function Grid() {
  const state = store.getState()
  const instruments = getInstruments(state)
  const totalSteps = getTotalSteps(state)
  const grid = getGridSettings(state)
  
  const container = document.createElement('div')
  container.id = 'drum-grid'
  container.className = 'bg-slate-900 p-6 rounded-lg shadow-2xl'
  
  // Enhanced header with bar.beat notation
  const header = document.createElement('div')
  header.className = 'flex items-center gap-0 mb-2'
  
  const spacer = document.createElement('div')
  spacer.className = 'w-40' // Increased width for drag handles
  header.appendChild(spacer)
  
  const numbersRow = document.createElement('div')
  numbersRow.className = 'flex gap-0'
  
  for (let i = 0; i < totalSteps; i++) {
    const numberCell = document.createElement('div')
    numberCell.className = 'w-8 h-8 flex items-center justify-center text-xs'
    
    const beat = Math.floor(i / grid.subdivisions) % grid.beats + 1
    const bar = Math.floor(i / (grid.subdivisions * grid.beats)) + 1
    const subdivision = (i % grid.subdivisions) + 1
    
    // Show bar.beat notation at the start of each beat
    if (i % grid.subdivisions === 0) {
      numberCell.textContent = `${bar}.${beat}`
      numberCell.className += ' font-semibold text-cyan-400 border-l border-slate-600'
      
      // Stronger visual separation between bars
      if (beat === 1) {
        numberCell.className += ' border-l-2 border-cyan-500'
      }
    } else {
      // Show subdivision markers
      numberCell.textContent = subdivision
      numberCell.className += ' text-[10px] text-gray-600'
    }
    
    numbersRow.appendChild(numberCell)
  }
  
  header.appendChild(numbersRow)
  container.appendChild(header)
  
  const gridContent = document.createElement('div')
  gridContent.className = 'space-y-1'
  
  instruments.forEach((instrument, index) => {
    const instrumentRow = Instrument({ instrument, index })
    gridContent.appendChild(instrumentRow)
  })
  
  container.appendChild(gridContent)
  
  return container
}