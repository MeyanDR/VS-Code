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
    <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg border border-slate-700 mt-3">
      <h3 className="text-cyan-400 font-bold mb-4">Layout Settings</h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-gray-300 text-sm block mb-1">Page Size</label>
          <select
            value={layout.pageSize}
            onChange={(e) => handleLayoutChange('pageSize', e.target.value)}
            className="w-full bg-slate-700 text-white px-3 py-2 rounded"
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
          </select>
        </div>
        
        <div>
          <label className="text-gray-300 text-sm block mb-1">Orientation</label>
          <select
            value={layout.orientation}
            onChange={(e) => handleLayoutChange('orientation', e.target.value)}
            className="w-full bg-slate-700 text-white px-3 py-2 rounded"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
        
        <div>
          <label className="text-gray-300 text-sm block mb-1">Text Scale</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={layout.textScale}
            onChange={(e) => handleLayoutChange('textScale', parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-gray-400 text-xs">{layout.textScale.toFixed(1)}x</span>
        </div>
      </div>
      
      <div className="flex gap-4 mt-4">
        <label className="flex items-center gap-2 text-gray-300">
          <input
            type="checkbox"
            checked={layout.showBarNumbers}
            onChange={(e) => handleLayoutChange('showBarNumbers', e.target.checked)}
            className="rounded"
          />
          Show Bar Numbers
        </label>
        
        <label className="flex items-center gap-2 text-gray-300">
          <input
            type="checkbox"
            checked={layout.showBeatNumbers}
            onChange={(e) => handleLayoutChange('showBeatNumbers', e.target.checked)}
            className="rounded"
          />
          Show Beat Numbers
        </label>
        
        <label className="flex items-center gap-2 text-gray-300">
          <input
            type="checkbox"
            checked={layout.showLegend}
            onChange={(e) => handleLayoutChange('showLegend', e.target.checked)}
            className="rounded"
          />
          Show Legend
        </label>
      </div>
    </div>
  )
}