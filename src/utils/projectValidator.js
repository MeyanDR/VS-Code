// Validates project data structure to prevent crashes
export function validateProjectData(data) {
  if (!data || typeof data !== 'object') {
    return { 
      valid: false, 
      error: 'Invalid project data: not an object',
      fixedData: null
    }
  }

  // Check for required fields and provide defaults if missing
  const requiredFields = {
    project: {
      name: 'Untitled Project',
      bpm: 120,
      currentSection: 0,
      sections: [getDefaultSection()]
    },
    ui: {
      selectedSteps: [],
      copiedSteps: null,
      selectedInstrument: 0,
      viewMode: 'pattern',
      showGrid: true,
      showInstrumentSettings: false
    },
    playback: {
      isPlaying: false,
      currentBar: 0,
      currentBeat: 0,
      currentSubdivision: 0,
      startTime: null,
      lastTime: 0
    }
  }

  // Deep clone to avoid mutating original
  let fixedData = JSON.parse(JSON.stringify(data))
  let hasErrors = false
  let errors = []

  // Validate and fix top-level structure
  for (const [key, defaultValue] of Object.entries(requiredFields)) {
    if (!fixedData[key]) {
      fixedData[key] = defaultValue
      errors.push(`Missing ${key} section - using defaults`)
      hasErrors = true
    } else if (typeof fixedData[key] !== 'object') {
      fixedData[key] = defaultValue
      errors.push(`Invalid ${key} section - using defaults`)
      hasErrors = true
    }
  }

  // Validate sections array
  if (!Array.isArray(fixedData.project.sections) || fixedData.project.sections.length === 0) {
    fixedData.project.sections = [getDefaultSection()]
    errors.push('Invalid or missing sections - created default section')
    hasErrors = true
  }

  // Validate each section
  fixedData.project.sections = fixedData.project.sections.map((section, idx) => {
    if (!section || typeof section !== 'object') {
      errors.push(`Section ${idx} is invalid - replacing with default`)
      return getDefaultSection()
    }

    // Ensure section has required fields
    if (!section.name) section.name = `Section ${idx + 1}`
    if (!section.grid || typeof section.grid !== 'object') {
      section.grid = getDefaultGrid()
      errors.push(`Section ${idx} missing grid - using default`)
    }
    if (!Array.isArray(section.instruments)) {
      section.instruments = getDefaultInstruments()
      errors.push(`Section ${idx} missing instruments - using defaults`)
    }
    if (!section.patterns || typeof section.patterns !== 'object') {
      section.patterns = {}
      errors.push(`Section ${idx} missing patterns - initialized empty`)
    }

    return section
  })

  // Ensure currentSection is valid
  if (typeof fixedData.project.currentSection !== 'number' || 
      fixedData.project.currentSection < 0 || 
      fixedData.project.currentSection >= fixedData.project.sections.length) {
    fixedData.project.currentSection = 0
    errors.push('Invalid currentSection - reset to 0')
  }

  // Ensure selectedInstrument is valid
  const currentSection = fixedData.project.sections[fixedData.project.currentSection]
  if (typeof fixedData.ui.selectedInstrument !== 'number' ||
      fixedData.ui.selectedInstrument < 0 ||
      fixedData.ui.selectedInstrument >= currentSection.instruments.length) {
    fixedData.ui.selectedInstrument = 0
    errors.push('Invalid selectedInstrument - reset to 0')
  }

  return {
    valid: !hasErrors || errors.length === 0,
    errors: errors,
    fixedData: fixedData,
    wasFixed: hasErrors
  }
}

function getDefaultSection() {
  return {
    name: 'Section 1',
    grid: getDefaultGrid(),
    instruments: getDefaultInstruments(),
    patterns: {},
    groups: []
  }
}

function getDefaultGrid() {
  return {
    bars: 1,
    beats: 4,
    subdivisions: 4,
    beatSubdivisions: Array(4).fill(4)
  }
}

function getDefaultInstruments() {
  return [
    { 
      id: 0, 
      name: 'Kick', 
      symbol: '◯', 
      midiNote: 36,
      color: '#ef4444'
    },
    { 
      id: 1, 
      name: 'Snare', 
      symbol: '◐', 
      midiNote: 38,
      color: '#f59e0b'
    },
    { 
      id: 2, 
      name: 'Hi-Hat', 
      symbol: '×', 
      midiNote: 42,
      color: '#10b981'
    }
  ]
}

export default validateProjectData