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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Slider } from './ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'

const ExportModal = ({ isOpen, onClose }) => {
  const { state, dispatch } = useAppState()
  const [activeTab, setActiveTab] = useState('basic')
  const [isExporting, setIsExporting] = useState(false)
  const [previewPage, setPreviewPage] = useState(0)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [previewPages, setPreviewPages] = useState([])
  const [zoomLevel, setZoomLevel] = useState('fit')
  const [isEditingZoom, setIsEditingZoom] = useState(false)
  const [customZoomInput, setCustomZoomInput] = useState('')
  const cleanExportRef = useRef(null)
  const previewRef = useRef(null)
  const zoomInputRef = useRef(null)

  const exportConfig = state.exportConfig || {}
  const layout = exportConfig.layout || {}

  const pageSizes = {
    A4: { width: 210, height: 297 },
    Letter: { width: 216, height: 279 },
    A3: { width: 297, height: 420 }
  }

  // Calculate page width in pixels for layout calculations (96 DPI)
  const getPageWidthPx = () => {
    const pageSize = pageSizes[exportConfig.pageSize || 'A4']
    const mmToPixels = 3.7795275591 // 96 DPI conversion
    const width = exportConfig.orientation === 'portrait' ? pageSize.width : pageSize.height
    return Math.floor(width * mmToPixels)
  }

  // Calculate page height in pixels for pagination
  const getPageHeightPx = () => {
    const pageSize = pageSizes[exportConfig.pageSize || 'A4']
    const mmToPixels = 3.7795275591 // 96 DPI conversion
    const height = exportConfig.orientation === 'portrait' ? pageSize.height : pageSize.width
    return Math.floor(height * mmToPixels)
  }

  // Update export config helpers
  const updateExportConfig = (updates) => {
    dispatch({ type: 'UPDATE_EXPORT_CONFIG', payload: updates })
  }

  const updateLayout = (updates) => {
    dispatch({ type: 'UPDATE_EXPORT_LAYOUT', payload: updates })
  }

  const updateTypography = (updates) => {
    dispatch({ type: 'UPDATE_EXPORT_TYPOGRAPHY', payload: updates })
  }

  const updateSpacing = (updates) => {
    dispatch({ type: 'UPDATE_EXPORT_SPACING', payload: updates })
  }

  const updateMargins = (updates) => {
    // Update export margins
    dispatch({ type: 'UPDATE_EXPORT_MARGINS', payload: updates })
    // Also update main layout margins to affect live grid
    dispatch({ type: 'UPDATE_LAYOUT', payload: { margins: { ...state.layout.margins, ...updates } } })
  }

  const toggleOption = (option) => {
    dispatch({ type: 'TOGGLE_EXPORT_OPTION', payload: { option } })
  }

  // Generate preview when settings change
  useEffect(() => {
    if (isOpen) {
      generatePreview()
    }
  }, [isOpen, exportConfig.scope, exportConfig.pageSize, exportConfig.orientation, layout.beatUnitWidth, layout.instrumentLabelWidth, layout.stepGap, layout.rowSpacing])

  // Calculate preview pages based on scope and instrument count
  useEffect(() => {
    setPreviewPage(0)
    if (exportConfig.scope === 'full') {
      // For full song, each section is a page
      const sectionCount = Object.keys(state.project.sections || {}).length
      setPreviewPages(Array.from({ length: sectionCount }, (_, i) => i))
    } else {
      // For current section, calculate pages based on instruments
      const currentSection = state.project?.sections?.[state.project?.currentSection]
      const instrumentCount = currentSection?.instruments?.length || 0
      const pageHeight = getPageHeightPx()
      const rowSpacing = layout.rowSpacing || 12

      // Estimate pages (simplified calculation)
      const HEADER_HEIGHT = 120
      const LEGEND_HEIGHT = 200
      const PAGE_PADDING = 80
      const ESTIMATED_ROW_HEIGHT = 80 + rowSpacing

      const FIRST_PAGE_AVAILABLE = pageHeight - HEADER_HEIGHT - PAGE_PADDING - LEGEND_HEIGHT - 50
      const SUBSEQUENT_PAGE_AVAILABLE = pageHeight - PAGE_PADDING - 100

      const instrumentsPerFirstPage = Math.max(1, Math.floor(FIRST_PAGE_AVAILABLE / ESTIMATED_ROW_HEIGHT))
      const instrumentsPerSubsequentPage = Math.max(1, Math.floor(SUBSEQUENT_PAGE_AVAILABLE / ESTIMATED_ROW_HEIGHT))

      let pageCount = 1
      if (instrumentCount > instrumentsPerFirstPage) {
        const remainingCount = instrumentCount - instrumentsPerFirstPage
        pageCount = 1 + Math.ceil(remainingCount / instrumentsPerSubsequentPage)
      }

      setPreviewPages(Array.from({ length: pageCount }, (_, i) => i))
    }
  }, [exportConfig.scope, state.project.sections, state.project.currentSection, layout.rowSpacing])

  const generatePreview = async () => {
    setIsGeneratingPreview(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      setIsGeneratingPreview(false)
    } catch (error) {
      console.error('Preview generation failed:', error)
      setIsGeneratingPreview(false)
    }
  }

  // Calculate fit scale based on both width and height
  const getFitScale = () => {
    // If manual zoom is set, use it directly
    if (zoomLevel !== 'fit') {
      return parseFloat(zoomLevel) / 100
    }

    // Preview container dimensions - increased to fill the preview area better
    const availableWidth = 700
    const availableHeight = 1000  // Increased from 850 to fill more height

    // Paper dimensions in pixels (for aspect ratio calculation)
    const pageSize = pageSizes[exportConfig.pageSize || 'A4']
    const paperWidth = exportConfig.orientation === 'portrait' ? pageSize.width : pageSize.height
    const paperHeight = exportConfig.orientation === 'portrait' ? pageSize.height : pageSize.width

    // Calculate scale to fit both dimensions
    const scaleToFitWidth = availableWidth / (paperWidth * 3.78) // mm to px at 96 DPI
    const scaleToFitHeight = availableHeight / (paperHeight * 3.78)

    // Use the smaller scale to ensure entire page fits (removed 1 cap to allow scaling above 100%)
    return Math.min(scaleToFitWidth, scaleToFitHeight)
  }

  // Zoom control handlers
  const handleZoomChange = (value) => {
    setZoomLevel(value)
  }

  const handleZoomDoubleClick = () => {
    const currentZoom = zoomLevel === 'fit' ? '100' : zoomLevel
    setCustomZoomInput(currentZoom)
    setIsEditingZoom(true)
    // Focus the input after state update
    setTimeout(() => {
      if (zoomInputRef.current) {
        zoomInputRef.current.focus()
        zoomInputRef.current.select()
      }
    }, 0)
  }

  const handleZoomInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      applyCustomZoom()
    } else if (e.key === 'Escape') {
      setIsEditingZoom(false)
      setCustomZoomInput('')
    }
  }

  const applyCustomZoom = () => {
    const zoomValue = parseFloat(customZoomInput)
    if (!isNaN(zoomValue) && zoomValue >= 10 && zoomValue <= 500) {
      setZoomLevel(zoomValue.toString())
      setIsEditingZoom(false)
      setCustomZoomInput('')
    } else {
      // Invalid input - just cancel
      setIsEditingZoom(false)
      setCustomZoomInput('')
    }
  }

  const handleZoomInputBlur = () => {
    applyCustomZoom()
  }

  const handleExport = async () => {
    if (isExporting) return
    setIsExporting(true)

    try {
      const projectName = state.project.name || 'drum-pattern'
      const timestamp = new Date().toISOString().slice(0, 10)
      const scopeText = exportConfig.scope === 'current' ? 'current-section' : 'full-song'
      const filename = `${projectName}-${scopeText}-${timestamp}`

      if (exportConfig.scope === 'current') {
        await exportCurrentSection(filename)
      } else {
        await exportFullSong(filename)
      }

      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const exportCurrentSection = async (filename) => {
    const elementToExport = cleanExportRef.current
    if (!elementToExport) {
      throw new Error('Export element not found')
    }

    // Get the actual content dimensions
    const contentWidth = elementToExport.scrollWidth
    const contentHeight = elementToExport.scrollHeight

    const canvas = await html2canvas(elementToExport, {
      scale: exportConfig.format === 'jpg' ? (exportConfig.quality / 100) * 3 : 4,  // HD: 4x for PDF
      backgroundColor: '#FFFFFF',
      logging: false,
      useCORS: true,
      width: contentWidth,
      height: contentHeight,
      windowWidth: contentWidth,
      windowHeight: contentHeight
    })

    if (exportConfig.format === 'pdf') {
      exportAsPDF(canvas, filename)
    } else if (exportConfig.format === 'jpg') {
      exportAsJPG(canvas, filename)
    }
  }

  const exportFullSong = async (filename) => {
    const canvases = []
    const originalSection = state.project.currentSection

    for (const [sectionId, section] of Object.entries(state.project.sections || {})) {
      dispatch({ type: 'SET_CURRENT_SECTION', payload: sectionId })
      await new Promise(resolve => setTimeout(resolve, 200))

      const elementToExport = cleanExportRef.current
      if (elementToExport) {
        // Get the actual content dimensions
        const contentWidth = elementToExport.scrollWidth
        const contentHeight = elementToExport.scrollHeight

        const canvas = await html2canvas(elementToExport, {
          scale: exportConfig.format === 'jpg' ? (exportConfig.quality / 100) * 3 : 4,
          backgroundColor: '#FFFFFF',
          logging: false,
          useCORS: true,
          width: contentWidth,
          height: contentHeight,
          windowWidth: contentWidth,
          windowHeight: contentHeight
        })
        canvases.push(canvas)
      }
    }

    dispatch({ type: 'SET_CURRENT_SECTION', payload: originalSection })

    if (exportConfig.format === 'pdf') {
      exportMultiPagePDF(canvases, filename)
    } else if (exportConfig.format === 'jpg') {
      exportMultiPageJPG(canvases, filename)
    }
  }

  const exportAsPDF = (canvas, filename) => {
    const size = pageSizes[exportConfig.pageSize]
    const width = exportConfig.orientation === 'portrait' ? size.width : size.height
    const height = exportConfig.orientation === 'portrait' ? size.height : size.width

    const pdf = new jsPDF({
      orientation: exportConfig.orientation,
      unit: 'mm',
      format: exportConfig.pageSize.toLowerCase(),
      compress: true  // Better compression
    })

    const imgData = canvas.toDataURL('image/png', 0.95)
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

  const exportMultiPagePDF = (canvases, filename) => {
    const size = pageSizes[exportConfig.pageSize]
    const width = exportConfig.orientation === 'portrait' ? size.width : size.height
    const height = exportConfig.orientation === 'portrait' ? size.height : size.width

    const pdf = new jsPDF({
      orientation: exportConfig.orientation,
      unit: 'mm',
      format: exportConfig.pageSize.toLowerCase(),
      compress: true
    })

    canvases.forEach((canvas, index) => {
      if (index > 0) pdf.addPage()

      const imgData = canvas.toDataURL('image/png', 0.95)
      const imgWidth = width - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, height - 20))
    })

    pdf.save(`${filename}.pdf`)
  }

  const exportAsJPG = (canvas, filename) => {
    canvas.toBlob((blob) => {
      saveAs(blob, `${filename}.jpg`)
    }, 'image/jpeg', exportConfig.quality / 100)
  }

  const exportMultiPageJPG = (canvases, filename) => {
    canvases.forEach((canvas, index) => {
      canvas.toBlob((blob) => {
        const sectionFilename = canvases.length > 1
          ? `${filename}-section-${index + 1}.jpg`
          : `${filename}.jpg`
        saveAs(blob, sectionFilename)
      }, 'image/jpeg', exportConfig.quality / 100)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1400px] h-[800px] grid-rows-[auto_1fr_auto]">
        <DialogHeader>
          <DialogTitle>Export PDF/JPG</DialogTitle>
          <DialogDescription>
            Professional drum sheet export with customizable layout and formatting
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6 h-full py-4">
          {/* Left Column - Settings with Tabs */}
          <div className="w-96 flex-shrink-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-2">
                {/* BASIC TAB */}
                <TabsContent value="basic" className="space-y-4 mt-0">
                  {/* Export Scope */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Export Scope</Label>
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="current"
                          checked={exportConfig.scope === 'current'}
                          onChange={(e) => updateExportConfig({ scope: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm">Current Section Only</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="full"
                          checked={exportConfig.scope === 'full'}
                          onChange={(e) => updateExportConfig({ scope: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm">Full Song (All Sections)</span>
                      </label>
                    </div>
                  </div>

                  {/* Format */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Format</Label>
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="pdf"
                          checked={exportConfig.format === 'pdf'}
                          onChange={(e) => updateExportConfig({ format: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm">PDF</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="jpg"
                          checked={exportConfig.format === 'jpg'}
                          onChange={(e) => updateExportConfig({ format: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm">JPG</span>
                      </label>
                    </div>
                  </div>


                  {/* Orientation */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Orientation</Label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="portrait"
                          checked={exportConfig.orientation === 'portrait'}
                          onChange={(e) => updateExportConfig({ orientation: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm">Portrait</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="landscape"
                          checked={exportConfig.orientation === 'landscape'}
                          onChange={(e) => updateExportConfig({ orientation: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm">Landscape</span>
                      </label>
                    </div>
                  </div>

                  {/* Quality (for JPG) */}
                  {exportConfig.format === 'jpg' && (
                    <div className="space-y-3">
                      <Label htmlFor="quality" className="text-sm font-medium">
                        Quality: {exportConfig.quality}%
                      </Label>
                      <Slider
                        id="quality"
                        min={1}
                        max={100}
                        step={1}
                        value={[exportConfig.quality || 90]}
                        onValueChange={(value) => updateExportConfig({ quality: value[0] })}
                        className="w-full"
                      />
                    </div>
                  )}
                </TabsContent>

                {/* LAYOUT TAB */}
                <TabsContent value="layout" className="space-y-4 mt-0">
                  {/* Beat Unit Width */}
                  <div className="space-y-3">
                    <Label htmlFor="beatUnitWidth" className="text-sm font-medium">
                      Beat Unit Width: {layout.beatUnitWidth || 140}px
                    </Label>
                    <Slider
                      id="beatUnitWidth"
                      min={80}
                      max={200}
                      step={10}
                      value={[layout.beatUnitWidth || 140]}
                      onValueChange={(value) => updateLayout({ beatUnitWidth: value[0] })}
                      className="w-full"
                    />
                  </div>

                  {/* Instrument Label Width */}
                  <div className="space-y-3">
                    <Label htmlFor="instrumentLabelWidth" className="text-sm font-medium">
                      Instrument Label Width: {layout.instrumentLabelWidth || 80}px
                    </Label>
                    <Slider
                      id="instrumentLabelWidth"
                      min={60}
                      max={150}
                      step={10}
                      value={[layout.instrumentLabelWidth || 80]}
                      onValueChange={(value) => updateLayout({ instrumentLabelWidth: value[0] })}
                      className="w-full"
                    />
                  </div>

                  {/* Subdivision Step Gap */}
                  <div className="space-y-3">
                    <Label htmlFor="stepGap" className="text-sm font-medium">
                      Subdivision Step Gap: {layout.stepGap || 2}px
                    </Label>
                    <Slider
                      id="stepGap"
                      min={1}
                      max={5}
                      step={1}
                      value={[layout.stepGap || 2]}
                      onValueChange={(value) => updateLayout({ stepGap: value[0] })}
                      className="w-full"
                    />
                  </div>

                  {/* Row Spacing */}
                  <div className="space-y-3">
                    <Label htmlFor="rowSpacing" className="text-sm font-medium">
                      Row Spacing: {layout.rowSpacing || 12}px
                    </Label>
                    <Slider
                      id="rowSpacing"
                      min={8}
                      max={30}
                      step={2}
                      value={[layout.rowSpacing || 12]}
                      onValueChange={(value) => updateLayout({ rowSpacing: value[0] })}
                      className="w-full"
                    />
                  </div>

                  {/* Margins */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Margins (mm)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-500">Top</Label>
                        <Input
                          type="number"
                          min={5}
                          max={50}
                          value={layout.margins?.top || 20}
                          onChange={(e) => updateMargins({ top: parseInt(e.target.value) })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Right</Label>
                        <Input
                          type="number"
                          min={5}
                          max={50}
                          value={layout.margins?.right || 15}
                          onChange={(e) => updateMargins({ right: parseInt(e.target.value) })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Bottom</Label>
                        <Input
                          type="number"
                          min={5}
                          max={50}
                          value={layout.margins?.bottom || 20}
                          onChange={(e) => updateMargins({ bottom: parseInt(e.target.value) })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Left</Label>
                        <Input
                          type="number"
                          min={5}
                          max={50}
                          value={layout.margins?.left || 15}
                          onChange={(e) => updateMargins({ left: parseInt(e.target.value) })}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Spacing */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Spacing (px)</Label>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-gray-500">Section Gap: {layout.spacing?.sectionGap || 30}</Label>
                        <Slider
                          min={20}
                          max={50}
                          value={[layout.spacing?.sectionGap || 30]}
                          onValueChange={(value) => updateSpacing({ sectionGap: value[0] })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Bar Gap: {layout.spacing?.barGap || 8}</Label>
                        <Slider
                          min={4}
                          max={16}
                          value={[layout.spacing?.barGap || 8]}
                          onValueChange={(value) => updateSpacing({ barGap: value[0] })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Beat Gap: {layout.spacing?.beatGap || 4}</Label>
                        <Slider
                          min={2}
                          max={8}
                          value={[layout.spacing?.beatGap || 4]}
                          onValueChange={(value) => updateSpacing({ beatGap: value[0] })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Line Gap: {layout.spacing?.lineGap || 20}</Label>
                        <Slider
                          min={10}
                          max={30}
                          value={[layout.spacing?.lineGap || 20]}
                          onValueChange={(value) => updateSpacing({ lineGap: value[0] })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Beat Shading */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="beatShading"
                        checked={layout.beatShading !== false}
                        onCheckedChange={() => toggleOption('beatShading')}
                      />
                      <Label htmlFor="beatShading" className="text-sm font-medium cursor-pointer">
                        Shade alternate beats (2 & 4)
                      </Label>
                    </div>
                  </div>
                </TabsContent>

                {/* STYLE TAB */}
                <TabsContent value="style" className="space-y-4 mt-0">
                  {/* Typography */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Typography (px)</Label>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-gray-500">Title: {layout.typography?.titleSize || 32}</Label>
                        <Slider
                          min={24}
                          max={48}
                          value={[layout.typography?.titleSize || 32]}
                          onValueChange={(value) => updateTypography({ titleSize: value[0] })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Section Name: {layout.typography?.sectionNameSize || 20}</Label>
                        <Slider
                          min={16}
                          max={28}
                          value={[layout.typography?.sectionNameSize || 20]}
                          onValueChange={(value) => updateTypography({ sectionNameSize: value[0] })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Symbol: {layout.typography?.symbolSize || 16}</Label>
                        <Slider
                          min={12}
                          max={20}
                          value={[layout.typography?.symbolSize || 16]}
                          onValueChange={(value) => updateTypography({ symbolSize: value[0] })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Instrument Label: {layout.typography?.instrumentLabelSize || 14}</Label>
                        <Slider
                          min={10}
                          max={18}
                          value={[layout.typography?.instrumentLabelSize || 14]}
                          onValueChange={(value) => updateTypography({ instrumentLabelSize: value[0] })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Show/Hide Options */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Show/Hide Elements</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showTitle"
                          checked={layout.showTitle !== false}
                          onCheckedChange={() => toggleOption('showTitle')}
                        />
                        <Label htmlFor="showTitle" className="text-sm cursor-pointer">Title & Tempo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showSectionMetadata"
                          checked={layout.showSectionMetadata !== false}
                          onCheckedChange={() => toggleOption('showSectionMetadata')}
                        />
                        <Label htmlFor="showSectionMetadata" className="text-sm cursor-pointer">Section Metadata</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showSectionNotes"
                          checked={layout.showSectionNotes !== false}
                          onCheckedChange={() => toggleOption('showSectionNotes')}
                        />
                        <Label htmlFor="showSectionNotes" className="text-sm cursor-pointer">Section Notes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showBarNumbers"
                          checked={layout.showBarNumbers !== false}
                          onCheckedChange={() => toggleOption('showBarNumbers')}
                        />
                        <Label htmlFor="showBarNumbers" className="text-sm cursor-pointer">Bar Numbers</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showBeatNumbers"
                          checked={layout.showBeatNumbers !== false}
                          onCheckedChange={() => toggleOption('showBeatNumbers')}
                        />
                        <Label htmlFor="showBeatNumbers" className="text-sm cursor-pointer">Beat Numbers (1.1, 1.2...)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showInstrumentLabels"
                          checked={layout.showInstrumentLabels !== false}
                          onCheckedChange={() => toggleOption('showInstrumentLabels')}
                        />
                        <Label htmlFor="showInstrumentLabels" className="text-sm cursor-pointer">Instrument Labels</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showLegend"
                          checked={layout.showLegend !== false}
                          onCheckedChange={() => toggleOption('showLegend')}
                        />
                        <Label htmlFor="showLegend" className="text-sm cursor-pointer">Symbol Legend</Label>
                      </div>
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className="space-y-3">
                    <Label htmlFor="fontFamily" className="text-sm font-medium">
                      Font Family
                    </Label>
                    <Select
                      value={layout.typography?.fontFamily || 'Arial, sans-serif'}
                      onValueChange={(value) => updateTypography({ fontFamily: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                        <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                        <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                        <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Right Column - Preview */}
          <div className="flex-1 flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h3 className="text-sm font-medium">Preview</h3>
              <div className="flex items-center gap-4">
                {/* Page Navigation */}
                {previewPages.length > 1 && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewPage(Math.max(0, previewPage - 1))}
                      disabled={previewPage === 0}
                      className="h-8 px-2"
                    >
                      ←
                    </Button>
                    <span className="whitespace-nowrap">
                      Page {previewPage + 1} of {previewPages.length}
                      {exportConfig.scope === 'full' && state.project.sections && (
                        <span className="ml-2 text-gray-500">
                          ({Object.values(state.project.sections)[previewPage]?.name || 'Section'})
                        </span>
                      )}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewPage(Math.min(previewPages.length - 1, previewPage + 1))}
                      disabled={previewPage === previewPages.length - 1}
                      className="h-8 px-2"
                    >
                      →
                    </Button>
                  </div>
                )}

                {/* Zoom Control */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-600">Zoom:</Label>
                  {isEditingZoom ? (
                    <Input
                      ref={zoomInputRef}
                      type="text"
                      value={customZoomInput}
                      onChange={(e) => setCustomZoomInput(e.target.value)}
                      onKeyDown={handleZoomInputKeyDown}
                      onBlur={handleZoomInputBlur}
                      className="h-8 w-20 text-xs text-center"
                      placeholder="100"
                    />
                  ) : (
                    <Select value={zoomLevel} onValueChange={handleZoomChange}>
                      <SelectTrigger
                        className="h-8 w-28 text-xs"
                        onDoubleClick={handleZoomDoubleClick}
                      >
                        <SelectValue>
                          {zoomLevel === 'fit' ? 'Fit to View' : `${zoomLevel}%`}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Fit to View</SelectItem>
                        <SelectItem value="25">25%</SelectItem>
                        <SelectItem value="50">50%</SelectItem>
                        <SelectItem value="75">75%</SelectItem>
                        <SelectItem value="100">100%</SelectItem>
                        <SelectItem value="125">125%</SelectItem>
                        <SelectItem value="150">150%</SelectItem>
                        <SelectItem value="175">175%</SelectItem>
                        <SelectItem value="200">200%</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-daw-bg-primary rounded-lg overflow-auto">
              <div className="py-8 px-4 flex justify-center items-start min-h-full">
                {isGeneratingPreview ? (
                  <div className="flex flex-col items-center justify-center h-40 space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div className="text-sm text-gray-500">Generating preview...</div>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Paper Shadow */}
                    <div
                      className="absolute inset-0 bg-gray-400 rounded-sm"
                      style={{
                        transform: 'translate(4px, 4px)',
                        zIndex: -1
                      }}
                    />

                    {/* Paper */}
                    <div
                      className="bg-white shadow-lg relative"
                      style={{
                        transform: `scale(${getFitScale()})`,
                        transformOrigin: 'top center',
                        aspectRatio: exportConfig.orientation === 'portrait'
                          ? `${pageSizes[exportConfig.pageSize || 'A4'].width}/${pageSizes[exportConfig.pageSize || 'A4'].height}`
                          : `${pageSizes[exportConfig.pageSize || 'A4'].height}/${pageSizes[exportConfig.pageSize || 'A4'].width}`,
                        width: exportConfig.orientation === 'portrait' ? '650px' : '920px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px'
                      }}
                    >
                      {/* Paper size indicator */}
                      <div className="absolute -top-6 left-0 text-xs text-gray-500 font-medium">
                        {exportConfig.pageSize || 'A4'} ({exportConfig.orientation || 'portrait'})
                      </div>

                      {/* Content */}
                      <div
                        ref={previewRef}
                        className="w-full h-full overflow-hidden relative"
                      >
                        <ExportView
                          sectionId={exportConfig.scope === 'full' ?
                            Object.keys(state.project.sections || {})[previewPage] :
                            undefined
                          }
                          beatUnitWidth={layout.beatUnitWidth || 140}
                          instrumentLabelWidth={layout.instrumentLabelWidth || 80}
                          stepGap={layout.stepGap || 2}
                          rowSpacing={layout.rowSpacing || 12}
                          pageWidth={getPageWidthPx()}
                          pageHeight={getPageHeightPx()}
                          currentPage={previewPage}
                        />
                      </div>

                      {/* Margin indicators */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div
                          className="absolute border border-dashed border-gray-300 opacity-50"
                          style={{
                            top: `${(layout.margins?.top || 20) * 3.78}px`,  // mm to px conversion
                            left: `${(layout.margins?.left || 15) * 3.78}px`,
                            right: `${(layout.margins?.right || 15) * 3.78}px`,
                            bottom: `${(layout.margins?.bottom || 20) * 3.78}px`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isExporting ? 'Exporting...' : `Export ${exportConfig.format?.toUpperCase() || 'PDF'}`}
          </Button>
        </DialogFooter>

        {/* Hidden clean export view for generating exports */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div ref={cleanExportRef}>
            <ExportView
              beatUnitWidth={layout.beatUnitWidth || 140}
              instrumentLabelWidth={layout.instrumentLabelWidth || 80}
              stepGap={layout.stepGap || 2}
              rowSpacing={layout.rowSpacing || 12}
              pageWidth={getPageWidthPx()}
              pageHeight={getPageHeightPx()}
              exportMode={true}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ExportModal
