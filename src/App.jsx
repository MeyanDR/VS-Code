import React, { useEffect, useState, useMemo } from 'react'
import { AppProvider, useAppState } from './contexts/AppContext'
import Header from './components/Header'
import ControlPanel from './components/ControlPanel'
import Grid from './components/Grid'
import InstructionPanel from './components/InstructionPanel'
import EditModal from './components/EditModal'
import SongStructure from './components/SongStructure'
import SymbolLegend from './components/SymbolLegend'
import NoteType from './components/NoteType'
import NoteConfigurationPanel from './components/NoteConfigurationPanel'
import SortablePanel from './components/SortablePanel'
import ExportModal from './components/ExportModal'
import LayoutControls from './components/LayoutControls'
import MidiImportModal from './components/MidiImportModal'
import { Button } from './components/ui/button'
import { Toaster } from './components/ui/toaster'
import { useToast } from './hooks/useToast'
import { useKeyboard } from './hooks/useKeyboard'
import { useAutoSave } from './hooks/useAutoSave'
import { useMidi } from './hooks/useMidi'
import { useExport } from './hooks/useExport'
import { useInteraction } from './hooks/useInteraction'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

function AppContent() {
  console.log('AppContent: Starting to render...')
  const { state, dispatch } = useAppState()
  console.log('AppContent: Got state from context:', state ? 'State exists' : 'State is null/undefined')
  const [showExportModal, setShowExportModal] = useState(false)
  const [showLayoutControls, setShowLayoutControls] = useState(false)
  const [showMidiImportModal, setShowMidiImportModal] = useState(false)
  const [midiFileToImport, setMidiFileToImport] = useState(null)
  const [isDragOverSymbols, setIsDragOverSymbols] = useState(false)
  const [isDragOverModifiers, setIsDragOverModifiers] = useState(false)
  const [isDragOverTechnique, setIsDragOverTechnique] = useState(false)
  const [isDragOverEffect, setIsDragOverEffect] = useState(false)
  
  // Panel ordering state
  const [panelOrder, setPanelOrder] = useState([
    'pattern-type',
    'add-instrument',
    'song-structure',
    'note-configuration',
    'symbol-modifier',
    'midi-drop'
  ])
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const handlePanelDragEnd = (event) => {
    const { active, over } = event
    
    if (active.id !== over.id) {
      setPanelOrder((items) => {
        const oldIndex = items.indexOf(active.id)
        const newIndex = items.indexOf(over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }
  
  // Initialize all hooks
  useKeyboard(dispatch, state)
  useAutoSave(state)
  const { importMidiFile } = useMidi(dispatch, state)
  const { exportAsImage, exportAsPDF, exportAsJSON } = useExport(state)
  const interaction = useInteraction(dispatch, state)

  useEffect(() => {
    // Apply theme
    const theme = state.themes.presets[state.themes.current]
    if (theme) {
      document.documentElement.style.setProperty('--bg-color', theme.backgroundColor)
      document.documentElement.style.setProperty('--note-color', theme.noteColor)
      document.documentElement.style.setProperty('--grid-color', theme.gridColor)
      document.documentElement.style.setProperty('--font-family', theme.fontFamily)
    }
  }, [state.themes.current, state.themes.presets])

  const handleExport = (format) => {
    if (format === 'custom') {
      setShowExportModal(true)
    } else if (format === 'pdf') {
      exportAsPDF()
    } else if (format === 'json') {
      exportAsJSON()
    } else {
      exportAsImage(format)
    }
  }

  const handleMidiImport = (file) => {
    setMidiFileToImport(file)
    setShowMidiImportModal(true)
  }
  
  const handleMidiImportConfirm = async (pattern, mapping, velocitySettings) => {
    // Apply the pattern to state using the mapping and velocity settings
    const instruments = state.project.sections[state.project.currentSection].instruments
    
    const updatedInstruments = instruments.map(instrument => {
      const instrumentPattern = pattern[instrument.id] || []
      return {
        ...instrument,
        pattern: instrumentPattern
      }
    })
    
    dispatch({ type: 'IMPORT_MIDI_PATTERN', payload: { instruments: updatedInstruments } })
    dispatch({ type: 'SET_MIDI_IMPORTED', payload: true })
    
    // Show success notification
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 px-4 py-2 rounded-lg bg-green-600 text-white font-medium z-50'
    notification.textContent = 'MIDI imported successfully'
    document.body.appendChild(notification)
    setTimeout(() => document.body.removeChild(notification), 2000)
  }

  const handleAddInstrument = () => {
    dispatch({ type: 'ADD_INSTRUMENT' })
  }

  const handleClear = () => {
    if (confirm('Clear all notes in this section? This cannot be undone.')) {
      dispatch({ type: 'CLEAR_ALL' })
    }
  }

  // Pattern editor handlers
  const handlePatternTypeChange = (type) => {
    dispatch({ type: 'SET_PATTERN_TYPE', payload: type })
  }
  
  const handleSymbolChange = (symbol) => {
    dispatch({ type: 'SET_ACTIVE_SYMBOL', payload: symbol })
  }
  
  const handleModifierChange = (modifier) => {
    dispatch({ type: 'SET_ACTIVE_MODIFIER', payload: modifier })
  }
  
  const handleTechniqueChange = (technique) => {
    dispatch({ type: 'SET_ACTIVE_TECHNIQUE', payload: technique })
  }
  
  const handleEffectChange = (effect) => {
    dispatch({ type: 'SET_ACTIVE_EFFECT', payload: effect })
  }
  
  const handleDrop = (e, type) => {
    e.preventDefault()
    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    
    if (type === 'symbol' && data.type === 'symbol') {
      dispatch({ type: 'ADD_AVAILABLE_SYMBOL', payload: { 
        value: data.value, 
        label: data.label, 
        description: data.description 
      }})
    } else if (type === 'articulation' && data.type === 'articulation') {
      dispatch({ type: 'ADD_AVAILABLE_ARTICULATION', payload: { 
        value: data.value, 
        label: data.label, 
        description: data.description 
      }})
    } else if (type === 'technique' && data.type === 'technique') {
      dispatch({ type: 'ADD_AVAILABLE_TECHNIQUE', payload: { 
        value: data.value, 
        label: data.label, 
        description: data.description 
      }})
    } else if (type === 'effect' && data.type === 'effect') {
      dispatch({ type: 'ADD_AVAILABLE_EFFECT', payload: { 
        value: data.value, 
        label: data.label, 
        description: data.description 
      }})
    }
    
    if (type === 'symbol') setIsDragOverSymbols(false)
    if (type === 'articulation') setIsDragOverModifiers(false)
    if (type === 'technique') setIsDragOverTechnique(false)
    if (type === 'effect') setIsDragOverEffect(false)
  }
  
  const handleDragOver = (e) => {
    e.preventDefault()
  }
  
  const handleRemoveSymbol = (symbolValue) => {
    dispatch({ type: 'REMOVE_AVAILABLE_SYMBOL', payload: symbolValue })
  }
  
  const handleRemoveArticulation = (articulationValue) => {
    dispatch({ type: 'REMOVE_AVAILABLE_ARTICULATION', payload: articulationValue })
  }
  
  const handleRemoveTechnique = (techniqueValue) => {
    dispatch({ type: 'REMOVE_AVAILABLE_TECHNIQUE', payload: techniqueValue })
  }
  
  const handleRemoveEffect = (effectValue) => {
    dispatch({ type: 'REMOVE_AVAILABLE_EFFECT', payload: effectValue })
  }

  // Pattern editor data
  const patternTypes = [
    { value: 'loop', symbol: '∞' },
    { value: 'boundary', symbol: '||' }
  ]
  
  const noteTypes = state.ui.availableSymbols
  const articulationModifiers = state.ui.availableArticulationModifiers
  const techniqueModifiers = state.ui.availableTechniqueModifiers
  const effectModifiers = state.ui.availableEffectModifiers
  
  const activePatternType = state.ui.patternType || 'loop'
  const activeSymbol = state.ui.activeSymbol || 'o'
  const activeModifier = state.ui.activeModifier || ''
  const activeTechnique = state.ui.activeTechnique || ''
  const activeEffect = state.ui.activeEffect || ''
  
  // Panel components mapping
  const panelComponents = useMemo(() => ({
    'pattern-type': (
      <div className="bg-daw-bg-secondary rounded-lg p-3 pl-8 border border-daw-border">
        <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">Pattern Type</h3>
        <div className="space-y-1.5">
          {patternTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handlePatternTypeChange(type.value)}
              className={`
                flex items-center gap-2 text-xs w-full text-left p-1 rounded transition-all
                ${activePatternType === type.value 
                  ? 'bg-daw-accent/20 text-daw-accent' 
                  : 'text-daw-text-primary hover:bg-daw-button/50'
                }
              `}
            >
              <span className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${activePatternType === type.value 
                  ? 'border-daw-accent' 
                  : 'border-daw-text-secondary'
                }
              `}>
                {activePatternType === type.value && (
                  <span className="w-2 h-2 bg-daw-accent rounded-full"></span>
                )}
              </span>
              <span className="font-bold w-5 text-center">{type.symbol}</span>
              <span>{type.value === 'loop' ? 'Loop' : 'Boundary'}</span>
            </button>
          ))}
        </div>
      </div>
    ),
    'add-instrument': (
      <div className="bg-daw-bg-secondary rounded-lg p-4 border border-daw-border">
        <div className="space-y-2">
          <Button 
            variant="success" 
            size="default"
            onClick={handleAddInstrument}
            className="w-full flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            Add Instrument
          </Button>
          <Button 
            variant="danger" 
            size="default"
            onClick={handleClear}
            className="w-full flex items-center justify-center gap-2"
          >
            Clear Section
          </Button>
        </div>
      </div>
    ),
    'song-structure': <SongStructure />,
    'note-configuration': (
      <NoteConfigurationPanel
        // Note Type props
        isDragOverSymbols={isDragOverSymbols}
        setIsDragOverSymbols={setIsDragOverSymbols}
        noteTypes={noteTypes}
        activeSymbol={activeSymbol}
        handleSymbolChange={handleSymbolChange}
        handleRemoveSymbol={handleRemoveSymbol}
        
        // Articulations props
        isDragOverModifiers={isDragOverModifiers}
        setIsDragOverModifiers={setIsDragOverModifiers}
        articulationModifiers={articulationModifiers}
        activeModifier={activeModifier}
        handleModifierChange={handleModifierChange}
        handleRemoveArticulation={handleRemoveArticulation}
        
        // Technique props
        isDragOverTechnique={isDragOverTechnique}
        setIsDragOverTechnique={setIsDragOverTechnique}
        techniqueModifiers={techniqueModifiers}
        activeTechnique={activeTechnique}
        handleTechniqueChange={handleTechniqueChange}
        handleRemoveTechnique={handleRemoveTechnique}
        
        // Effect props
        isDragOverEffect={isDragOverEffect}
        setIsDragOverEffect={setIsDragOverEffect}
        effectModifiers={effectModifiers}
        activeEffect={activeEffect}
        handleEffectChange={handleEffectChange}
        handleRemoveEffect={handleRemoveEffect}
        
        // Common props
        handleDrop={handleDrop}
        handleDragOver={handleDragOver}
      />
    ),
    'symbol-modifier': <SymbolLegend />,
    'midi-drop': (
      <div className="bg-daw-bg-secondary rounded-lg p-4 border border-daw-border">
        <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">MIDI Drop</h3>
        <input
          type="file"
          accept=".mid,.midi"
          onChange={(e) => e.target.files?.[0] && handleMidiImport(e.target.files[0])}
          className="w-full text-sm file:mr-3 file:py-1 file:px-3
            file:rounded-md file:border-0
            file:text-sm file:font-medium
            file:bg-daw-button file:text-daw-text-primary
            hover:file:bg-daw-button-hover file:cursor-pointer"
        />
      </div>
    ),
  }), [patternTypes, activePatternType, handlePatternTypeChange, handleAddInstrument, handleClear,
      isDragOverSymbols, setIsDragOverSymbols, handleDrop, handleDragOver,
      handleSymbolChange, handleRemoveSymbol, noteTypes, activeSymbol,
      isDragOverModifiers, setIsDragOverModifiers, articulationModifiers,
      activeModifier, handleModifierChange, handleRemoveArticulation,
      isDragOverTechnique, setIsDragOverTechnique, techniqueModifiers,
      activeTechnique, handleTechniqueChange, handleRemoveTechnique,
      isDragOverEffect, setIsDragOverEffect, effectModifiers,
      activeEffect, handleEffectChange, handleRemoveEffect, handleMidiImport])

  return (
    <div className="min-h-screen bg-daw-bg-primary text-daw-text-primary">
      <div className="flex flex-col h-screen">
        {/* Header Section */}
        <Header />
        
        {/* Control Bar */}
        <div className="bg-daw-bg-secondary border-b border-daw-border shadow-panel">
          <ControlPanel 
            onExport={handleExport}
            onMidiImport={handleMidiImport}
            onLayoutClick={() => setShowLayoutControls(!showLayoutControls)}
          />
          {showLayoutControls && <LayoutControls />}
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-80 bg-daw-bg-panel border-r border-daw-border flex flex-col p-4 overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handlePanelDragEnd}
            >
              <SortableContext
                items={panelOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {panelOrder.map((panelId) => (
                    <SortablePanel key={panelId} id={panelId}>
                      {panelComponents[panelId]}
                    </SortablePanel>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          
          {/* Main Grid Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-6 bg-daw-bg-primary">
              <Grid interaction={interaction} />
            </div>
            
            {/* Bottom Instructions Panel */}
            <div className="bg-daw-bg-panel border-t border-daw-border">
              <InstructionPanel />
            </div>
          </div>
        </div>
        
        {/* Modals */}
        {state.ui.editingStep && <EditModal />}
        
        {showExportModal && (
          <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
        )}
        
        {showMidiImportModal && (
          <MidiImportModal 
            isOpen={showMidiImportModal} 
            onClose={() => {
              setShowMidiImportModal(false)
              setMidiFileToImport(null)
            }}
            file={midiFileToImport}
            onImport={handleMidiImportConfirm}
          />
        )}
        <Toaster />
      </div>
    </div>
  )
}

function App() {
  console.log('App: Main App component rendering...')
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
