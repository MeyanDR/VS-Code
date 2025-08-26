import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'
import { store } from '../core/state.js'
import { getProjectName } from '../core/selectors.js'

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
    const totalSteps = grid.bars * grid.beats * grid.subdivisions
    
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
    
    for (let i = 0; i <= totalSteps; i++) {
      const x = labelWidth + (i * stepSize)
      let strokeClass = 'grid-line'
      
      if (i % (grid.beats * grid.subdivisions) === 0) {
        strokeClass = 'bar-line'
      } else if (i % grid.subdivisions === 0) {
        strokeClass = 'beat-line'
      }
      
      svg += `<line x1="${x}" y1="30" x2="${x}" y2="${height}" class="${strokeClass}"/>`
    }
    
    instruments.forEach((instrument, index) => {
      const y = 50 + (index * 30)
      
      svg += `<text x="10" y="${y + 5}" class="label">${instrument.name}</text>`
      
      instrument.pattern.forEach(note => {
        const x = labelWidth + (note.position * stepSize) + (stepSize / 2)
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