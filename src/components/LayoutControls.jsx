import React from 'react'
import { useAppState } from '../contexts/AppContext'

export default function LayoutControls() {
  const { state, dispatch } = useAppState()
  const { layout } = state
  
  const handleLayoutChange = (field, value) => {
    dispatch({
      type: 'UPDATE_LAYOUT',
      payload: { [field]: value }
    })
  }
  
  return (
    <div className="px-4 py-2 border-t border-daw-border">
      <div className="flex items-center gap-4">
        <span className="text-xs text-daw-text-secondary font-semibold">Layout:</span>
        
        <div className="flex items-center gap-2">
          <label className="text-xs text-daw-text-dim">Page:</label>
          <select
            value={layout.pageSize}
            onChange={(e) => handleLayoutChange('pageSize', e.target.value)}
            className="bg-daw-bg-panel text-daw-text-primary text-xs px-2 py-1 rounded border border-daw-border focus:border-daw-accent focus:outline-none"
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs text-daw-text-dim">Orientation:</label>
          <select
            value={layout.orientation}
            onChange={(e) => handleLayoutChange('orientation', e.target.value)}
            className="bg-daw-bg-panel text-daw-text-primary text-xs px-2 py-1 rounded border border-daw-border focus:border-daw-accent focus:outline-none"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs text-daw-text-dim">Scale:</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={layout.textScale}
            onChange={(e) => handleLayoutChange('textScale', parseFloat(e.target.value))}
            className="w-20"
          />
          <span className="text-xs text-daw-text-secondary">{layout.textScale.toFixed(1)}x</span>
        </div>
        
        <div className="border-l border-daw-border h-4 mx-1" />
        
        <label className="flex items-center gap-1 text-xs text-daw-text-primary">
          <input
            type="checkbox"
            checked={layout.showBarNumbers}
            onChange={(e) => handleLayoutChange('showBarNumbers', e.target.checked)}
            className="rounded w-3 h-3"
          />
          Bar Numbers
        </label>
        
        <label className="flex items-center gap-1 text-xs text-daw-text-primary">
          <input
            type="checkbox"
            checked={layout.showBeatNumbers}
            onChange={(e) => handleLayoutChange('showBeatNumbers', e.target.checked)}
            className="rounded w-3 h-3"
          />
          Beat Numbers
        </label>
        
        <label className="flex items-center gap-1 text-xs text-daw-text-primary">
          <input
            type="checkbox"
            checked={layout.showLegend}
            onChange={(e) => handleLayoutChange('showLegend', e.target.checked)}
            className="rounded w-3 h-3"
          />
          Legend
        </label>
      </div>
    </div>
  )
}