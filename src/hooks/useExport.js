import { useCallback, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { saveAs } from 'file-saver'

export function useExport(state) {
  const exportOptionsRef = useRef({
    format: 'png',
    theme: 'default',
    includeTitle: true,
    includeLegend: true,
    pageSize: 'A4',
    orientation: 'portrait'
  })
  
  const generateFilename = useCallback((extension) => {
    const projectName = state.project.name || 'untitled'
    const timestamp = new Date().toISOString().split('T')[0]
    return `${projectName}_${timestamp}.${extension}`
  }, [state.project.name])
  
  const exportAsImage = useCallback(async (format = 'png', element = null) => {
    try {
      const targetElement = element || document.querySelector('.drum-grid') || document.getElementById('app')
      
      if (!targetElement) {
        console.error('No element to export')
        return false
      }
      
      const canvas = await html2canvas(targetElement, {
        backgroundColor: state.themes.presets[state.themes.current].backgroundColor,
        scale: 2,
        logging: false
      })
      
      if (format === 'png') {
        canvas.toBlob(blob => {
          saveAs(blob, generateFilename('png'))
        })
      } else if (format === 'svg') {
        // For SVG, we need to generate it differently
        const svgContent = generateSVG()
        const blob = new Blob([svgContent], { type: 'image/svg+xml' })
        saveAs(blob, generateFilename('svg'))
      }
      
      return true
    } catch (error) {
      console.error('Failed to export image:', error)
      return false
    }
  }, [state, generateFilename])
  
  const exportAsPDF = useCallback(async (element = null) => {
    try {
      const targetElement = element || document.querySelector('.drum-grid') || document.getElementById('app')
      
      if (!targetElement) {
        console.error('No element to export')
        return false
      }
      
      const canvas = await html2canvas(targetElement, {
        backgroundColor: state.themes.presets[state.themes.current].backgroundColor,
        scale: 2,
        logging: false
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: state.layout.orientation,
        unit: 'mm',
        format: state.layout.pageSize.toLowerCase()
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.9
      
      const scaledWidth = imgWidth * ratio
      const scaledHeight = imgHeight * ratio
      const x = (pdfWidth - scaledWidth) / 2
      const y = (pdfHeight - scaledHeight) / 2
      
      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight)
      pdf.save(generateFilename('pdf'))
      
      return true
    } catch (error) {
      console.error('Failed to export PDF:', error)
      return false
    }
  }, [state, generateFilename])
  
  const exportAsJSON = useCallback(() => {
    try {
      const exportData = {
        version: '1.0.0',
        project: state.project,
        layout: state.layout,
        themes: state.themes,
        exportDate: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      
      saveAs(blob, generateFilename('json'))
      return true
    } catch (error) {
      console.error('Failed to export JSON:', error)
      return false
    }
  }, [state, generateFilename])
  
  const generateSVG = useCallback(() => {
    const section = state.project.sections[state.project.currentSection]
    if (!section) return ''
    
    const { grid, instruments } = section
    const cellSize = 20
    const gap = 2
    const totalSteps = grid.bars * grid.beats * grid.subdivisions
    const width = (cellSize + gap) * totalSteps + 100
    const height = (cellSize + gap) * instruments.length + 50
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
    svg += `<rect width="${width}" height="${height}" fill="${state.themes.presets[state.themes.current].backgroundColor}"/>`
    
    // Add title
    if (state.project.name) {
      svg += `<text x="${width/2}" y="30" text-anchor="middle" fill="white" font-size="20" font-weight="bold">${state.project.name}</text>`
    }
    
    // Draw grid
    instruments.forEach((instrument, row) => {
      const y = 50 + row * (cellSize + gap)
      
      // Instrument name
      svg += `<text x="10" y="${y + cellSize/2 + 5}" fill="white" font-size="12">${instrument.name}</text>`
      
      // Draw cells
      for (let col = 0; col < totalSteps; col++) {
        const x = 100 + col * (cellSize + gap)
        const note = instrument.pattern.find(n => n.position === col)
        
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" 
                 fill="${note ? '#0891b2' : '#1e293b'}" 
                 stroke="#475569" stroke-width="1"/>`
        
        if (note) {
          svg += `<text x="${x + cellSize/2}" y="${y + cellSize/2 + 5}" 
                   text-anchor="middle" fill="white" font-size="14" font-weight="bold">
                   ${note.symbol}</text>`
        }
      }
    })
    
    svg += '</svg>'
    return svg
  }, [state])
  
  const setExportOptions = useCallback((options) => {
    exportOptionsRef.current = { ...exportOptionsRef.current, ...options }
  }, [])
  
  return {
    exportAsImage,
    exportAsPDF,
    exportAsJSON,
    generateSVG,
    setExportOptions,
    getExportOptions: () => exportOptionsRef.current
  }
}