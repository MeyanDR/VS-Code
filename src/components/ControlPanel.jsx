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
    <div className="space-y-3">
      {/* Main Control Bar */}
      <div className="bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg border border-slate-700">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Functions dropdown */}
          <div className="relative">
            <button
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded transition-colors text-sm"
              onClick={() => setShowFunctionsMenu(!showFunctionsMenu)}
            >
              🔧 Functions
            </button>
            {showFunctionsMenu && (
              <div className="absolute top-full left-0 mt-1 bg-slate-700 rounded shadow-lg z-50 min-w-[200px]">
                <button
                  className="w-full px-4 py-2 text-left text-white hover:bg-slate-600 transition-colors"
                  onClick={handleClearSelection}
                >
                  Clear Selection
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-white hover:bg-slate-600 transition-colors"
                  onClick={handleSelectAll}
                >
                  Select All
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-white hover:bg-slate-600 transition-colors"
                  onClick={() => {
                    console.log('TODO: Implement invert selection')
                    setShowFunctionsMenu(false)
                  }}
                >
                  Invert Selection
                </button>
                <div className="border-t border-slate-600" />
                <button
                  className="w-full px-4 py-2 text-left text-white hover:bg-slate-600 transition-colors"
                  onClick={() => {
                    console.log('TODO: Implement duplicate pattern')
                    setShowFunctionsMenu(false)
                  }}
                >
                  Duplicate Pattern
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-white hover:bg-slate-600 transition-colors"
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
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded transition-colors text-sm"
            onClick={handleNew}
          >
            ➕ New
          </button>
          
          <button
            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded transition-colors text-sm"
            onClick={handleUndo}
          >
            ↩ Undo
          </button>
          
          <button
            className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded transition-colors text-sm"
            onClick={handleRedo}
          >
            ↪ Redo
          </button>
          
          <button
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors text-sm"
            onClick={handleCut}
          >
            ✂ Cut
          </button>
          
          <button
            className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded transition-colors text-sm"
            onClick={handleCopy}
          >
            📋 Copy
          </button>
          
          <button
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors text-sm"
            onClick={handlePaste}
          >
            📌 Paste
          </button>
          
          <button
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded transition-colors text-sm"
            onClick={handleSave}
          >
            💾 Save
          </button>
          
          <button
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded transition-colors text-sm"
            onClick={handleLoad}
          >
            📂 Load
          </button>
          
          <button
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded transition-colors text-sm"
            onClick={handleDownload}
          >
            ⬇ Download
          </button>
          
          <label className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded cursor-pointer transition-colors text-sm">
            ⬆ Upload
            <input
              ref={uploadInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
          
          <button
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors text-sm"
            onClick={handleClear}
          >
            🗑 Clear
          </button>
          
          <button
            className="px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded transition-colors text-sm"
            onClick={() => onExport('custom')}
          >
            📤 Export
          </button>
        </div>
      </div>

      {/* Grid Configuration Bar */}
      <div className="bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg border border-slate-700">
        <div className="flex items-center gap-4">
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
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded transition-colors text-sm"
            onClick={handleUpdateGrid}
          >
            Update Grid
          </button>
          
          <button
            className="ml-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full transition-colors text-lg w-10 h-10 flex items-center justify-center"
            title="Add new section"
            onClick={() => console.log('TODO: Add new section')}
          >
            +
          </button>
        </div>
      </div>

      {/* Section Information Panel */}
      <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={section ? section.name : 'Intro'}
              onChange={handleSectionNameChange}
              className="bg-transparent text-xl font-bold text-cyan-400 focus:outline-none focus:bg-slate-700 px-2 py-1 rounded"
            />
            <span className="text-gray-400 text-sm">
              {section 
                ? `${section.grid.bars} bars × ${section.grid.beats} beats × ${section.grid.subdivisions} subdivision`
                : '4 bars × 4 beats × 4 subdivision'}
            </span>
          </div>
        </div>
        
        <label className="text-cyan-400 text-sm font-semibold block mb-2">
          Section Notes:
        </label>
        
        <textarea
          className="w-full bg-slate-700/50 text-gray-300 p-3 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none resize-none"
          placeholder="Add notes about this section..."
          rows={2}
          value={section?.notes || ''}
          onChange={handleSectionNotesChange}
        />
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
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-sm">{label}:</span>
      
      <button
        className="w-6 h-6 bg-slate-600 hover:bg-slate-500 text-white rounded flex items-center justify-center text-sm"
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
        className="w-12 bg-slate-700 text-white text-center rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
      />
      
      <button
        className="w-6 h-6 bg-slate-600 hover:bg-slate-500 text-white rounded flex items-center justify-center text-sm"
        onClick={handleIncrement}
      >
        +
      </button>
    </div>
  )
}