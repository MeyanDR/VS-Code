import React, { useEffect, useState } from 'react'
import { AppProvider, useAppState } from './contexts/AppContext'
import Header from './components/Header'
import ControlPanel from './components/ControlPanel'
import Grid from './components/Grid'
import InstructionPanel from './components/InstructionPanel'
import EditModal from './components/EditModal'
import PatternEditor from './components/PatternEditor'
import SongStructure from './components/SongStructure'
import SymbolLegend from './components/SymbolLegend'
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

function AppContent() {
  const { state, dispatch } = useAppState()
  const [showExportModal, setShowExportModal] = useState(false)
  const [showLayoutControls, setShowLayoutControls] = useState(false)
  const [showMidiImportModal, setShowMidiImportModal] = useState(false)
  const [midiFileToImport, setMidiFileToImport] = useState(null)
  
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
          <div className="w-80 bg-daw-bg-panel border-r border-daw-border flex flex-col p-4 space-y-4 overflow-y-auto">
            <SongStructure />
            
            {/* Add Instrument Button */}
            <div className="bg-daw-bg-secondary rounded-lg p-4 border border-daw-border">
              <Button 
                variant="success" 
                size="default"
                onClick={handleAddInstrument}
                className="w-full flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span>
                Add Instrument
              </Button>
            </div>
            
            <SymbolLegend />
            <PatternEditor />
            
            {/* MIDI Import Section */}
            <div className="bg-daw-bg-secondary rounded-lg p-4 border border-daw-border">
              <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">MIDI Import</h3>
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
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App