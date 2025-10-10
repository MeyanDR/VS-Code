import React, { useState } from 'react'

const InstrumentSettings = ({ 
  instrument, 
  onClose, 
  onUpdate,
  currentSubdivision,
  currentBeats,
  currentMeasures
}) => {
  const [settings, setSettings] = useState({
    subdivision: currentSubdivision || 4,
    beats: currentBeats || 4,
    measures: currentMeasures || 4
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate(instrument.id, settings)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-cyan-300">
            {instrument.name} Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subdivision
            </label>
            <select
              value={settings.subdivision}
              onChange={(e) => setSettings({ ...settings, subdivision: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-cyan-400 focus:outline-none"
            >
              <option value="1">Whole</option>
              <option value="2">Half</option>
              <option value="3">Triplet</option>
              <option value="4">Quarter</option>
              <option value="5">Quintuplet</option>
              <option value="6">Sextuplet</option>
              <option value="7">Septuplet</option>
              <option value="8">Eighth</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Beats per Measure
            </label>
            <input
              type="number"
              min="1"
              max="16"
              value={settings.beats}
              onChange={(e) => setSettings({ ...settings, beats: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Measures
            </label>
            <input
              type="number"
              min="1"
              max="32"
              value={settings.measures}
              onChange={(e) => setSettings({ ...settings, measures: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 transition-colors"
            >
              Save Settings
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InstrumentSettings