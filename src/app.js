import './styles/main.css'
import { store } from './core/state.js'
import { Grid } from './components/Grid.js'
import { ControlPanel } from './components/ControlPanel.js'
import { EditModal } from './components/EditModal.js'
import { PatternEditor } from './components/PatternEditor.js'
import { SongStructure } from './components/SongStructure.js'
import { SymbolLegend } from './components/SymbolLegend.js'
import { midiService } from './services/midi.js'
import { exportService } from './services/export.js'
import { storageService } from './services/storage.js'
import { interactionHandler } from './services/interactions.js'
import { keyboardService } from './services/keyboard.js'
import * as actions from './core/actions.js'

class TromklubApp {
  constructor() {
    this.container = null
    this.init()
  }

  init() {
    console.log('TROMKLUB: Initializing app...')
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.startApp()
      })
    } else {
      this.startApp()
    }
  }

  startApp() {
    try {
      console.log('TROMKLUB: Starting app...')
      this.setupContainer()
      this.render()
      this.bindEvents()
      this.loadSavedProject()
      storageService.startAutoSave()
      console.log('TROMKLUB: App initialized successfully')
    } catch (error) {
      console.error('TROMKLUB: Failed to initialize:', error)
    }
  }

  setupContainer() {
    this.container = document.getElementById('app')
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.id = 'app'
      document.body.appendChild(this.container)
    }
    
    this.container.className = 'min-h-screen bg-slate-900'
  }

  render() {
    console.log('TROMKLUB: Rendering app...')
    const state = store.getState()
    console.log('TROMKLUB: Current state:', state)
    
    this.container.innerHTML = ''
    
    // Main layout container
    const layoutContainer = document.createElement('div')
    layoutContainer.className = 'flex flex-col h-screen'
    
    // Header
    const header = document.createElement('div')
    header.className = 'px-8 py-4 bg-slate-900 border-b border-slate-700'
    
    const titleContainer = document.createElement('div')
    titleContainer.className = 'flex flex-col'
    
    const title = document.createElement('h1')
    title.className = 'text-5xl font-bold text-white mb-2 tracking-tight flex items-center gap-3'
    title.innerHTML = '<span>🍎</span> The TROMKLUB machine'
    titleContainer.appendChild(title)
    
    const subtitle = document.createElement('p')
    subtitle.className = 'text-gray-400 text-lg ml-12'
    subtitle.textContent = 'Made By Jan Heirman'
    titleContainer.appendChild(subtitle)
    
    header.appendChild(titleContainer)
    layoutContainer.appendChild(header)
    
    // Three-column layout
    const contentWrapper = document.createElement('div')
    contentWrapper.className = 'flex flex-1 overflow-hidden'
    
    // Left Panel - Pattern Editor
    const patternEditor = new PatternEditor(state, actions)
    this.patternEditor = patternEditor
    const leftPanel = patternEditor.render()
    contentWrapper.appendChild(leftPanel)
    
    // Center Content
    const centerContent = document.createElement('div')
    centerContent.className = 'flex-1 flex flex-col overflow-auto p-8'
    
    const controlPanel = ControlPanel()
    if (controlPanel) {
      console.log('TROMKLUB: ControlPanel rendered')
      centerContent.appendChild(controlPanel)
    } else {
      console.error('TROMKLUB: ControlPanel returned null/undefined')
    }
    
    const grid = Grid()
    if (grid) {
      console.log('TROMKLUB: Grid rendered')
      centerContent.appendChild(grid)
    } else {
      console.error('TROMKLUB: Grid returned null/undefined')
    }
    
    // Song Structure component
    const songStructure = new SongStructure(state, actions)
    this.songStructure = songStructure
    centerContent.appendChild(songStructure.render())
    
    contentWrapper.appendChild(centerContent)
    
    // Right Panel (placeholder for future features)
    const rightPanel = document.createElement('div')
    rightPanel.className = 'w-64 bg-slate-800 border-l border-slate-700 p-4'
    rightPanel.style.display = 'none' // Hide for now
    contentWrapper.appendChild(rightPanel)
    
    layoutContainer.appendChild(contentWrapper)
    this.container.appendChild(layoutContainer)
    
    // Add Symbol Legend
    const symbolLegend = SymbolLegend()
    this.container.appendChild(symbolLegend)
    
    const editModal = EditModal()
    if (editModal) {
      this.container.appendChild(editModal)
    }
  }

  bindEvents() {
    let lastState = store.getState()
    let renderTimeout = null
    
    store.subscribe(() => {
      const newState = store.getState()
      
      // Only re-render if state actually changed
      if (JSON.stringify(lastState) !== JSON.stringify(newState)) {
        lastState = newState
        
        // Debounce renders to prevent loops
        if (renderTimeout) clearTimeout(renderTimeout)
        renderTimeout = setTimeout(() => {
          this.render()
          this.rebindDynamicEvents()
        }, 10)
      }
    })
    
    this.rebindDynamicEvents()
  }

  rebindDynamicEvents() {
    const midiInput = document.getElementById('midi-import')
    if (midiInput) {
      midiInput.onchange = async (e) => {
        const file = e.target.files[0]
        if (file) {
          const success = await midiService.importMidiFile(file)
          if (success) {
            storageService.showSaveNotification('MIDI imported successfully')
          } else {
            storageService.showSaveNotification('Failed to import MIDI', 'error')
          }
        }
      }
    }
    
    const exportBtn = document.getElementById('export-btn')
    if (exportBtn) {
      exportBtn.onclick = async () => {
        const success = await exportService.exportAsImage('png')
        if (success) {
          storageService.showSaveNotification('Image exported successfully')
        }
      }
    }
    
    const saveBtn = document.getElementById('save-btn')
    if (saveBtn) {
      saveBtn.onclick = () => {
        storageService.saveProject()
      }
    }
  }

  loadSavedProject() {
    storageService.loadProject()
  }
}

console.log('TROMKLUB: Creating app instance...')
const app = new TromklubApp()
console.log('TROMKLUB: App instance created')

window.tromklub = {
  store,
  exportService,
  storageService,
  midiService
}
console.log('TROMKLUB: Global tromklub object attached to window')