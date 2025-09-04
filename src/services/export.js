import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'
import { store } from '../core/state.js'
import { getProjectName } from '../core/selectors.js'
import { convertBeatToPosition } from '../utils/patternMigration.js'

class ExportService {
  async exportAsImage(format = 'png') {
    try {
      console.log('🎼 Rendering PROFESSIONAL drum sheet...')
      const gridElement = document.querySelector('#drum-grid')
      if (!gridElement) {
        console.error('Grid element not found')
        return false
      }
      
      const canvas = await html2canvas(gridElement, {
        backgroundColor: '#0f172a',
        scale: 2,
        logging: false,
        useCORS: true
      })
      
      canvas.toBlob((blob) => {
        if (blob) {
          const state = store.getState()
          const projectName = getProjectName(state)
          const timestamp = new Date().toISOString().slice(0, 10)
          const filename = `${projectName}-${timestamp}.${format}`
          saveAs(blob, filename)
        }
      }, `image/${format}`)
      
      return true
    } catch (error) {
      console.error('Failed to export image:', error)
      return false
    }
  }

  exportAsJSON() {
    try {
      const state = store.getState()
      const projectData = {
        project: state.project,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      }
      
      const json = JSON.stringify(projectData, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const projectName = getProjectName(state)
      const filename = `${projectName}.tromklub.json`
      
      saveAs(blob, filename)
      return true
    } catch (error) {
      console.error('Failed to export JSON:', error)
      return false
    }
  }

  async exportAsSVG() {
    try {
      const gridElement = document.querySelector('#drum-grid')
      if (!gridElement) return false
      
      const state = store.getState()
      const svg = this.generateSVG(state)
      
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const projectName = getProjectName(state)
      const filename = `${projectName}.svg`
      
      saveAs(blob, filename)
      return true
    } catch (error) {
      console.error('Failed to export SVG:', error)
      return false
    }
  }

  generateSVG(state) {
    const section = state.project.sections[state.project.currentSection]
    const instruments = section.instruments
    const grid = section.grid
    const { beatSubdivisions = Array(grid.bars * grid.beats).fill(grid.subdivisions) } = grid
    
    // Calculate total steps with variable subdivisions
    let totalSteps = 0
    for (let i = 0; i < beatSubdivisions.length; i++) {
      totalSteps += beatSubdivisions[i]
    }
    
    const stepSize = 20
    const labelWidth = 100
    const width = labelWidth + (totalSteps * stepSize)
    const height = 50 + (instruments.length * 30)
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#0f172a"/>
      <style>
        text { font-family: monospace; fill: white; }
        .label { font-size: 12px; font-weight: bold; }
        .note { font-size: 14px; text-anchor: middle; }
        .grid-line { stroke: #374151; stroke-width: 0.5; }
        .beat-line { stroke: #6b7280; stroke-width: 1; }
        .bar-line { stroke: #9ca3af; stroke-width: 2; }
      </style>`
    
    // Draw grid lines with variable subdivisions
    let currentStep = 0
    for (let bar = 0; bar < grid.bars; bar++) {
      for (let beat = 0; beat < grid.beats; beat++) {
        const beatIndex = bar * grid.beats + beat
        const subdivisions = beatSubdivisions[beatIndex]
        
        // Draw bar line at start of bar
        if (beat === 0) {
          const x = labelWidth + (currentStep * stepSize)
          svg += `<line x1="${x}" y1="30" x2="${x}" y2="${height}" class="bar-line"/>`
        }
        
        // Draw beat and subdivision lines
        for (let subdiv = 0; subdiv < subdivisions; subdiv++) {
          if (subdiv > 0) {
            const x = labelWidth + ((currentStep + subdiv) * stepSize)
            svg += `<line x1="${x}" y1="30" x2="${x}" y2="${height}" class="grid-line"/>`
          }
        }
        
        currentStep += subdivisions
        
        // Draw beat line at end of beat (if not last beat of bar)
        if (beat < grid.beats - 1) {
          const x = labelWidth + (currentStep * stepSize)
          svg += `<line x1="${x}" y1="30" x2="${x}" y2="${height}" class="beat-line"/>`
        }
      }
    }
    
    // Draw final bar line
    const x = labelWidth + (totalSteps * stepSize)
    svg += `<line x1="${x}" y1="30" x2="${x}" y2="${height}" class="bar-line"/>`
    
    instruments.forEach((instrument, index) => {
      const y = 50 + (index * 30)
      
      svg += `<text x="10" y="${y + 5}" class="label">${instrument.name}</text>`
      
      instrument.pattern.forEach(note => {
        // Calculate position based on beat and subdivision
        let position
        if (note.beatIndex !== undefined && note.subdivision !== undefined) {
          position = convertBeatToPosition(note.beatIndex, note.subdivision, grid)
        } else {
          position = note.position
        }
        
        const x = labelWidth + (position * stepSize) + (stepSize / 2)
        svg += `<text x="${x}" y="${y + 5}" class="note">${note.symbol}</text>`
        
        if (note.modifier) {
          const modSymbol = note.modifier === 'accent' ? '>' : 'o'
          svg += `<text x="${x + 5}" y="${y - 5}" font-size="8" fill="#10b981">${modSymbol}</text>`
        }
      })
    })
    
    svg += '</svg>'
    return svg
  }
}

export const exportService = new ExportService()