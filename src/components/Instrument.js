import { Step } from './Step.js'
import { getTotalSteps } from '../core/selectors.js'
import { store } from '../core/state.js'
import * as actions from '../core/actions.js'

export function Instrument({ instrument, index }) {
  const state = store.getState()
  const totalSteps = getTotalSteps(state)
  
  const wrapper = document.createElement('div')
  wrapper.className = 'instrument-wrapper'
  
  const container = document.createElement('div')
  container.className = 'flex items-center gap-0 group'
  container.dataset.instrumentId = instrument.id
  container.draggable = true
  
  // Drag handle
  const dragHandle = document.createElement('div')
  dragHandle.className = 'w-8 flex items-center justify-center cursor-move text-gray-500 hover:text-cyan-400 transition-colors'
  dragHandle.innerHTML = '≡'
  dragHandle.title = 'Drag to reorder'
  container.appendChild(dragHandle)
  
  const label = document.createElement('div')
  label.className = 'w-32 px-4 py-2 font-semibold text-sm text-gray-300 bg-slate-800 border-r border-slate-700'
  label.textContent = instrument.name
  container.appendChild(label)
  
  const stepsContainer = document.createElement('div')
  stepsContainer.className = 'flex gap-0'
  
  for (let i = 0; i < totalSteps; i++) {
    const step = Step({ instrumentId: instrument.id, stepIndex: i })
    stepsContainer.appendChild(step)
  }
  
  container.appendChild(stepsContainer)
  wrapper.appendChild(container)
  
  // Add grouping button between instruments
  const groupButton = document.createElement('button')
  groupButton.className = 'w-full h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-yellow-500 hover:text-yellow-400 transition-colors my-1'
  groupButton.innerHTML = '+'
  groupButton.title = 'Add instrument group'
  groupButton.onclick = () => {
    // This would trigger adding a group separator
    actions.addInstrumentGroup(index)
  }
  wrapper.appendChild(groupButton)
  
  // Drag event handlers
  container.addEventListener('dragstart', (e) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('instrumentId', instrument.id)
    container.classList.add('opacity-50')
  })
  
  container.addEventListener('dragend', () => {
    container.classList.remove('opacity-50')
  })
  
  container.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    container.classList.add('border-t-2', 'border-cyan-400')
  })
  
  container.addEventListener('dragleave', () => {
    container.classList.remove('border-t-2', 'border-cyan-400')
  })
  
  container.addEventListener('drop', (e) => {
    e.preventDefault()
    container.classList.remove('border-t-2', 'border-cyan-400')
    const draggedId = e.dataTransfer.getData('instrumentId')
    if (draggedId !== instrument.id) {
      actions.reorderInstrument(draggedId, instrument.id)
    }
  })
  
  return wrapper
}