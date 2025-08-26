import React, { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { saveAs } from 'file-saver'
import { useAppState } from '../contexts/AppContext'
import './ExportModal.css'

const ExportModal = ({ isOpen, onClose }) => {
  const { state } = useAppState()
  const [format, setFormat] = useState('pdf')
  const [pageSize, setPageSize] = useState('A4')
  const [orientation, setOrientation] = useState('portrait')
  const [quality, setQuality] = useState(2)
  const [isExporting, setIsExporting] = useState(false)
  const [previewCanvas, setPreviewCanvas] = useState(null)
  const previewRef = useRef(null)

  const pageSizes = {
    A4: { width: 210, height: 297 },
    Letter: { width: 216, height: 279 },
    Legal: { width: 216, height: 356 }
  }

  useEffect(() => {
    if (isOpen) {
      generatePreview()
    }
  }, [isOpen, format, pageSize, orientation, quality])

  const generatePreview = async () => {
    const gridElement = document.querySelector('#drum-grid')
    if (!gridElement) return

    try {
      const canvas = await html2canvas(gridElement, {
        scale: 1,
        backgroundColor: '#ffffff',
        logging: false
      })

      if (previewRef.current) {
        const ctx = previewRef.current.getContext('2d')
        
        const maxWidth = 400
        const maxHeight = 300
        const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height)
        
        previewRef.current.width = canvas.width * scale
        previewRef.current.height = canvas.height * scale
        
        ctx.drawImage(canvas, 0, 0, previewRef.current.width, previewRef.current.height)
      }
    } catch (error) {
      console.error('Preview generation failed:', error)
    }
  }

  const handleExport = async () => {
    const gridElement = document.querySelector('#drum-grid')
    if (!gridElement || isExporting) return
    
    setIsExporting(true)

    try {
      const canvas = await html2canvas(gridElement, {
        scale: quality,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      })

      const projectName = state.project.name || 'drum-pattern'
      const timestamp = new Date().toISOString().slice(0, 10)
      const filename = `${projectName}-${timestamp}`

      switch (format) {
        case 'pdf':
          exportAsPDF(canvas, filename)
          break
        case 'png':
          exportAsPNG(canvas, filename)
          break
        case 'svg':
          exportAsSVG(filename)
          break
      }

      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsPDF = (canvas, filename) => {
    const size = pageSizes[pageSize]
    const width = orientation === 'portrait' ? size.width : size.height
    const height = orientation === 'portrait' ? size.height : size.width
    
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: pageSize.toLowerCase()
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = width - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let yPosition = 10
    let heightLeft = imgHeight
    
    pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight)
    heightLeft -= height - 20

    while (heightLeft > 0) {
      pdf.addPage()
      yPosition = -height + 20
      pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight)
      heightLeft -= height - 20
    }

    pdf.save(`${filename}.pdf`)
  }

  const exportAsPNG = (canvas, filename) => {
    canvas.toBlob((blob) => {
      saveAs(blob, `${filename}.png`)
    })
  }

  const exportAsSVG = (filename) => {
    const gridElement = document.querySelector('#drum-grid')
    if (!gridElement) return

    const svgContent = generateSVGFromDOM(gridElement)
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    saveAs(blob, `${filename}.svg`)
  }

  const generateSVGFromDOM = (element) => {
    const rect = element.getBoundingClientRect()
    const cells = element.querySelectorAll('.beat-cell')
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}" viewBox="0 0 ${rect.width} ${rect.height}">`
    svg += `<rect width="${rect.width}" height="${rect.height}" fill="white"/>`
    
    cells.forEach(cell => {
      const cellRect = cell.getBoundingClientRect()
      const x = cellRect.left - rect.left
      const y = cellRect.top - rect.top
      const isActive = cell.classList.contains('active')
      
      svg += `<rect x="${x}" y="${y}" width="${cellRect.width}" height="${cellRect.height}" 
              fill="${isActive ? '#000' : '#fff'}" stroke="#ccc" stroke-width="1"/>`
    })
    
    const texts = element.querySelectorAll('.label, .bar-number, .beat-number')
    texts.forEach(text => {
      const textRect = text.getBoundingClientRect()
      const x = textRect.left - rect.left
      const y = textRect.top - rect.top + textRect.height * 0.7
      
      svg += `<text x="${x}" y="${y}" font-family="Arial" font-size="12" fill="black">
              ${text.textContent}
              </text>`
    })
    
    svg += '</svg>'
    return svg
  }

  if (!isOpen) return null

  return (
    <div className="export-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className="export-modal-content">
        <div className="export-modal-header">
          <h2>Export Pattern</h2>
          <button className="export-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="export-modal-body">
          <div className="export-settings">
            <div className="export-setting-group">
              <label>Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="pdf">PDF</option>
                <option value="png">PNG</option>
                <option value="svg">SVG</option>
              </select>
            </div>

            {format === 'pdf' && (
              <div className="export-setting-group">
                <div className="export-setting-group">
                  <label>Page Size</label>
                  <select value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>

                <div className="export-setting-group">
                  <label>Orientation</label>
                  <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>
            )}

            <div className="export-setting-group">
              <label>Quality (DPI)</label>
              <select value={quality} onChange={(e) => setQuality(parseInt(e.target.value))}>
                <option value="1">Low (72 DPI)</option>
                <option value="2">Medium (144 DPI)</option>
                <option value="3">High (216 DPI)</option>
                <option value="4">Very High (288 DPI)</option>
              </select>
            </div>
          </div>

          <div className="export-preview-section">
            <h3>Preview</h3>
            <div className="export-preview-container">
              <canvas ref={previewRef} id="export-preview-canvas"></canvas>
            </div>
          </div>
        </div>

        <div className="export-modal-footer">
          <button className="export-btn export-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="export-btn export-btn-primary" 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportModal