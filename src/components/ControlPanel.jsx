import React, { useState, useRef } from 'react'
import { useAppState } from '../contexts/AppContext'
import { saveAs } from 'file-saver'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { parseStepKey } from '../lib/selection'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'

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
  
  const handleInvertSelection = () => {
    const section = state.project.sections[state.project.currentSection]
    if (!section) return
    
    const beatSubdivisions = section.grid.beatSubdivisions || 
      Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions)
    
    // Get all possible positions
    const allPositions = new Set()
    let totalPosition = 0
    for (let beatIdx = 0; beatIdx < section.grid.bars * section.grid.beats; beatIdx++) {
      const subdivisions = beatSubdivisions[beatIdx] || section.grid.subdivisions
      for (let subIdx = 0; subIdx < subdivisions; subIdx++) {
        section.instruments.forEach(instrument => {
          allPositions.add(`${instrument.id}-${totalPosition + subIdx}`)
        })
      }
      totalPosition += subdivisions
    }
    
    // Get currently selected positions
    const currentSelection = new Set(state.ui.selectedSteps)
    
    // Invert selection - only include positions that have notes
    const invertedSelection = []
    allPositions.forEach(pos => {
      const { instrumentId, position } = parseStepKey(pos)
      const instrument = section.instruments.find(i => i.id === instrumentId)
      if (instrument) {
        const hasNote = instrument.pattern.some(note => {
          if (note.beatIndex !== undefined && note.subdivision !== undefined) {
            let notePosition = 0
            for (let i = 0; i < note.beatIndex; i++) {
              notePosition += beatSubdivisions[i] || section.grid.subdivisions
            }
            notePosition += note.subdivision
            return notePosition === parseInt(position)
          } else {
            return note.position === parseInt(position)
          }
        })
        
        if (hasNote && !currentSelection.has(pos)) {
          invertedSelection.push(pos)
        }
      }
    })
    
    dispatch({ type: 'SET_SELECTION', payload: invertedSelection })
    setShowFunctionsMenu(false)
  }
  
  const handleDuplicatePattern = () => {
    const section = state.project.sections[state.project.currentSection]
    if (!section) return
    
    // If there's a selection, duplicate selected notes
    if (state.ui.selectedSteps && state.ui.selectedSteps.size > 0) {
      const beatSubdivisions = section.grid.beatSubdivisions || 
        Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions)
      
      // Calculate total pattern length
      let totalLength = 0
      beatSubdivisions.forEach(subdivs => {
        totalLength += subdivs
      })
      
      // Group selected notes by instrument
      const selectedNotes = {}
      Array.from(state.ui.selectedSteps).forEach(sel => {
        const { instrumentId, position } = parseStepKey(sel)
        if (!selectedNotes[instrumentId]) {
          selectedNotes[instrumentId] = []
        }
        selectedNotes[instrumentId].push(parseInt(position))
      })
      
      // Find the rightmost selected position
      let maxPosition = 0
      Object.values(selectedNotes).forEach(positions => {
        positions.forEach(pos => {
          if (pos > maxPosition) maxPosition = pos
        })
      })
      
      // Calculate offset for duplication (place after selection)
      const offset = maxPosition + 1
      
      // Duplicate notes for each instrument
      Object.entries(selectedNotes).forEach(([instrumentId, positions]) => {
        const instrument = section.instruments.find(i => i.id === instrumentId)
        if (instrument) {
          positions.forEach(position => {
            const note = instrument.pattern.find(n => {
              if (n.beatIndex !== undefined && n.subdivision !== undefined) {
                let notePos = 0
                for (let i = 0; i < n.beatIndex; i++) {
                  notePos += beatSubdivisions[i] || section.grid.subdivisions
                }
                notePos += n.subdivision
                return notePos === position
              }
              return n.position === position
            })
            
            if (note && position + offset < totalLength) {
              // Calculate beat and subdivision for new position
              let newPos = position + offset
              let beatIndex = 0
              let accumPos = 0
              
              for (let i = 0; i < beatSubdivisions.length; i++) {
                if (accumPos + beatSubdivisions[i] > newPos) {
                  beatIndex = i
                  break
                }
                accumPos += beatSubdivisions[i]
              }
              
              const subdivision = newPos - accumPos
              
              dispatch({
                type: 'ADD_NOTE',
                payload: {
                  instrumentId,
                  beatIndex,
                  subdivision,
                  symbol: note.symbol,
                  modifier: note.modifier
                }
              })
            }
          })
        }
      })
    } else {
      // Duplicate entire pattern for all instruments
      section.instruments.forEach(instrument => {
        const patternCopy = [...instrument.pattern]
        patternCopy.forEach(note => {
          // Calculate the beat index for duplication
          const newBeatIndex = note.beatIndex !== undefined 
            ? note.beatIndex + (section.grid.bars * section.grid.beats)
            : null
          
          // Check if the new beat index would exceed double the pattern length
          // This would require expanding the grid, which we don't support yet
          if (newBeatIndex !== null && newBeatIndex < section.grid.bars * section.grid.beats * 2) {
            // For now, skip notes that would exceed the current grid
            // TODO: Consider expanding grid or wrapping around
            dispatch({
              type: 'ADD_NOTE',
              payload: {
                instrumentId: instrument.id,
                beatIndex: note.beatIndex,
                subdivision: note.subdivision,
                symbol: note.symbol,
                modifier: note.modifier
              }
            })
          }
        })
      })
    }
    
    setShowFunctionsMenu(false)
  }
  
  const handleMirrorPattern = () => {
    const section = state.project.sections[state.project.currentSection]
    if (!section) return
    
    const beatSubdivisions = section.grid.beatSubdivisions || 
      Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions)
    
    // Calculate total pattern length
    let totalLength = 0
    beatSubdivisions.forEach(subdivs => {
      totalLength += subdivs
    })
    
    if (state.ui.selectedSteps && state.ui.selectedSteps.size > 0) {
      // Mirror selected notes
      const notesToMirror = []
      
      Array.from(state.ui.selectedSteps).forEach(sel => {
        const { instrumentId, position } = parseStepKey(sel)
        const instrument = section.instruments.find(i => i.id === instrumentId)
        if (instrument) {
          const note = instrument.pattern.find(n => {
            if (n.beatIndex !== undefined && n.subdivision !== undefined) {
              let notePos = 0
              for (let i = 0; i < n.beatIndex; i++) {
                notePos += beatSubdivisions[i] || section.grid.subdivisions
              }
              notePos += n.subdivision
              return notePos === parseInt(position)
            }
            return n.position === parseInt(position)
          })
          
          if (note) {
            notesToMirror.push({ instrumentId, position: parseInt(position), note })
          }
        }
      })
      
      // Remove original notes and add mirrored ones
      notesToMirror.forEach(({ instrumentId, position, note }) => {
        // Remove original
        dispatch({
          type: 'REMOVE_NOTE',
          payload: {
            instrumentId,
            position,
            beatIndex: note.beatIndex,
            subdivision: note.subdivision
          }
        })
        
        // Add mirrored
        const mirroredPosition = totalLength - 1 - position
        let beatIndex = 0
        let accumPos = 0
        
        for (let i = 0; i < beatSubdivisions.length; i++) {
          if (accumPos + beatSubdivisions[i] > mirroredPosition) {
            beatIndex = i
            break
          }
          accumPos += beatSubdivisions[i]
        }
        
        const subdivision = mirroredPosition - accumPos
        
        dispatch({
          type: 'ADD_NOTE',
          payload: {
            instrumentId,
            beatIndex,
            subdivision,
            symbol: note.symbol,
            modifier: note.modifier
          }
        })
      })
    } else {
      // Mirror entire pattern for all instruments
      section.instruments.forEach(instrument => {
        // Build complete mirrored pattern first
        const mirroredNotes = []
        const notesToRemove = []
        
        instrument.pattern.forEach(note => {
          let position
          if (note.beatIndex !== undefined && note.subdivision !== undefined) {
            position = 0
            for (let i = 0; i < note.beatIndex; i++) {
              position += beatSubdivisions[i] || section.grid.subdivisions
            }
            position += note.subdivision
          } else {
            position = note.position
          }
          
          const mirroredPosition = totalLength - 1 - position
          let beatIndex = 0
          let accumPos = 0
          
          for (let i = 0; i < beatSubdivisions.length; i++) {
            if (accumPos + beatSubdivisions[i] > mirroredPosition) {
              beatIndex = i
              break
            }
            accumPos += beatSubdivisions[i]
          }
          
          const subdivision = mirroredPosition - accumPos
          
          // Store notes to remove
          notesToRemove.push({
            instrumentId: instrument.id,
            position: note.position,
            beatIndex: note.beatIndex,
            subdivision: note.subdivision
          })
          
          // Store mirrored notes to add
          mirroredNotes.push({
            instrumentId: instrument.id,
            beatIndex,
            subdivision,
            symbol: note.symbol,
            modifier: note.modifier
          })
        })
        
        // Batch remove and add operations
        notesToRemove.forEach(noteData => {
          dispatch({
            type: 'REMOVE_NOTE',
            payload: noteData
          })
        })
        
        mirroredNotes.forEach(noteData => {
          dispatch({
            type: 'ADD_NOTE',
            payload: noteData
          })
        })
      })
    }
    
    setShowFunctionsMenu(false)
  }

  const handleSelectAll = () => {
    // Select all notes in current section
    const section = state.project.sections[state.project.currentSection]
    if (!section) return
    
    const allSteps = []
    const beatSubdivisions = section.grid.beatSubdivisions || 
      Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions)
    
    section.instruments.forEach(instrument => {
      instrument.pattern.forEach(note => {
        let position
        // Support both old and new format
        if (note.beatIndex !== undefined && note.subdivision !== undefined) {
          // Calculate position from beat and subdivision
          position = 0
          for (let i = 0; i < note.beatIndex; i++) {
            position += beatSubdivisions[i] || section.grid.subdivisions
          }
          position += note.subdivision
        } else {
          position = note.position
        }
        allSteps.push(`${instrument.id}-${position}`)
      })
    })
    
    dispatch({ type: 'SET_SELECTION', payload: allSteps })
    setShowFunctionsMenu(false)
  }

  const handleNew = () => {
    if (confirm('Create new project? Unsaved changes will be lost.')) {
      dispatch({ type: 'CLEAR_ALL' })
    }
  }

  // Helper function to extract note data from selected steps
  const getNotesFromSelection = () => {
    const section = state.project.sections[state.project.currentSection]
    if (!section || !state.ui.selectedSteps) return []
    
    const notes = []
    const beatSubdivisions = section.grid.beatSubdivisions || 
      Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions || 4)
    
    state.ui.selectedSteps.forEach(stepKey => {
      const { instrumentId, position } = parseStepKey(stepKey)
      
      const instrument = section.instruments.find(i => i.id === instrumentId)
      if (instrument) {
        const note = instrument.pattern.find(n => n.position === position)
        if (note) {
          // Ensure note has beatIndex and subdivision
          let beatIndex = note.beatIndex
          let subdivision = note.subdivision
          
          // Calculate beatIndex and subdivision if not present
          if (beatIndex === undefined || subdivision === undefined) {
            let remainingPosition = position
            beatIndex = 0
            
            // Find which beat this position falls into
            while (beatIndex < beatSubdivisions.length && remainingPosition >= beatSubdivisions[beatIndex]) {
              remainingPosition -= beatSubdivisions[beatIndex]
              beatIndex++
            }
            
            subdivision = remainingPosition
          }
          
          notes.push({
            ...note,
            beatIndex: beatIndex,
            subdivision: subdivision,
            instrumentId: instrumentId  // Add instrument ID to note data
          })
        }
      }
    })
    
    return notes
  }
  
  const handleUndo = () => dispatch({ type: 'UNDO' })
  const handleRedo = () => dispatch({ type: 'REDO' })
  const handleCut = () => {
    if (state.ui.selectedSteps && state.ui.selectedSteps.size > 0) {
      // Store selectedSteps BEFORE any dispatch to avoid race condition
      const selectedStepsArray = Array.from(state.ui.selectedSteps)
      const noteData = getNotesFromSelection()
      
      // Single dispatch with unified payload for both reducers
      dispatch({ 
        type: 'CUT_SELECTION',
        payload: { 
          notes: noteData,
          selectedSteps: selectedStepsArray 
        }
      })
    }
  }
  const handleCopy = () => {
    if (state.ui.selectedSteps && state.ui.selectedSteps.size > 0) {
      const noteData = getNotesFromSelection()
      dispatch({ 
        type: 'COPY_SELECTION',
        payload: { notes: noteData }
      })
    }
  }
  const handlePaste = () => {
    if (state.ui.clipboard) {
      dispatch({ 
        type: 'PASTE_SELECTION',
        payload: { 
          clipboard: state.ui.clipboard,
          targetBeat: 0,
          targetSubdivision: 0
        }
      })
    }
  }

  const handleSave = () => {
    try {
      // Convert Sets to Arrays for serialization
      const serializable = {
        ...state,
        ui: {
          ...state.ui,
          selectedSteps: state.ui?.selectedSteps ? Array.from(state.ui.selectedSteps) : []
        }
      }
      localStorage.setItem('tromklub_autosave', JSON.stringify(serializable))
      // Trigger save event for auto-save hook
      window.dispatchEvent(new CustomEvent('save-project'))
      alert('Project saved successfully!')
    } catch (error) {
      console.error('Failed to save project:', error)
      alert('Failed to save project. Please try again.')
    }
  }
  
  const handleLoad = () => {
    const saved = localStorage.getItem('tromklub_autosave')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Convert selectedSteps array back to Set if present
        if (parsed.ui && Array.isArray(parsed.ui.selectedSteps)) {
          parsed.ui.selectedSteps = new Set(parsed.ui.selectedSteps)
        }
        // Load the full state
        dispatch({ type: 'LOAD_FULL_STATE', payload: parsed })
      } catch (error) {
        console.error('Failed to load project:', error)
        // Clear corrupted data
        localStorage.removeItem('tromklub_autosave')
        alert('Failed to load saved data. The data may be corrupted.')
      }
    } else {
      alert('No saved data found.')
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

  const handleNewProject = () => {
    if (confirm('Start a new project? Current work will be lost if not saved.')) {
      // Clear localStorage
      localStorage.removeItem('tromklub_autosave')
      // Reload the page to get fresh defaults
      window.location.reload()
    }
  }

  const handleUpdateGrid = () => {
    const totalBeats = gridValues.bars * gridValues.beats
    const beatSubdivisions = Array(totalBeats).fill(gridValues.subdivisions)
    dispatch({
      type: 'UPDATE_GRID',
      payload: { ...gridValues, beatSubdivisions }
    })
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="default">
                Functions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleClearSelection}>
                Clear Selection
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSelectAll}>
                Select All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleInvertSelection}>
                Invert Selection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDuplicatePattern}>
                Duplicate Pattern
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMirrorPattern}>
                Mirror Pattern
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" onClick={handleNew}>New</Button>
          <Button size="sm" onClick={handleUndo}>Undo</Button>
          <Button size="sm" onClick={handleRedo}>Redo</Button>
          <Button size="sm" onClick={handleCut}>Cut</Button>
          <Button size="sm" onClick={handleCopy}>Copy</Button>
          <Button size="sm" onClick={handlePaste}>Paste</Button>
          <Button size="sm" onClick={handleSave}>Save</Button>
          <Button size="sm" onClick={handleLoad}>Load</Button>
          <Button size="sm" onClick={handleDownload}>Download</Button>
          
          <Button size="sm" asChild>
            <label className="cursor-pointer">
              Upload
              <input
                ref={uploadInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleUpload}
              />
            </label>
          </Button>
          
          <Button size="sm" variant="secondary" onClick={handleNewProject}>New Project</Button>
          <Button size="sm" variant="danger" onClick={handleClear}>Clear</Button>
          <Button size="sm" variant="primary" onClick={() => onExport('custom')}>Export</Button>
          
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
          
          <Button size="sm" variant="primary" onClick={handleUpdateGrid}>
            Update Grid
          </Button>
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
      <Label className="text-xs">{label}:</Label>
      
      <Button
        size="icon"
        variant="ghost"
        className="h-5 w-5"
        onClick={handleDecrement}
      >
        <ChevronDownIcon className="h-3 w-3" />
      </Button>
      
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        min="1"
        max="32"
        className="w-10 h-6 text-center text-xs px-1"
      />
      
      <Button
        size="icon"
        variant="ghost"
        className="h-5 w-5"
        onClick={handleIncrement}
      >
        <ChevronUpIcon className="h-3 w-3" />
      </Button>
    </div>
  )
}
