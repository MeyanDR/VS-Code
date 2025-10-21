// Utilities for working with selection keys of the form `${instrumentId}-${beatIndex}-${subdivision}`
// This provides a consistent way to identify any cell in the grid using musical coordinates

export function parseStepKey(stepKey) {
  if (typeof stepKey !== 'string') {
    return { instrumentId: '', beatIndex: NaN, subdivision: NaN }
  }
  
  // Split by dash, but instrument IDs may contain dashes
  // Format: instrumentId-beatIndex-subdivision
  // So we split on the last two dashes
  const parts = stepKey.split('-')
  if (parts.length < 3) {
    return { instrumentId: stepKey, beatIndex: NaN, subdivision: NaN }
  }
  
  const subdivision = parseInt(parts.pop(), 10)
  const beatIndex = parseInt(parts.pop(), 10)
  const instrumentId = parts.join('-') // Rejoin remaining parts for instrument ID
  
  return { instrumentId, beatIndex, subdivision }
}

export function makeStepKey(instrumentId, beatIndex, subdivision) {
  return `${instrumentId}-${beatIndex}-${subdivision}`
}

// Helper function to get all cells between two points using beat/subdivision coordinates
export function getSelectedCellsBetween(startCell, endCell, section) {
  if (!section) return new Set()
  
  const selectedCells = new Set()
  const instruments = section.instruments
  
  // Find instrument indices
  const startInstrumentIndex = instruments.findIndex(i => i.id === startCell.instrumentId)
  const endInstrumentIndex = instruments.findIndex(i => i.id === endCell.instrumentId)
  
  const minInstrument = Math.min(startInstrumentIndex, endInstrumentIndex)
  const maxInstrument = Math.max(startInstrumentIndex, endInstrumentIndex)
  
  // For beat/subdivision selection, we need to consider the grid structure
  const beatSubdivisions = section.grid.beatSubdivisions || 
    Array(section.grid.bars * section.grid.beats).fill(section.grid.subdivisions)
  
  // Find min/max beat and subdivision
  const startBeat = startCell.beatIndex
  const endBeat = endCell.beatIndex
  const minBeat = Math.min(startBeat, endBeat)
  const maxBeat = Math.max(startBeat, endBeat)
  
  // Select all cells in the rectangle
  for (let i = minInstrument; i <= maxInstrument; i++) {
    const instrument = instruments[i]
    if (!instrument) continue
    
    for (let beat = minBeat; beat <= maxBeat; beat++) {
      const subdivCount = beatSubdivisions[beat] || section.grid.subdivisions
      
      // Determine subdivision range for this beat
      let minSubdiv = 0
      let maxSubdiv = subdivCount - 1
      
      // Only limit subdivisions for the start and end beats
      if (beat === minBeat && minBeat === maxBeat) {
        // Single beat selection - use the actual subdivision range
        minSubdiv = Math.min(startCell.subdivision, endCell.subdivision)
        maxSubdiv = Math.max(startCell.subdivision, endCell.subdivision)
      } else if (beat === minBeat) {
        // First beat in multi-beat selection
        minSubdiv = Math.min(startCell.subdivision, endCell.subdivision)
        if (startBeat === minBeat) {
          minSubdiv = startCell.subdivision
        } else {
          minSubdiv = endCell.subdivision
        }
      } else if (beat === maxBeat) {
        // Last beat in multi-beat selection
        maxSubdiv = Math.max(startCell.subdivision, endCell.subdivision)
        if (startBeat === maxBeat) {
          maxSubdiv = startCell.subdivision
        } else {
          maxSubdiv = endCell.subdivision
        }
      }
      // Middle beats use full range (0 to subdivCount-1)
      
      for (let subdiv = minSubdiv; subdiv <= maxSubdiv; subdiv++) {
        if (subdiv >= 0 && subdiv < subdivCount) {
          selectedCells.add(makeStepKey(instrument.id, beat, subdiv))
        }
      }
    }
  }
  
  return selectedCells
}

