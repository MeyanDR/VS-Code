import React, { useState, useRef } from 'react'
import { useAppState } from '../contexts/AppContext'
import { saveAs } from 'file-saver'

export default function ControlPanel({ onExport, onMidiImport, onLayoutClick }) {
  const { state, dispatch } = useAppState()
  const [showFunctionsMenu, setShowFunctionsMenu] = useState(false)
  const [gridValues, setGridValues] = useState(() => {
    const section = state.project.sections[state.project.currentSection]
    return section ? { ...section.grid } : { bars: 4, beats: 4, subdivisions: 4 }
  })
  const uploadInputRef = useRef(null)

  const section = state.project.sections[state.project.currentSection]

  const handleClearSelection = () => {
    dispatch({ type: 'CLEAR_SELECTION' })
    setShowFunctionsMenu(false)
  }

  const handleSelectAll = () => {
    // Select all notes in current section
    const section = state.project.sections[state.project.currentSection]
    if (!section) return
    
    const allSteps = []
    const totalSteps = section.grid.bars * section.grid.beats * section.grid.subdivisions
    
    section.instruments.forEach(instrument => {
      for (let i = 0; i < totalSteps; i++) {
        if (instrument.pattern.some(n => n.position === i)) {
          allSteps.push(`${instrument.id}-${i}`)
        }
      }
    })
    
    dispatch({ type: 'SET_SELECTION', payload: allSteps })
    setShowFunctionsMenu(false)
  }

  const handleNew = () => {
    if (confirm('Create new project? Unsaved changes will be lost.')) {
      dispatch({ type: 'CLEAR_ALL' })
    }
  }

  const handleUndo = () => dispatch({ type: 'UNDO' })
  const handleRedo = () => dispatch({ type: 'REDO' })
  const handleCut = () => dispatch({ type: 'CUT_SELECTION' })
  const handleCopy = () => dispatch({ type: 'COPY_SELECTION' })
  const handlePaste = () => dispatch({ type: 'PASTE_SELECTION' })

  const handleSave = () => {
    // Trigger save event for auto-save hook
    window.dispatchEvent(new CustomEvent('save-project'))
  }
  
  const handleLoad = () => {
    const saved = localStorage.getItem('tromklub_autosave')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        dispatch({ type: 'LOAD_PROJECT', payload: parsed.project })
      } catch (error) {
        console.error('Failed to load project:', error)
      }
    }
  }
  
  const handleDownload = () => {
    const exportData = {
      version: '1.0.0',
      project: state.project,
      layout: state.layout,
      themes: state.themes,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const filename = `${state.project.name || 'untitled'}_${new Date().toISOString().split('T')[0]}.json`
    saveAs(blob, filename)
  }
  
  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        
        if (data.project) {
          dispatch({ type: 'LOAD_PROJECT', payload: data.project })
        }
        if (data.layout) {
          dispatch({ type: 'UPDATE_LAYOUT', payload: data.layout })
        }
        if (data.themes) {
          dispatch({ type: 'SET_THEME', payload: data.themes.current })
        }
      } catch (error) {
        console.error('Failed to upload project:', error)
        alert('Failed to load project file')
      }
    }
  }

  const handleClear = () => {
    if (confirm('Clear all notes? This cannot be undone.')) {
      dispatch({ type: 'CLEAR_ALL' })
    }
  }

  const handleUpdateGrid = () => {
    dispatch({ type: 'UPDATE_GRID', payload: gridValues })
  }

  const handleGridChange = (field, value) => {
    setGridValues(prev => ({ ...prev, [field]: value }))
  }

  const handleSectionNameChange = (e) => {
    // TODO: Implement section name change
    console.log('Section name change:', e.target.value)
  }

  const handleSectionNotesChange = (e) => {
    // TODO: Implement section notes change
    console.log('Section notes change:', e.target.value)
  }

  return (
    <div className="space-y-2">
      {/* Main Control Bar */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-1">
          {/* Functions dropdown */}
          <div className="relative">
            <button
              className="px-3 py-1.5 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary font-medium rounded text-xs transition-colors"
              onClick={() => setShowFunctionsMenu(!showFunctionsMenu)}
            >
              Functions
            </button>
            {showFunctionsMenu && (
              <div className="absolute top-full left-0 mt-1 bg-daw-bg-panel border border-daw-border rounded shadow-lg z-50 min-w-[180px]">
                <button
                  className="w-full px-3 py-1.5 text-left text-daw-text-primary text-xs hover:bg-daw-button-hover transition-colors"
                  onClick={handleClearSelection}
                >
                  Clear Selection
                </button>
                <button
                  className="w-full px-3 py-1.5 text-left text-daw-text-primary text-xs hover:bg-daw-button-hover transition-colors"
                  onClick={handleSelectAll}
                >
                  Select All
                </button>
                <button
                  className="w-full px-3 py-1.5 text-left text-daw-text-primary text-xs hover:bg-daw-button-hover transition-colors"
                  onClick={() => {
                    console.log('TODO: Implement invert selection')
                    setShowFunctionsMenu(false)
                  }}
                >
                  Invert Selection
                </button>
                <div className="border-t border-daw-border" />
                <button
                  className="w-full px-3 py-1.5 text-left text-daw-text-primary text-xs hover:bg-daw-button-hover transition-colors"
                  onClick={() => {
                    console.log('TODO: Implement duplicate pattern')
                    setShowFunctionsMenu(false)
                  }}
                >
                  Duplicate Pattern
                </button>
                <button
                  className="w-full px-3 py-1.5 text-left text-daw-text-primary text-xs hover:bg-daw-button-hover transition-colors"
                  onClick={() => {
                    console.log('TODO: Implement mirror pattern')
                    setShowFunctionsMenu(false)
                  }}
                >
                  Mirror Pattern
                </button>
              </div>
            )}
          </div>

          <button
            className="px-3 py-1.5 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary font-medium rounded text-xs transition-colors"
            onClick={handleNew}
          >
            New
          </button>
          
          <button
            className="px-3 py-1.5 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary font-medium rounded text-xs transition-colors"
            onClick={handleUndo}
          >
            Undo
          </button>
          
          <button
            className="px-3 py-1.5 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary font-medium rounded text-xs transition-colors"
            onClick={handleRedo}
          >
            Redo
          </button>
          
          <button
            className="px-3 py-1.5 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary font-medium rounded text-xs transition-colors"
            onClick={handleCut}
          >
            Cut
          </button>
          
          <button
            className="px-3 py-1.5 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary font-medium rounded text-xs transition-colors"
            onClick={handleCopy}
          >
            Copy
          </button>
          
          <button
            className="px-3 py-1.5 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary font-medium rounded text-xs transition-colors"
            onClick={handlePaste}
          >
            Paste
          </button>
          
          <button
            className="px-3 py-1.5 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary font-medium rounded text-xs transition-colors"
            onClick={handleSave}
          >
            Save
          </button>
          
          <button
            className="px-3 py-1.5 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary font-medium rounded text-xs transition-colors"
            onClick={handleLoad}
          >
            Load
          </button>
          
          <button
            className="px-3 py-1.5 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary font-medium rounded text-xs transition-colors"
            onClick={handleDownload}
          >
            Download
          </button>
          
          <label className="px-3 py-1.5 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary font-medium rounded cursor-pointer transition-colors text-xs">
            Upload
            <input
              ref={uploadInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
          
          <button
            className="px-3 py-1.5 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary font-medium rounded text-xs transition-colors"
            onClick={handleClear}
          >
            Clear
          </button>
          
          <button
            className="px-3 py-1.5 bg-daw-accent hover:bg-daw-accent-hover text-daw-bg-primary font-medium rounded text-xs transition-colors"
            onClick={() => onExport('custom')}
          >
            Export
          </button>
          
          <div className="border-l border-daw-border h-6 mx-2" />
          
          {/* Grid Configuration */}
          <div className="flex items-center gap-2">
          <NumberInput
            label="Bars"
            value={gridValues.bars}
            onChange={(value) => handleGridChange('bars', value)}
          />
          
          <NumberInput
            label="Beats"
            value={gridValues.beats}
            onChange={(value) => handleGridChange('beats', value)}
          />
          
          <NumberInput
            label="Subdivisions"
            value={gridValues.subdivisions}
            onChange={(value) => handleGridChange('subdivisions', value)}
          />
          
          <button
            className="px-3 py-1.5 bg-daw-accent hover:bg-daw-accent-hover text-daw-bg-primary font-medium rounded text-xs transition-colors"
            onClick={handleUpdateGrid}
          >
            Update Grid
          </button>
          </div>
        </div>
      </div>

    </div>
  )
}

function NumberInput({ label, value, onChange }) {
  const handleIncrement = () => {
    onChange(Math.min(32, value + 1))
  }

  const handleDecrement = () => {
    onChange(Math.max(1, value - 1))
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-daw-text-secondary text-xs">{label}:</span>
      
      <button
        className="w-5 h-5 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary rounded flex items-center justify-center text-xs"
        onClick={handleDecrement}
      >
        -
      </button>
      
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        min="1"
        max="32"
        className="w-10 bg-daw-bg-panel text-daw-text-primary text-center text-xs rounded border border-daw-border focus:border-daw-accent focus:outline-none"
      />
      
      <button
        className="w-5 h-5 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary rounded flex items-center justify-center text-xs"
        onClick={handleIncrement}
      >
        +
      </button>
    </div>
  )
}