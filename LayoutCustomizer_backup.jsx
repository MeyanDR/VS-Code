import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Slider } from './ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Separator } from './ui/separator'
import { RotateCcw, Monitor, Settings, Resize, FileText } from 'lucide-react'

const defaultConfig = {
  pageSize: 'A4',
  orientation: 'portrait',
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
  spacing: { elements: 8, lines: 12, sections: 24 },
  typography: { scale: 1, lineHeight: 1.2 },
  elementSizes: {
    beatAnchor: { width: 40, height: 32 },
    subdivision: { width: 32, height: 48 },
    gap: { anchor: 8, subdivision: 2, bar: 8 },
    instrument: { labelWidth: 96, rowHeight: 56 }
  },
  breaks: {
    autoBreaks: true,
    barsPerLine: 4,
    linesPerPage: 4
  }
}

export default function LayoutCustomizer({ 
  isOpen, 
  onClose, 
  onApply, 
  initialConfig = defaultConfig 
}) {
  const [config, setConfig] = useState(() => ({
    ...defaultConfig,
    ...initialConfig,
    // Ensure new properties are preserved with deep merge
    elementSizes: {
      ...defaultConfig.elementSizes,
      ...(initialConfig.elementSizes || {})
    },
    breaks: {
      ...defaultConfig.breaks,
      ...(initialConfig.breaks || {})
    }
  }))

  const updateConfig = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }


  const handleReset = () => {
    setConfig(defaultConfig)
  }

  const handleApply = () => {
    onApply(config)
    onClose()
  }

  const handleCancel = () => {
    setConfig({
      ...defaultConfig,
      ...initialConfig,
      // Ensure new properties are preserved with deep merge
      elementSizes: {
        ...defaultConfig.elementSizes,
        ...(initialConfig.elementSizes || {})
      },
      breaks: {
        ...defaultConfig.breaks,
        ...(initialConfig.breaks || {})
      }
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Layout Customizer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Page Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-daw-text-primary flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Page Settings
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pageSize">Page Size</Label>
                <Select 
                  value={config.pageSize} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, pageSize: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select page size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                    <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
                    <SelectItem value="Legal">Legal (8.5 × 14 in)</SelectItem>
                    <SelectItem value="A3">A3 (297 × 420 mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select 
                  value={config.orientation} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, orientation: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select orientation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Margins */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-daw-text-primary">Margins (mm)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Top</Label>
                    <span className="text-xs text-daw-text-secondary">{config.margins.top}mm</span>
                  </div>
                  <Slider
                    value={[config.margins.top]}
                    onValueChange={([value]) => updateConfig('margins', 'top', value)}
                    max={50}
                    min={5}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Bottom</Label>
                    <span className="text-xs text-daw-text-secondary">{config.margins.bottom}mm</span>
                  </div>
                  <Slider
                    value={[config.margins.bottom]}
                    onValueChange={([value]) => updateConfig('margins', 'bottom', value)}
                    max={50}
                    min={5}
                    step={1}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Left</Label>
                    <span className="text-xs text-daw-text-secondary">{config.margins.left}mm</span>
                  </div>
                  <Slider
                    value={[config.margins.left]}
                    onValueChange={([value]) => updateConfig('margins', 'left', value)}
                    max={50}
                    min={5}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Right</Label>
                    <span className="text-xs text-daw-text-secondary">{config.margins.right}mm</span>
                  </div>
                  <Slider
                    value={[config.margins.right]}
                    onValueChange={([value]) => updateConfig('margins', 'right', value)}
                    max={50}
                    min={5}
                    step={1}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Layout Controls */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-daw-text-primary">Layout Spacing</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Element Spacing</Label>
                  <span className="text-xs text-daw-text-secondary">{config.spacing.elements}px</span>
                </div>
                <Slider
                  value={[config.spacing.elements]}
                  onValueChange={([value]) => updateConfig('spacing', 'elements', value)}
                  max={20}
                  min={2}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Line Spacing</Label>
                  <span className="text-xs text-daw-text-secondary">{config.spacing.lines}px</span>
                </div>
                <Slider
                  value={[config.spacing.lines]}
                  onValueChange={([value]) => updateConfig('spacing', 'lines', value)}
                  max={30}
                  min={4}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Section Spacing</Label>
                  <span className="text-xs text-daw-text-secondary">{config.spacing.sections}px</span>
                </div>
                <Slider
                  value={[config.spacing.sections]}
                  onValueChange={([value]) => updateConfig('spacing', 'sections', value)}
                  max={50}
                  min={8}
                  step={2}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Typography */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-daw-text-primary">Typography</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Font Scale</Label>
                  <span className="text-xs text-daw-text-secondary">{config.typography.scale.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[config.typography.scale]}
                  onValueChange={([value]) => updateConfig('typography', 'scale', value)}
                  max={2}
                  min={0.5}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Line Height</Label>
                  <span className="text-xs text-daw-text-secondary">{config.typography.lineHeight.toFixed(1)}</span>
                </div>
                <Slider
                  value={[config.typography.lineHeight]}
                  onValueChange={([value]) => updateConfig('typography', 'lineHeight', value)}
                  max={2}
                  min={0.8}
                  step={0.1}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Element Sizes */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-daw-text-primary flex items-center gap-2">
              <Resize className="w-4 h-4" />
              Element Sizes
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Beat Anchor Width</Label>
                  <span className="text-xs text-daw-text-secondary">{config.elementSizes.beatAnchor.width}px</span>
                </div>
                <Slider
                  value={[config.elementSizes.beatAnchor.width]}
                  onValueChange={([value]) => setConfig(prev => ({
                    ...prev,
                    elementSizes: {
                      ...prev.elementSizes,
                      beatAnchor: { ...prev.elementSizes.beatAnchor, width: value }
                    }
                  }))}
                  max={80}
                  min={20}
                  step={2}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Beat Anchor Height</Label>
                  <span className="text-xs text-daw-text-secondary">{config.elementSizes.beatAnchor.height}px</span>
                </div>
                <Slider
                  value={[config.elementSizes.beatAnchor.height]}
                  onValueChange={([value]) => setConfig(prev => ({
                    ...prev,
                    elementSizes: {
                      ...prev.elementSizes,
                      beatAnchor: { ...prev.elementSizes.beatAnchor, height: value }
                    }
                  }))}
                  max={60}
                  min={16}
                  step={2}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Subdivision Width</Label>
                  <span className="text-xs text-daw-text-secondary">{config.elementSizes.subdivision.width}px</span>
                </div>
                <Slider
                  value={[config.elementSizes.subdivision.width]}
                  onValueChange={([value]) => setConfig(prev => ({
                    ...prev,
                    elementSizes: {
                      ...prev.elementSizes,
                      subdivision: { ...prev.elementSizes.subdivision, width: value }
                    }
                  }))}
                  max={60}
                  min={16}
                  step={2}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Row Height</Label>
                  <span className="text-xs text-daw-text-secondary">{config.elementSizes.instrument.rowHeight}px</span>
                </div>
                <Slider
                  value={[config.elementSizes.instrument.rowHeight]}
                  onValueChange={([value]) => setConfig(prev => ({
                    ...prev,
                    elementSizes: {
                      ...prev.elementSizes,
                      instrument: { ...prev.elementSizes.instrument, rowHeight: value }
                    }
                  }))}
                  max={100}
                  min={30}
                  step={2}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Break Management */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-daw-text-primary flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Page Layout
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Auto Page Breaks</Label>
                  <button
                    onClick={() => updateConfig('breaks', 'autoBreaks', !config.breaks.autoBreaks)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      config.breaks.autoBreaks ? 'bg-daw-accent' : 'bg-daw-bg-secondary'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      config.breaks.autoBreaks ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <p className="text-xs text-daw-text-secondary">
                  Automatically insert page and line breaks based on layout settings
                </p>
              </div>

              {config.breaks.autoBreaks && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Bars per Line</Label>
                      <span className="text-xs text-daw-text-secondary">{config.breaks.barsPerLine}</span>
                    </div>
                    <Slider
                      value={[config.breaks.barsPerLine]}
                      onValueChange={([value]) => updateConfig('breaks', 'barsPerLine', value)}
                      max={8}
                      min={2}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Lines per Page</Label>
                      <span className="text-xs text-daw-text-secondary">{config.breaks.linesPerPage}</span>
                    </div>
                    <Slider
                      value={[config.breaks.linesPerPage]}
                      onValueChange={([value]) => updateConfig('breaks', 'linesPerPage', value)}
                      max={8}
                      min={2}
                      step={1}
                    />
                  </div>
                </>
              )}
            </div>
          </div>


          {/* Mini Preview */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-daw-text-primary">Preview</h3>
            <div className="bg-daw-bg-secondary rounded border p-4 h-32 flex items-center justify-center">
              <div 
                className="bg-white border border-gray-300 shadow-sm"
                style={{
                  width: config.orientation === 'portrait' ? '60px' : '80px',
                  height: config.orientation === 'portrait' ? '80px' : '60px',
                  padding: `${Math.max(2, config.margins.top / 10)}px ${Math.max(2, config.margins.right / 10)}px ${Math.max(2, config.margins.bottom / 10)}px ${Math.max(2, config.margins.left / 10)}px`
                }}
              >
                <div className="space-y-1">
                  <div 
                    className="bg-gray-800 rounded"
                    style={{ 
                      height: `${Math.max(1, config.spacing.elements / 4)}px`,
                      marginBottom: `${Math.max(1, config.spacing.lines / 6)}px`
                    }}
                  />
                  <div 
                    className="bg-gray-600 rounded"
                    style={{ 
                      height: `${Math.max(1, config.spacing.elements / 4)}px`,
                      width: '80%'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleReset} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </Button>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply}>
            Apply Layout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}