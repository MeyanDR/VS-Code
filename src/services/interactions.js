import { store } from '../core/state.js'
import { 
  addNote, 
  removeNote, 
  openEditModal, 
  setDragMode, 
  setIsDragging,
  addToSelection,
  clearSelection,
  setSelection,
  removeFromSelection
} from '../core/actions.js'
import { 
  getNoteAtPosition, 
  parseStepPosition,
  getActiveSymbol,
  getActiveModifier,
  isDragging,
  getDragMode,
  isStepSelected,
  getSelectedSteps,
  hasSelection
} from '../core/selectors.js'

class InteractionHandler {
  constructor() {
    this.dragStartPos = null
    this.draggedSteps = new Set()
    this.initialSelection = new Set()
    this.bindEvents()
  }

  bindEvents() {
    document.addEventListener('mousedown', this.handleMouseDown.bind(this))
    document.addEventListener('mousemove', this.handleMouseMove.bind(this))
    document.addEventListener('mouseup', this.handleMouseUp.bind(this))
    document.addEventListener('click', this.handleClick.bind(this))
    document.addEventListener('dblclick', this.handleDoubleClick.bind(this))
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
  }

  handleMouseDown(e) {
    const stepEl = e.target.closest('[data-step-id]')
    if (!stepEl) return
    
    e.preventDefault()
    
    const state = store.getState()
    const stepId = stepEl.dataset.stepId
    
    if (e.shiftKey) {
      store.dispatch(setDragMode('select'))
      this.initialSelection = new Set(state.ui.selectedSteps)
    } else if (e.ctrlKey || e.metaKey) {
      store.dispatch(setDragMode('delete'))
    } else {
      store.dispatch(setDragMode('add'))
    }
    
    this.dragStartPos = { x: e.clientX, y: e.clientY, stepId }
    this.draggedSteps.clear()
    this.draggedSteps.add(stepId)
  }

  handleMouseMove(e) {
    if (!this.dragStartPos) return
    
    const deltaX = Math.abs(e.clientX - this.dragStartPos.x)
    const deltaY = Math.abs(e.clientY - this.dragStartPos.y)
    
    if (deltaX > 5 || deltaY > 5) {
      const state = store.getState()
      if (!isDragging(state)) {
        store.dispatch(setIsDragging(true))
      }
      
      const element = document.elementFromPoint(e.clientX, e.clientY)
      const stepEl = element?.closest('[data-step-id]')
      
      if (stepEl && !this.draggedSteps.has(stepEl.dataset.stepId)) {
        this.applyDragAction(stepEl.dataset.stepId)
        this.draggedSteps.add(stepEl.dataset.stepId)
      }
    }
  }

  handleMouseUp(e) {
    if (this.dragStartPos) {
      store.dispatch(setIsDragging(false))
      store.dispatch(setDragMode(null))
      this.dragStartPos = null
      this.draggedSteps.clear()
      this.initialSelection.clear()
    }
  }

  handleClick(e) {
    const stepEl = e.target.closest('[data-step-id]')
    if (!stepEl) return
    
    const state = store.getState()
    if (isDragging(state)) return
    
    const stepId = stepEl.dataset.stepId
    const { instrumentId, stepIndex } = parseStepPosition(stepId)
    const hasNote = getNoteAtPosition(state, instrumentId, stepIndex)
    
    if (e.shiftKey) {
      if (isStepSelected(state, stepId)) {
        store.dispatch(removeFromSelection(stepId))
      } else {
        store.dispatch(addToSelection(stepId))
      }
    } else if (hasNote && !e.ctrlKey && !e.metaKey) {
      store.dispatch(openEditModal(stepId))
    } else if (!hasNote && !e.ctrlKey && !e.metaKey) {
      const symbol = getActiveSymbol(state)
      const modifier = getActiveModifier(state)
      store.dispatch(addNote(instrumentId, stepIndex, symbol, modifier))
    }
  }

  handleDoubleClick(e) {
    const stepEl = e.target.closest('[data-step-id]')
    if (!stepEl) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const stepId = stepEl.dataset.stepId
    const { instrumentId, stepIndex } = parseStepPosition(stepId)
    
    store.dispatch(removeNote(instrumentId, stepIndex))
  }

  applyDragAction(stepId) {
    const state = store.getState()
    const dragMode = getDragMode(state)
    const { instrumentId, stepIndex } = parseStepPosition(stepId)
    
    switch(dragMode) {
      case 'add':
        const symbol = getActiveSymbol(state)
        const modifier = getActiveModifier(state)
        store.dispatch(addNote(instrumentId, stepIndex, symbol, modifier))
        break
        
      case 'delete':
        store.dispatch(removeNote(instrumentId, stepIndex))
        break
        
      case 'select':
        store.dispatch(addToSelection(stepId))
        break
    }
  }

  handleKeyDown(e) {
    const state = store.getState()
    
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (hasSelection(state)) {
        e.preventDefault()
        const selectedSteps = getSelectedSteps(state)
        selectedSteps.forEach(stepId => {
          const { instrumentId, stepIndex } = parseStepPosition(stepId)
          store.dispatch(removeNote(instrumentId, stepIndex))
        })
        store.dispatch(clearSelection())
      }
    }
    
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'a') {
        e.preventDefault()
        this.selectAll()
      }
      
      if (e.key === 's') {
        e.preventDefault()
        document.getElementById('save-btn')?.click()
      }
    }
    
    if (e.key === 'Escape') {
      store.dispatch(clearSelection())
    }
  }

  selectAll() {
    const gridEl = document.getElementById('drum-grid')
    if (!gridEl) return
    
    const allSteps = gridEl.querySelectorAll('[data-step-id]')
    const stepIds = Array.from(allSteps).map(el => el.dataset.stepId)
    store.dispatch(setSelection(stepIds))
  }
}

export const interactionHandler = new InteractionHandler()