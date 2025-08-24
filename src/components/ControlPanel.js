import { store } from '../core/state.js'
import { setProjectName, setActiveSymbol, clearSelection, undo, redo, clearAll, updateGrid, cutSelection, copySelection, pasteSelection } from '../core/actions.js'
import { getProjectName, getActiveSymbol, hasSelection, getGridSettings } from '../core/selectors.js'
import { storageService } from '../services/storage.js'
import { exportService } from '../services/export.js'

export function ControlPanel() {
  const state = store.getState()
  
  const container = document.createElement('div')
  container.className = 'space-y-4'
  
  // Project Name Bar
  const projectBar = document.createElement('div')
  projectBar.className = 'bg-slate-800 p-4 rounded-lg flex items-center gap-4'
  
  const projectLabel = document.createElement('span')
  projectLabel.className = 'text-gray-400 font-medium'
  projectLabel.textContent = 'Project Name:'
  projectBar.appendChild(projectLabel)
  
  const projectNameInput = document.createElement('input')
  projectNameInput.type = 'text'
  projectNameInput.value = getProjectName(state) || 'Untitled Project'
  projectNameInput.className = 'bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none flex-1 max-w-md'
  projectNameInput.placeholder = 'Enter project name...'
  projectNameInput.onchange = (e) => store.dispatch(setProjectName(e.target.value))
  projectBar.appendChild(projectNameInput)
  
  container.appendChild(projectBar)
  
  // Main Control Bar
  const controlBar = document.createElement('div')
  controlBar.className = 'bg-slate-800 p-4 rounded-lg'
  
  // Top Row of Controls
  const topControls = document.createElement('div')
  topControls.className = 'flex items-center justify-between mb-4'
  
  // Left side controls
  const leftControls = document.createElement('div')
  leftControls.className = 'flex items-center gap-2'
  
  // Functions dropdown
  const functionsContainer = document.createElement('div')
  functionsContainer.className = 'relative'
  
  const functionsBtn = createButton('🔧 Functions', 'bg-slate-700 hover:bg-slate-600', () => {
    const menu = functionsContainer.querySelector('.dropdown-menu')
    if (menu) {
      menu.classList.toggle('hidden')
    } else {
      const dropdown = document.createElement('div')
      dropdown.className = 'dropdown-menu absolute top-full left-0 mt-1 bg-slate-700 rounded shadow-lg z-50 min-w-[200px]'
      dropdown.innerHTML = `
        <button class="w-full px-4 py-2 text-left text-white hover:bg-slate-600 transition-colors" onclick="store.dispatch(clearSelection())">Clear Selection</button>
        <button class="w-full px-4 py-2 text-left text-white hover:bg-slate-600 transition-colors" onclick="console.log('Select All')">Select All</button>
        <button class="w-full px-4 py-2 text-left text-white hover:bg-slate-600 transition-colors" onclick="console.log('Invert Selection')">Invert Selection</button>
        <div class="border-t border-slate-600"></div>
        <button class="w-full px-4 py-2 text-left text-white hover:bg-slate-600 transition-colors" onclick="console.log('Duplicate Pattern')">Duplicate Pattern</button>
        <button class="w-full px-4 py-2 text-left text-white hover:bg-slate-600 transition-colors" onclick="console.log('Mirror Pattern')">Mirror Pattern</button>
      `
      functionsContainer.appendChild(dropdown)
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!functionsContainer.contains(e.target)) {
          dropdown.classList.add('hidden')
        }
      }, { once: true })
    }
  })
  functionsContainer.appendChild(functionsBtn)
  leftControls.appendChild(functionsContainer)
  
  // File operations
  leftControls.appendChild(createButton('➕ New', 'bg-slate-700 hover:bg-slate-600', () => {
    if (confirm('Create new project? Unsaved changes will be lost.')) {
      store.dispatch(clearAll())
      store.dispatch(setProjectName('Untitled Project'))
    }
  }))
  
  // Edit operations
  leftControls.appendChild(createDivider())
  leftControls.appendChild(createButton('↩️ Undo', 'bg-slate-700 hover:bg-slate-600', () => store.dispatch(undo())))
  leftControls.appendChild(createButton('↪️ Redo', 'bg-slate-700 hover:bg-slate-600', () => store.dispatch(redo())))
  
  leftControls.appendChild(createDivider())
  leftControls.appendChild(createButton('✂️ Cut', 'bg-slate-700 hover:bg-slate-600', () => {
    store.dispatch(cutSelection())
  }))
  leftControls.appendChild(createButton('📋 Copy', 'bg-slate-700 hover:bg-slate-600', () => {
    store.dispatch(copySelection())
  }))
  leftControls.appendChild(createButton('📌 Paste', 'bg-slate-700 hover:bg-slate-600', () => {
    store.dispatch(pasteSelection())
  }))
  
  topControls.appendChild(leftControls)
  
  // Right side controls
  const rightControls = document.createElement('div')
  rightControls.className = 'flex items-center gap-2'
  
  // Save/Load operations
  rightControls.appendChild(createButton('💾 Save', 'bg-blue-600 hover:bg-blue-700', () => {
    storageService.saveProject()
  }))
  rightControls.appendChild(createButton('📂 Load', 'bg-slate-700 hover:bg-slate-600', () => {
    storageService.loadProject()
  }))
  
  rightControls.appendChild(createDivider())
  
  // Import/Export
  rightControls.appendChild(createButton('⬇️ Download', 'bg-slate-700 hover:bg-slate-600', () => {
    storageService.downloadProject()
  }))
  
  const uploadBtn = document.createElement('label')
  uploadBtn.className = 'px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded cursor-pointer transition-colors text-sm'
  uploadBtn.innerHTML = '⬆️ Upload'
  const uploadInput = document.createElement('input')
  uploadInput.type = 'file'
  uploadInput.accept = '.json'
  uploadInput.className = 'hidden'
  uploadInput.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      storageService.uploadProject(file)
    }
  }
  uploadBtn.appendChild(uploadInput)
  rightControls.appendChild(uploadBtn)
  
  rightControls.appendChild(createDivider())
  rightControls.appendChild(createButton('🗑️ Clear', 'bg-red-600 hover:bg-red-700', () => {
    if (confirm('Clear all notes? This cannot be undone.')) {
      store.dispatch(clearAll())
    }
  }))
  rightControls.appendChild(createButton('📤 Export', 'bg-green-600 hover:bg-green-700', () => {
    exportService.exportAsImage('png')
  }))
  
  topControls.appendChild(rightControls)
  controlBar.appendChild(topControls)
  
  // Grid Configuration
  const gridConfig = document.createElement('div')
  gridConfig.className = 'flex items-center gap-4 pt-4 border-t border-slate-700'
  
  const gridLabel = document.createElement('span')
  gridLabel.className = 'text-gray-400 font-medium'
  gridLabel.textContent = 'Grid:'
  gridConfig.appendChild(gridLabel)
  
  // Store grid values for update button
  const currentGrid = getGridSettings(state)
  let gridValues = {
    bars: currentGrid.bars,
    beats: currentGrid.beats,
    subdivisions: currentGrid.subdivisions
  }
  
  // Bars control
  gridConfig.appendChild(createNumberInput('Bars', gridValues.bars, (value) => {
    gridValues.bars = value
  }))
  
  // Beats control
  gridConfig.appendChild(createNumberInput('Beats', gridValues.beats, (value) => {
    gridValues.beats = value
  }))
  
  // Subdivision control
  gridConfig.appendChild(createNumberInput('Subdivisions', gridValues.subdivisions, (value) => {
    gridValues.subdivisions = value
  }))
  
  const updateGridBtn = document.createElement('button')
  updateGridBtn.className = 'px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded transition-colors text-sm'
  updateGridBtn.textContent = 'Update Grid'
  updateGridBtn.onclick = () => {
    store.dispatch(updateGrid(gridValues))
  }
  gridConfig.appendChild(updateGridBtn)
  
  const addSectionBtn = document.createElement('button')
  addSectionBtn.className = 'ml-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full transition-colors text-lg w-10 h-10 flex items-center justify-center'
  addSectionBtn.textContent = '+'
  addSectionBtn.title = 'Add new section'
  addSectionBtn.onclick = () => {
    // Add new section
    console.log('Add section')
  }
  gridConfig.appendChild(addSectionBtn)
  
  controlBar.appendChild(gridConfig)
  container.appendChild(controlBar)
  
  // Section Information
  const sectionInfo = document.createElement('div')
  sectionInfo.className = 'bg-slate-800 p-4 rounded-lg'
  
  const sectionHeader = document.createElement('div')
  sectionHeader.className = 'flex items-center justify-between mb-3'
  
  const sectionName = document.createElement('input')
  sectionName.type = 'text'
  sectionName.value = 'Intro'
  sectionName.className = 'bg-transparent text-xl font-bold text-cyan-400 focus:outline-none focus:bg-slate-700 px-2 py-1 rounded'
  sectionHeader.appendChild(sectionName)
  
  const sectionFormula = document.createElement('span')
  sectionFormula.className = 'text-gray-400 text-sm'
  sectionFormula.textContent = '4 bars × 4 beats × 4 subdivision'
  sectionHeader.appendChild(sectionFormula)
  
  sectionInfo.appendChild(sectionHeader)
  
  const sectionNotes = document.createElement('textarea')
  sectionNotes.className = 'w-full bg-slate-700 text-gray-300 p-3 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none resize-none'
  sectionNotes.placeholder = 'Add notes about this section...'
  sectionNotes.rows = 2
  sectionInfo.appendChild(sectionNotes)
  
  container.appendChild(sectionInfo)
  
  return container
}

function createButton(text, className, onClick) {
  const btn = document.createElement('button')
  btn.className = `px-3 py-2 ${className} text-white font-medium rounded transition-colors text-sm`
  btn.innerHTML = text
  btn.onclick = onClick
  return btn
}

function createDivider() {
  const divider = document.createElement('div')
  divider.className = 'w-px h-8 bg-slate-600'
  return divider
}

function createNumberInput(label, value, onChange) {
  const container = document.createElement('div')
  container.className = 'flex items-center gap-2'
  
  const labelEl = document.createElement('span')
  labelEl.className = 'text-gray-400 text-sm'
  labelEl.textContent = label + ':'
  container.appendChild(labelEl)
  
  const minusBtn = document.createElement('button')
  minusBtn.className = 'w-6 h-6 bg-slate-600 hover:bg-slate-500 text-white rounded flex items-center justify-center text-sm'
  minusBtn.textContent = '-'
  minusBtn.onclick = () => {
    const input = container.querySelector('input')
    const newVal = Math.max(1, parseInt(input.value) - 1)
    input.value = newVal
    onChange(newVal)
  }
  container.appendChild(minusBtn)
  
  const input = document.createElement('input')
  input.type = 'number'
  input.value = value
  input.min = '1'
  input.max = '32'
  input.className = 'w-12 bg-slate-700 text-white text-center rounded border border-slate-600 focus:border-cyan-500 focus:outline-none'
  input.onchange = (e) => onChange(parseInt(e.target.value))
  container.appendChild(input)
  
  const plusBtn = document.createElement('button')
  plusBtn.className = 'w-6 h-6 bg-slate-600 hover:bg-slate-500 text-white rounded flex items-center justify-center text-sm'
  plusBtn.textContent = '+'
  plusBtn.onclick = () => {
    const input = container.querySelector('input')
    const newVal = Math.min(32, parseInt(input.value) + 1)
    input.value = newVal
    onChange(newVal)
  }
  container.appendChild(plusBtn)
  
  return container
}