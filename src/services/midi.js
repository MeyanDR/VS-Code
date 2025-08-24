import * as Tone from 'tone'
import { store } from '../core/state.js'
import { importMidiPattern, setMidiImported } from '../core/actions.js'
import { getInstruments, getQuantization, getVelocityThreshold } from '../core/selectors.js'

class MidiService {
  constructor() {
    this.midiMapping = {
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
  }

  async importMidiFile(file) {
    try {
      const url = URL.createObjectURL(file)
      const midiData = await Tone.Midi.fromUrl(url)
      URL.revokeObjectURL(url)
      
      const pattern = this.parseMidiToPattern(midiData)
      this.applyPatternToState(pattern)
      
      store.dispatch(setMidiImported(true))
      return true
    } catch (error) {
      console.error('Failed to import MIDI:', error)
      return false
    }
  }

  parseMidiToPattern(midiData) {
    const state = store.getState()
    const quantization = getQuantization(state)
    const velocityThreshold = getVelocityThreshold(state)
    const pattern = {}
    
    const ppq = midiData.header.ppq || 480
    const ticksPerStep = ppq / (quantization / 4)
    
    midiData.tracks.forEach(track => {
      track.notes.forEach(note => {
        const instrument = this.midiMapping[note.midi]
        if (!instrument) return
        
        const ticks = note.ticks
        const position = Math.round(ticks / ticksPerStep)
        
        if (position < 0 || position >= 64) return
        
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
            symbol: this.velocityToSymbol(velocity),
            modifier: this.velocityToModifier(velocity),
            velocity
          })
        }
      })
    })
    
    Object.keys(pattern).forEach(instrument => {
      pattern[instrument].sort((a, b) => a.position - b.position)
    })
    
    return pattern
  }

  velocityToSymbol(velocity) {
    if (velocity > 110) return 'x'
    if (velocity > 90) return '/'
    if (velocity > 60) return 'o'
    return '•'
  }

  velocityToModifier(velocity) {
    if (velocity < 50) return 'ghost'
    if (velocity > 115) return 'accent'
    return ''
  }

  applyPatternToState(pattern) {
    const state = store.getState()
    const instruments = getInstruments(state)
    
    const updatedInstruments = instruments.map(instrument => {
      const midiPattern = pattern[instrument.id] || []
      return {
        ...instrument,
        pattern: midiPattern.map(({ position, symbol, modifier }) => ({
          position,
          symbol,
          modifier
        }))
      }
    })
    
    store.dispatch(importMidiPattern(updatedInstruments))
  }

  quantizePosition(timeInSeconds, bpm = 120, subdivision = 16) {
    const beatsPerSecond = bpm / 60
    const subdivisionPerSecond = beatsPerSecond * subdivision / 4
    const position = Math.round(timeInSeconds * subdivisionPerSecond)
    return position
  }
}

export const midiService = new MidiService()