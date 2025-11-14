import React, { useState, useRef } from 'react'
import { useAppState } from '../contexts/AppContext'
import { saveAs } from 'file-saver'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Combobox } from './ui/combobox'
import { ChevronUpIcon, ChevronDownIcon } from '@radix-ui/react-icons'
import { parseStepKey, makeStepKey } from '../lib/selection'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { SaveProjectModal } from './SaveProjectModal'
import { LoadProjectModal } from './LoadProjectModal'
import { projectManager } from '../services/ProjectManager'

export default function ControlPanel({ onExport, onMidiImport, onLayoutClick }) {
  const { state, dispatch } = useAppState()
  const [showFunctionsMenu, setShowFunctionsMenu] = useState(false)
  const [gridValues, setGridValues] = useState(() => {
    const section = state.project.sections[state.project.currentSection]
    return section ? { ...section.grid } : { bars: 4, beats: 4, subdivisions: 4 }
  })
  const uploadInputRef = useRef(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState(null)
  const [currentProjectName, setCurrentProjectName] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)

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

  const getPatternFromSelection = () => {
    const section = state.project.sections[state.project.currentSection]
    if (!section || !state.ui.selectedSteps || state.ui.selectedSteps.size === 0) return null
    
    // Parse all selected cells to find bounds
    const selectedCells = []
    let minBeat = Infinity, maxBeat = -Infinity
    let minSubdiv = Infinity, maxSubdiv = -Infinity
    const instrumentsInvolved = new Set()
    
    state.ui.selectedSteps.forEach(stepKey => {
      const parsed = parseStepKey(stepKey)
      selectedCells.push(parsed)
      instrumentsInvolved.add(parsed.instrumentId)
      
      if (parsed.beatIndex < minBeat) minBeat = parsed.beatIndex
      if (parsed.beatIndex > maxBeat) maxBeat = parsed.beatIndex
      if (parsed.beatIndex === minBeat && parsed.subdivision < minSubdiv) minSubdiv = parsed.subdivision
      if (parsed.beatIndex === maxBeat && parsed.subdivision > maxSubdiv) maxSubdiv = parsed.subdivision
    })
    
    // For multi-beat selections, we need to consider full beat ranges
    const beatSubdivisions = section.grid.beatSubdivisions || 
      Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions || 4)
    
    // Build complete pattern including empty cells
    const pattern = []
    
    instrumentsInvolved.forEach(instrumentId => {
      const instrument = section.instruments.find(i => i.id === instrumentId)
      if (!instrument) return
      
      for (let beat = minBeat; beat <= maxBeat; beat++) {
        const subdivCount = beatSubdivisions[beat] || section.grid.subdivisions
        const startSubdiv = (beat === minBeat) ? minSubdiv : 0
        const endSubdiv = (beat === maxBeat) ? maxSubdiv : subdivCount - 1
        
        for (let subdiv = startSubdiv; subdiv <= endSubdiv; subdiv++) {
          const cellKey = makeStepKey(instrumentId, beat, subdiv)
          
          // Check if this cell is in selection
          if (state.ui.selectedSteps.has(cellKey)) {
            // Find if there's a note at this position
            const note = instrument.pattern.find(n => 
              n.beatIndex === beat && n.subdivision === subdiv
            )
            
            pattern.push({
              instrumentId,
              beatOffset: beat - minBeat,
              subdivOffset: subdiv - minSubdiv,
              hasNote: !!note,
              note: note ? { 
                symbol: note.symbol, 
                modifier: note.modifier 
              } : null
            })
          }
        }
      }
    })
    
    console.log('[Copy] Complete pattern captured:', {
      bounds: { minBeat, maxBeat, minSubdiv, maxSubdiv },
      cellCount: pattern.length,
      noteCount: pattern.filter(p => p.hasNote).length
    })
    
    return {
      bounds: { minBeat, maxBeat, minSubdiv, maxSubdiv },
      pattern
    }
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
      dispatch({ type: 'NEW_PROJECT' })
      setCurrentProjectId(null)
      setCurrentProjectName(null)
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
  
  // Check if undo/redo are available
  const canUndo = state.history.past.length > 0
  const canRedo = state.history.future.length > 0

  const handleUndo = () => dispatch({ type: 'UNDO' })
  const handleRedo = () => dispatch({ type: 'REDO' })
  const handleCut = () => {
    if (state.ui.selectedSteps && state.ui.selectedSteps.size > 0) {
      // Store selectedSteps BEFORE any dispatch to avoid race condition
      const selectedStepsArray = Array.from(state.ui.selectedSteps)
      const patternData = getPatternFromSelection()
      
      if (patternData) {
        // Single dispatch with unified payload for both reducers
        dispatch({ 
          type: 'CUT_SELECTION',
          payload: { 
            pattern: patternData,
            selectedSteps: selectedStepsArray 
          }
        })
        console.log('[Cut] Cut pattern with', patternData.pattern.length, 'cells')
      }
    }
  }
  const handleCopy = () => {
    if (state.ui.selectedSteps && state.ui.selectedSteps.size > 0) {
      const patternData = getPatternFromSelection()
      if (patternData) {
        dispatch({ 
          type: 'COPY_SELECTION',
          payload: { pattern: patternData }
        })
        console.log('[Copy] Copied pattern with', patternData.pattern.length, 'cells')
      }
    }
  }
  const handlePaste = () => {
    if (state.ui.clipboard) {
      // Get target position from first selected cell, or default to 0,0
      let targetBeat = 0
      let targetSubdivision = 0
      
      if (state.ui.selectedSteps && state.ui.selectedSteps.size > 0) {
        const firstSelected = Array.from(state.ui.selectedSteps)[0]
        const parsed = parseStepKey(firstSelected)
        targetBeat = parsed.beatIndex || 0
        targetSubdivision = parsed.subdivision || 0
        console.log('[Paste] Using selected cell as target:', { targetBeat, targetSubdivision })
      } else {
        console.log('[Paste] No selection, pasting at 0,0')
      }
      
      dispatch({ 
        type: 'PASTE_SELECTION',
        payload: { 
          clipboard: state.ui.clipboard,
          targetBeat,
          targetSubdivision
        }
      })
    }
  }

  const handleSave = () => {
    setShowSaveModal(true)
  }
  
  const handleSaveSuccess = (projectId, projectName) => {
    setCurrentProjectId(projectId)
    setCurrentProjectName(projectName)
  }
  
  const handleLoad = () => {
    setShowLoadModal(true)
  }
  
  const handleLoadProject = (projectData, metadata) => {
    try {
      // Convert selectedSteps array back to Set if present
      if (projectData.ui && Array.isArray(projectData.ui.selectedSteps)) {
        projectData.ui.selectedSteps = new Set(projectData.ui.selectedSteps)
      }
      // Load the full state
      dispatch({ type: 'LOAD_FULL_STATE', payload: projectData })
      
      // Update current project info
      setCurrentProjectId(metadata.id)
      setCurrentProjectName(metadata.name)
    } catch (error) {
      console.error('Failed to load project:', error)
      alert('Failed to load project. The data may be corrupted.')
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
      await processFile(file)
    }
  }

  const processFile = async (file) => {
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

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev + 1)
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasJsonFile = Array.from(e.dataTransfer.items).some(item => {
        return item.kind === 'file' && (item.type === 'application/json' || item.type === '')
      })
      if (hasJsonFile) {
        setIsDragging(true)
      }
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => {
      const newCounter = prev - 1
      if (newCounter === 0) {
        setIsDragging(false)
      }
      return newCounter
    })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setDragCounter(0)

    const files = Array.from(e.dataTransfer.files)
    const jsonFile = files.find(file => 
      file.type === 'application/json' || 
      file.name.endsWith('.json')
    )

    if (jsonFile) {
      await processFile(jsonFile)
    } else if (files.length > 0) {
      alert('Please drop a valid JSON file')
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
      <div className="px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-fit">
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
          <Button size="sm" onClick={handleUndo} disabled={!canUndo}>Undo</Button>
          <Button size="sm" onClick={handleRedo} disabled={!canRedo}>Redo</Button>
          <Button size="sm" onClick={handleCut}>Cut</Button>
          <Button size="sm" onClick={handleCopy}>Copy</Button>
          <Button size="sm" onClick={handlePaste}>Paste</Button>
          <Button size="sm" onClick={handleSave}>Save</Button>
          <Button size="sm" onClick={handleLoad}>Load</Button>
          <Button size="sm" onClick={handleDownload}>Download</Button>
          
          <Button 
            size="sm" 
            asChild
            className={isDragging ? "ring-2 ring-blue-500 ring-offset-2" : ""}
          >
            <label 
              className="cursor-pointer relative"
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {isDragging ? "Drop JSON file" : "Upload"}
              <input
                ref={uploadInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleUpload}
              />
            </label>
          </Button>
          
          <div className="border-l border-daw-border h-6 mx-2" />
          
          <Button size="sm" variant="primary" onClick={() => onExport('custom')}>
            Export PDF/JPG
          </Button>
          
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

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Grid Scale</label>
            <Combobox
              value={Math.round((state.ui?.gridScale || 1.0) * 100)}
              onChange={(value) => dispatch({ type: 'SET_GRID_SCALE', payload: value / 100 })}
              options={[50, 75, 100, 125, 150, 200]}
              min={10}
              max={500}
              suffix="%"
            />
          </div>
          </div>
        </div>
      </div>

      <SaveProjectModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        currentState={state}
        existingProject={currentProjectId ? { id: currentProjectId, name: currentProjectName } : null}
        onSaveSuccess={handleSaveSuccess}
      />
      
      <LoadProjectModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onLoadProject={handleLoadProject}
        currentProjectId={currentProjectId}
      />

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
    <div className="flex flex-col items-center gap-1">
      <Label className="text-xs">{label}</Label>
      
      <div className="relative">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          min="1"
          max="32"
          className="w-12 h-6 text-center text-xs px-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
        />
        
        <div className="absolute right-1 top-0 h-full flex flex-col justify-center">
          <Button
            size="xs"
            variant="ghost"
            className="h-2.5 w-4 p-0 hover:bg-daw-button-hover"
            onClick={handleIncrement}
          >
            <ChevronUpIcon className="h-3 w-3 text-daw-text-secondary" />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            className="h-2.5 w-4 p-0 hover:bg-daw-button-hover"
            onClick={handleDecrement}
          >
            <ChevronDownIcon className="h-3 w-3 text-daw-text-secondary" />
          </Button>
        </div>
      </div>
    </div>
  )
}
