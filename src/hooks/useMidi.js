import { useCallback, useRef } from 'react'
import * as Tone from 'tone'

const MIDI_MAPPING = {
  36: 'kick',
  35: 'kick',
  38: 'snare',
  40: 'snare',
  42: 'hihat',
  44: 'hihat',
  46: 'hihat',
  49: 'crash',
  57: 'crash',
  51: 'ride',
  59: 'ride'
}

export function useMidi(dispatch, state) {
  const midiDataRef = useRef(null)
  
  const velocityToSymbol = useCallback((velocity) => {
    if (velocity > 110) return 'X'
    if (velocity > 90) return 'x'
    if (velocity > 60) return 'o'
    return '○'
  }, [])
  
  const velocityToModifier = useCallback((velocity) => {
    if (velocity < 50) return 'pp'
    if (velocity > 115) return 'ff'
    if (velocity > 100) return 'f'
    if (velocity < 60) return 'p'
    return ''
  }, [])
  
  const parseMidiToPattern = useCallback((midiData) => {
    const quantization = state.midi.quantization || 16
    const pattern = {}
    
    const ppq = midiData.header.ppq || 480
    const ticksPerStep = ppq / (quantization / 4)
    
    midiData.tracks.forEach(track => {
      track.notes.forEach(note => {
        const instrument = MIDI_MAPPING[note.midi]
        if (!instrument) return
        
        const ticks = note.ticks
        const position = Math.round(ticks / ticksPerStep)
        
        const section = state.project.sections[state.project.currentSection]
        const maxPosition = section.grid.bars * section.grid.beats * section.grid.subdivisions
        
        if (position < 0 || position >= maxPosition) return
        
        const velocity = Math.round(note.velocity * 127)
        
        if (!pattern[instrument]) {
          pattern[instrument] = []
        }
        
        const existingNote = pattern[instrument].find(n => n.position === position)
        if (!existingNote || velocity > (existingNote.velocity || 0)) {
          if (existingNote) {
            pattern[instrument] = pattern[instrument].filter(n => n.position !== position)
          }
          
          pattern[instrument].push({
            position,
            symbol: velocityToSymbol(velocity),
            modifier: velocityToModifier(velocity),
            velocity
          })
        }
      })
    })
    
    // Sort patterns by position
    Object.keys(pattern).forEach(instrument => {
      pattern[instrument].sort((a, b) => a.position - b.position)
    })
    
    return pattern
  }, [state, velocityToSymbol, velocityToModifier])
  
  const applyPatternToState = useCallback((pattern) => {
    const section = state.project.sections[state.project.currentSection]
    if (!section) return
    
    const updatedInstruments = section.instruments.map(instrument => {
      const instrumentPattern = pattern[instrument.id] || []
      return {
        ...instrument,
        pattern: instrumentPattern
      }
    })
    
    dispatch({
      type: 'IMPORT_MIDI_PATTERN',
      payload: { instruments: updatedInstruments }
    })
  }, [dispatch, state])
  
  const importMidiFile = useCallback(async (file) => {
    try {
      const url = URL.createObjectURL(file)
      const midiData = await Tone.Midi.fromUrl(url)
      URL.revokeObjectURL(url)
      
      midiDataRef.current = midiData
      const pattern = parseMidiToPattern(midiData)
      applyPatternToState(pattern)
      
      dispatch({ type: 'SET_MIDI_IMPORTED', payload: true })
      return true
    } catch (error) {
      console.error('Failed to import MIDI:', error)
      return false
    }
  }, [parseMidiToPattern, applyPatternToState, dispatch])
  
  const exportAsMidi = useCallback(async () => {
    const section = state.project.sections[state.project.currentSection]
    if (!section) return null
    
    const midi = new Tone.Midi()
    const track = midi.addTrack()
    track.name = section.name || 'Drum Track'
    
    // Map instrument patterns to MIDI notes
    section.instruments.forEach(instrument => {
      const midiNote = instrument.midiNote || 36 // Default to kick
      
      instrument.pattern.forEach(note => {
        const time = (note.position * 0.25) // Assuming 16th notes
        const velocity = note.modifier === 'ff' ? 1.0 :
                       note.modifier === 'f' ? 0.8 :
                       note.modifier === 'p' ? 0.5 :
                       note.modifier === 'pp' ? 0.3 : 0.7
        
        track.addNote({
          midi: midiNote,
          time: time,
          velocity: velocity,
          duration: 0.1
        })
      })
    })
    
    return midi.toArray()
  }, [state])
  
  return {
    importMidiFile,
    exportAsMidi,
    getMidiData: () => midiDataRef.current
  }
}