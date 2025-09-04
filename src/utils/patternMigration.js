// Utility functions for migrating between pattern formats

export function migratePatternToNewFormat(pattern, grid) {
  if (!pattern || pattern.length === 0) return pattern
  
  const { beatSubdivisions = Array(grid.bars * grid.beats).fill(grid.subdivisions) } = grid
  
  return pattern.map(note => {
    // If note already has beatIndex, it's already in new format
    if (note.beatIndex !== undefined && note.subdivision !== undefined) {
      return note
    }
    
    // Convert old position-based format to beat-based format
    let accumPosition = 0
    const totalBeats = grid.bars * grid.beats
    
    for (let beatIndex = 0; beatIndex < totalBeats; beatIndex++) {
      const beatSubdiv = beatSubdivisions[beatIndex]
      if (note.position < accumPosition + beatSubdiv) {
        return {
          ...note,
          beatIndex,
          subdivision: note.position - accumPosition,
          position: note.position // Keep for backward compatibility
        }
      }
      accumPosition += beatSubdiv
    }
    
    // Fallback to original note if conversion fails
    return note
  })
}

export function calculatePositionFromBeat(beatIndex, subdivision, beatSubdivisions) {
  let position = 0
  
  for (let i = 0; i < beatIndex; i++) {
    position += beatSubdivisions[i]
  }
  position += subdivision
  
  return position
}

export function convertBeatToPosition(beatIndex, subdivision, grid) {
  const { beatSubdivisions = Array(grid.bars * grid.beats).fill(grid.subdivisions) } = grid
  return calculatePositionFromBeat(beatIndex, subdivision, beatSubdivisions)
}

export function convertPositionToBeat(position, grid) {
  const { beatSubdivisions = Array(grid.bars * grid.beats).fill(grid.subdivisions) } = grid
  let accumPosition = 0
  const totalBeats = grid.bars * grid.beats
  
  for (let beatIndex = 0; beatIndex < totalBeats; beatIndex++) {
    const beatSubdiv = beatSubdivisions[beatIndex]
    if (position < accumPosition + beatSubdiv) {
      return {
        beatIndex,
        subdivision: position - accumPosition
      }
    }
    accumPosition += beatSubdiv
  }
  
  return null
}

// Ensure grid has beatSubdivisions array
export function ensureBeatSubdivisions(grid) {
  if (!grid.beatSubdivisions) {
    grid.beatSubdivisions = Array(grid.bars * grid.beats).fill(grid.subdivisions || 4)
  }
  return grid
}

// Migrate entire project to new format
export function migrateProjectToNewFormat(project) {
  const migratedProject = { ...project }
  
  Object.keys(migratedProject.sections).forEach(sectionKey => {
    const section = migratedProject.sections[sectionKey]
    
    // Ensure grid has beatSubdivisions
    section.grid = ensureBeatSubdivisions(section.grid)
    
    // Migrate all instrument patterns
    section.instruments = section.instruments.map(instrument => ({
      ...instrument,
      pattern: migratePatternToNewFormat(instrument.pattern, section.grid)
    }))
  })
  
  return migratedProject
}