import './styles/main.css'
import { store } from './core/state.js'
import { Header } from './components/Header.js'
import { Grid } from './components/Grid.js'
import { ControlPanel } from './components/ControlPanel.js'
import { InstructionPanel } from './components/InstructionPanel.js'
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
      console.log('🥁 TROMKLUB Machine initializing...')
      this.setupContainer()
      this.render()
      this.bindEvents()
      this.loadSavedProject()
      storageService.startAutoSave()
    } catch (error) {
      console.error('Failed to initialize:', error)
    }
  }

  setupContainer() {
    this.container = document.getElementById('app')
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.id = 'app'
      document.body.appendChild(this.container)
    }
    
    this.container.className = 'min-h-screen bg-gradient-to-b from-slate-900 to-slate-950'
  }

  render() {
    const state = store.getState()
    
    this.container.innerHTML = ''
    
    // Main layout container
    const layoutContainer = document.createElement('div')
    layoutContainer.className = 'flex flex-col h-screen'
    
    // Header with title and project name
    const header = Header()
    layoutContainer.appendChild(header)
    
    // Main content area
    const mainContent = document.createElement('div')
    mainContent.className = 'flex-1 overflow-auto px-6 py-4'
    
    // Control Panel and Grid Configuration
    const controlPanel = ControlPanel()
    if (controlPanel) {
      mainContent.appendChild(controlPanel)
    }
    
    // Instruction Panel
    const instructionPanel = InstructionPanel()
    mainContent.appendChild(instructionPanel)
    
    // Three-column layout for pattern editor, grid, and structure
    const contentWrapper = document.createElement('div')
    contentWrapper.className = 'flex gap-4 mt-4'
    
    // Left Panel - Pattern Editor
    const patternEditor = new PatternEditor(state, actions)
    this.patternEditor = patternEditor
    const leftPanel = patternEditor.render()
    contentWrapper.appendChild(leftPanel)
    
    // Center - Grid and Song Structure
    const centerContent = document.createElement('div')
    centerContent.className = 'flex-1 flex flex-col gap-4'
    
    const grid = Grid()
    if (grid) {
      centerContent.appendChild(grid)
    }
    
    // Song Structure component
    const songStructure = new SongStructure(state, actions)
    this.songStructure = songStructure
    centerContent.appendChild(songStructure.render())
    
    contentWrapper.appendChild(centerContent)
    mainContent.appendChild(contentWrapper)
    
    layoutContainer.appendChild(mainContent)
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

const app = new TromklubApp()

window.tromklub = {
  store,
  exportService,
  storageService,
  midiService
}