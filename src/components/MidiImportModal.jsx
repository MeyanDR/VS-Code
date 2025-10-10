import React, { useState, useEffect } from 'react'
import * as Tone from 'tone'

const DEFAULT_MIDI_MAPPING = {
  36: { instrument: 'kick', symbol: 'x', name: 'Bass Drum' },
  35: { instrument: 'kick', symbol: 'x', name: 'Acoustic Bass Drum' },
  38: { instrument: 'snare', symbol: 'o', name: 'Acoustic Snare' },
  40: { instrument: 'snare', symbol: 'o', name: 'Electric Snare' },
  42: { instrument: 'hihat', symbol: '-', name: 'Closed Hi-Hat' },
  44: { instrument: 'hihat', symbol: '•', name: 'Pedal Hi-Hat' },
  46: { instrument: 'hihat', symbol: 'o', name: 'Open Hi-Hat' },
  49: { instrument: 'crash', symbol: 'x', name: 'Crash Cymbal 1' },
  57: { instrument: 'crash', symbol: 'x', name: 'Crash Cymbal 2' },
  51: { instrument: 'ride', symbol: '/', name: 'Ride Cymbal 1' },
  59: { instrument: 'ride', symbol: '/', name: 'Ride Cymbal 2' }
}

const AVAILABLE_SYMBOLS = ['x', 'o', '/', '-', '•', 'X', 'O', '@', '#', '*']

const INSTRUMENT_TYPES = [
  'kick', 'snare', 'hihat', 'crash', 'ride', 'tom', 'floor_tom', 'cowbell', 'clap', 'rimshot'
]

const MidiImportModal = ({ isOpen, onClose, file, onImport }) => {
  const [midiData, setMidiData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [noteMapping, setNoteMapping] = useState({})
  const [notesFound, setNotesFound] = useState([])
  const [velocitySettings, setVelocitySettings] = useState({
    ghost: 50,
    normal: 90,
    accent: 115
  })
  const [previewPattern, setPreviewPattern] = useState(null)
  
  useEffect(() => {
    if (!file || !isOpen) return
    
    const loadMidiFile = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const url = URL.createObjectURL(file)
        const midi = await Tone.Midi.fromUrl(url)
        URL.revokeObjectURL(url)
        
        setMidiData(midi)
        analyzeMidiFile(midi)
      } catch (err) {
        setError('Failed to load MIDI file: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadMidiFile()
  }, [file, isOpen])
  
  const analyzeMidiFile = (midi) => {
    const noteStats = {}
    let totalNotes = 0
    
    midi.tracks.forEach(track => {
      track.notes.forEach(note => {
        const midiNote = note.midi
        if (!noteStats[midiNote]) {
          noteStats[midiNote] = {
            count: 0,
            velocities: [],
            midiNote,
            name: note.name || `Note ${midiNote}`,
            defaultMapping: DEFAULT_MIDI_MAPPING[midiNote] || null
          }
        }
        noteStats[midiNote].count++
        noteStats[midiNote].velocities.push(Math.round(note.velocity * 127))
        totalNotes++
      })
    })
    
    const sortedNotes = Object.values(noteStats)
      .sort((a, b) => b.count - a.count)
      .map(note => ({
        ...note,
        percentage: ((note.count / totalNotes) * 100).toFixed(1),
        avgVelocity: Math.round(
          note.velocities.reduce((a, b) => a + b, 0) / note.velocities.length
        )
      }))
    
    setNotesFound(sortedNotes)
    
    const initialMapping = {}
    sortedNotes.forEach(note => {
      if (note.defaultMapping) {
        initialMapping[note.midiNote] = {
          instrument: note.defaultMapping.instrument,
          symbol: note.defaultMapping.symbol,
          enabled: true
        }
      } else {
        initialMapping[note.midiNote] = {
          instrument: 'kick',
          symbol: 'x',
          enabled: false
        }
      }
    })
    
    setNoteMapping(initialMapping)
  }
  
  const updateNoteMapping = (midiNote, field, value) => {
    setNoteMapping(prev => ({
      ...prev,
      [midiNote]: {
        ...prev[midiNote],
        [field]: value
      }
    }))
  }
  
  const generatePreview = () => {
    if (!midiData) return
    
    const pattern = {}
    const ppq = midiData.header.ppq || 480
    const ticksPerStep = ppq / 4
    
    midiData.tracks.forEach(track => {
      track.notes.forEach(note => {
        const mapping = noteMapping[note.midi]
        if (!mapping || !mapping.enabled) return
        
        const position = Math.round(note.ticks / ticksPerStep)
        if (position < 0 || position >= 64) return
        
        const velocity = Math.round(note.velocity * 127)
        const instrument = mapping.instrument
        
        if (!pattern[instrument]) {
          pattern[instrument] = []
        }
        
        const modifier = velocity < velocitySettings.ghost ? 'ghost' :
                        velocity > velocitySettings.accent ? 'accent' : ''
        
        pattern[instrument].push({
          position,
          symbol: mapping.symbol,
          modifier,
          velocity
        })
      })
    })
    
    Object.keys(pattern).forEach(instrument => {
      pattern[instrument].sort((a, b) => a.position - b.position)
    })
    
    setPreviewPattern(pattern)
  }
  
  const handleImport = () => {
    if (previewPattern) {
      onImport(previewPattern, noteMapping, velocitySettings)
      onClose()
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-daw-bg-secondary rounded-xl border border-daw-border w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-daw-border">
          <h2 className="text-xl font-bold text-daw-text-primary">Import MIDI File</h2>
          <button
            onClick={onClose}
            className="text-daw-text-secondary hover:text-daw-text-primary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-daw-text-secondary">Loading MIDI file...</div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
              {error}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              <div className="bg-daw-bg-primary rounded-lg p-4 border border-daw-border">
                <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">
                  MIDI File Analysis
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-daw-text-secondary">File: </span>
                    <span className="text-daw-text-primary">{file?.name}</span>
                  </div>
                  <div>
                    <span className="text-daw-text-secondary">Total Notes: </span>
                    <span className="text-daw-text-primary">
                      {notesFound.reduce((sum, n) => sum + n.count, 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-daw-text-secondary">Unique Notes: </span>
                    <span className="text-daw-text-primary">{notesFound.length}</span>
                  </div>
                  <div>
                    <span className="text-daw-text-secondary">Duration: </span>
                    <span className="text-daw-text-primary">
                      {midiData ? `${midiData.duration.toFixed(1)}s` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-daw-bg-primary rounded-lg p-4 border border-daw-border">
                <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">
                  Note to Symbol Mapping
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-daw-border">
                        <th className="text-left py-2 px-3 text-daw-text-secondary">Enable</th>
                        <th className="text-left py-2 px-3 text-daw-text-secondary">Note</th>
                        <th className="text-left py-2 px-3 text-daw-text-secondary">Count</th>
                        <th className="text-left py-2 px-3 text-daw-text-secondary">%</th>
                        <th className="text-left py-2 px-3 text-daw-text-secondary">Avg Vel</th>
                        <th className="text-left py-2 px-3 text-daw-text-secondary">Instrument</th>
                        <th className="text-left py-2 px-3 text-daw-text-secondary">Symbol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notesFound.map(note => (
                        <tr key={note.midiNote} className="border-b border-daw-border/30">
                          <td className="py-2 px-3">
                            <input
                              type="checkbox"
                              checked={noteMapping[note.midiNote]?.enabled || false}
                              onChange={(e) => updateNoteMapping(note.midiNote, 'enabled', e.target.checked)}
                              className="rounded border-daw-border bg-daw-bg-secondary"
                            />
                          </td>
                          <td className="py-2 px-3 text-daw-text-primary">
                            {note.name} ({note.midiNote})
                          </td>
                          <td className="py-2 px-3 text-daw-text-primary">{note.count}</td>
                          <td className="py-2 px-3 text-daw-text-secondary">{note.percentage}%</td>
                          <td className="py-2 px-3 text-daw-text-secondary">{note.avgVelocity}</td>
                          <td className="py-2 px-3">
                            <select
                              value={noteMapping[note.midiNote]?.instrument || 'kick'}
                              onChange={(e) => updateNoteMapping(note.midiNote, 'instrument', e.target.value)}
                              disabled={!noteMapping[note.midiNote]?.enabled}
                              className="bg-daw-bg-secondary border border-daw-border rounded px-2 py-1 text-daw-text-primary"
                            >
                              {INSTRUMENT_TYPES.map(inst => (
                                <option key={inst} value={inst}>{inst}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={noteMapping[note.midiNote]?.symbol || 'x'}
                              onChange={(e) => updateNoteMapping(note.midiNote, 'symbol', e.target.value)}
                              disabled={!noteMapping[note.midiNote]?.enabled}
                              className="bg-daw-bg-secondary border border-daw-border rounded px-2 py-1 text-daw-text-primary font-mono"
                            >
                              {AVAILABLE_SYMBOLS.map(sym => (
                                <option key={sym} value={sym}>{sym}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-daw-bg-primary rounded-lg p-4 border border-daw-border">
                <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">
                  Velocity Settings
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-daw-text-secondary mb-1">
                      Ghost Note Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="127"
                      value={velocitySettings.ghost}
                      onChange={(e) => setVelocitySettings(prev => ({
                        ...prev,
                        ghost: parseInt(e.target.value) || 0
                      }))}
                      className="w-full bg-daw-bg-secondary border border-daw-border rounded px-3 py-1 text-daw-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-daw-text-secondary mb-1">
                      Normal Note Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="127"
                      value={velocitySettings.normal}
                      onChange={(e) => setVelocitySettings(prev => ({
                        ...prev,
                        normal: parseInt(e.target.value) || 0
                      }))}
                      className="w-full bg-daw-bg-secondary border border-daw-border rounded px-3 py-1 text-daw-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-daw-text-secondary mb-1">
                      Accent Note Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="127"
                      value={velocitySettings.accent}
                      onChange={(e) => setVelocitySettings(prev => ({
                        ...prev,
                        accent: parseInt(e.target.value) || 0
                      }))}
                      className="w-full bg-daw-bg-secondary border border-daw-border rounded px-3 py-1 text-daw-text-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-3 p-6 border-t border-daw-border">
          <button
            onClick={generatePreview}
            className="px-4 py-2 bg-daw-button hover:bg-daw-button-hover text-daw-text-primary rounded-md transition-colors"
          >
            Preview
          </button>
          <button
            onClick={handleImport}
            disabled={!previewPattern}
            className="px-4 py-2 bg-daw-accent hover:bg-daw-accent-hover text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-daw-bg-primary hover:bg-daw-button text-daw-text-secondary hover:text-daw-text-primary border border-daw-border rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default MidiImportModal