import { store } from '../core/state.js'
import { updateNote, closeEditModal, setActiveSymbol, setActiveModifier } from '../core/actions.js'
import { getEditingStep, parseStepPosition } from '../core/selectors.js'

export function EditModal() {
  const state = store.getState()
  const editingStep = getEditingStep(state)
  
  if (!editingStep) return null
  
  const { instrumentId, stepIndex } = parseStepPosition(editingStep)
  
  const backdrop = document.createElement('div')
  backdrop.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
  backdrop.id = 'edit-modal'
  
  const modal = document.createElement('div')
  modal.className = 'bg-slate-800 rounded-lg p-6 shadow-2xl min-w-[300px]'
  modal.onclick = (e) => e.stopPropagation()
  
  const title = document.createElement('h3')
  title.className = 'text-lg font-bold mb-4 text-white'
  title.textContent = 'Edit Note'
  modal.appendChild(title)
  
  const symbolSection = document.createElement('div')
  symbolSection.className = 'mb-4'
  
  const symbolLabel = document.createElement('p')
  symbolLabel.className = 'text-sm text-gray-400 mb-2'
  symbolLabel.textContent = 'Symbol'
  symbolSection.appendChild(symbolLabel)
  
  const symbols = document.createElement('div')
  symbols.className = 'flex gap-2'
  
  const symbolOptions = ['o', 'x', '/', '•', '◯']
  symbolOptions.forEach(sym => {
    const btn = document.createElement('button')
    btn.className = 'px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold transition-colors'
    btn.textContent = sym
    btn.onclick = () => {
      const currentModifier = state.ui.activeModifier
      store.dispatch(setActiveSymbol(sym))
      store.dispatch(updateNote(instrumentId, stepIndex, sym, currentModifier))
    }
    symbols.appendChild(btn)
  })
  
  symbolSection.appendChild(symbols)
  modal.appendChild(symbolSection)
  
  const modifierSection = document.createElement('div')
  modifierSection.className = 'mb-4'
  
  const modifierLabel = document.createElement('p')
  modifierLabel.className = 'text-sm text-gray-400 mb-2'
  modifierLabel.textContent = 'Modifiers'
  modifierSection.appendChild(modifierLabel)
  
  const modifiers = document.createElement('div')
  modifiers.className = 'flex gap-2'
  
  const modifierOptions = [
    { label: 'Normal', value: '' },
    { label: 'Accent', value: 'accent' },
    { label: 'Ghost', value: 'ghost' }
  ]
  
  modifierOptions.forEach(mod => {
    const btn = document.createElement('button')
    btn.className = `px-3 py-1 rounded text-xs transition-colors ${
      mod.value === 'accent' ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400' :
      mod.value === 'ghost' ? 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-400' :
      'bg-slate-700 hover:bg-slate-600 text-white'
    }`
    btn.textContent = mod.label
    btn.onclick = () => {
      const currentSymbol = state.ui.activeSymbol
      store.dispatch(setActiveModifier(mod.value))
      store.dispatch(updateNote(instrumentId, stepIndex, currentSymbol, mod.value))
    }
    modifiers.appendChild(btn)
  })
  
  modifierSection.appendChild(modifiers)
  modal.appendChild(modifierSection)
  
  const closeBtn = document.createElement('button')
  closeBtn.className = 'mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition-colors w-full'
  closeBtn.textContent = 'Done'
  closeBtn.onclick = () => store.dispatch(closeEditModal())
  modal.appendChild(closeBtn)
  
  backdrop.appendChild(modal)
  backdrop.onclick = () => store.dispatch(closeEditModal())
  
  return backdrop
}