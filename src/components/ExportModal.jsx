import React, { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { saveAs } from 'file-saver'
import { useAppState } from '../contexts/AppContext'
import ExportView from './ExportView'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Slider } from './ui/slider'

const ExportModal = ({ isOpen, onClose }) => {
  const { state } = useAppState()
  const [format, setFormat] = useState('pdf')
  const [pageSize, setPageSize] = useState('A4')
  const [orientation, setOrientation] = useState('portrait')
  const [quality, setQuality] = useState(2)
  const [isExporting, setIsExporting] = useState(false)
  const [previewCanvas, setPreviewCanvas] = useState(null)
  const [activeTab, setActiveTab] = useState('settings')
  const [exportMode, setExportMode] = useState('clean') // 'clean' or 'current'
  const previewRef = useRef(null)
  const cleanExportRef = useRef(null)

  const pageSizes = {
    A4: { width: 210, height: 297 },
    Letter: { width: 216, height: 279 },
    Legal: { width: 216, height: 356 }
  }

  useEffect(() => {
    if (isOpen) {
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        console.log(`Generating preview in ${exportMode} mode`)
        generatePreview()
      }, 100)
    }
  }, [isOpen, format, pageSize, orientation, quality, exportMode])

  // Generate preview when switching to preview tab
  useEffect(() => {
    if (isOpen && activeTab === 'preview') {
      console.log('Preview tab activated, generating preview')
      generatePreview()
    }
  }, [activeTab, isOpen])

  const generatePreview = async () => {
    let elementToExport
    
    if (exportMode === 'clean') {
      // Generate clean export preview
      elementToExport = cleanExportRef.current
      if (!elementToExport) {
        console.error('Clean export container not found')
        return
      }
    } else {
      // Current view mode - capture the drum grid
      elementToExport = document.querySelector('#drum-grid')
      console.log('Grid element found:', elementToExport)
      if (!elementToExport) {
        console.error('Could not find #drum-grid element')
        return
      }
    }

    try {
      const canvas = await html2canvas(elementToExport, {
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
    if (isExporting) return
    
    let elementToExport
    if (exportMode === 'clean') {
      elementToExport = cleanExportRef.current
    } else {
      elementToExport = document.querySelector('#drum-grid')
    }
    
    if (!elementToExport) {
      console.error('Export element not found')
      return
    }
    
    setIsExporting(true)

    try {
      const canvas = await html2canvas(elementToExport, {
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
    let elementToExport
    if (exportMode === 'clean') {
      elementToExport = cleanExportRef.current
    } else {
      elementToExport = document.querySelector('#drum-grid')
    }
    
    if (!elementToExport) return

    const svgContent = generateSVGFromDOM(elementToExport)
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

  const qualityLabels = {
    1: 'Low (72 DPI)',
    2: 'Medium (144 DPI)',
    3: 'High (216 DPI)',
    4: 'Very High (288 DPI)'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Export Pattern</DialogTitle>
          <DialogDescription>
            Choose format and settings for your drum pattern export.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="space-y-4 min-h-[300px]">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="exportMode" className="text-right text-daw-text-primary">
                  Export Mode
                </Label>
                <Select value={exportMode} onValueChange={setExportMode}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select export mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clean">Clean Export (Professional)</SelectItem>
                    <SelectItem value="current">Current View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="format" className="text-right">
                  Format
                </Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="svg">SVG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {format === 'pdf' && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="pageSize" className="text-right">
                      Page Size
                    </Label>
                    <Select value={pageSize} onValueChange={setPageSize}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select page size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="Letter">Letter</SelectItem>
                        <SelectItem value="Legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="orientation" className="text-right">
                      Orientation
                    </Label>
                    <Select value={orientation} onValueChange={setOrientation}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select orientation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quality" className="text-right">
                  Quality
                </Label>
                <div className="col-span-3 space-y-2">
                  <Slider
                    id="quality"
                    min={1}
                    max={4}
                    step={1}
                    value={[quality]}
                    onValueChange={(value) => setQuality(value[0])}
                    className="w-full"
                  />
                  <span className="text-sm text-daw-text-secondary">
                    {qualityLabels[quality]}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-4 min-h-[300px]">
            <div className="border border-daw-border rounded-lg p-4 min-h-[250px]">
              <canvas 
                ref={previewRef} 
                className="w-full h-auto max-h-[400px] object-contain"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
        
        {/* Hidden clean export view for generating exports */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '1200px' }}>
          <div ref={cleanExportRef}>
            {exportMode === 'clean' && <ExportView />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ExportModal