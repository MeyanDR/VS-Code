import React, { useState } from 'react'
import { useAppState } from '../contexts/AppContext'

export default function SubdivisionSelector({ beatIndex, currentSubdivision }) {
  const { dispatch } = useAppState()
  const [showPopup, setShowPopup] = useState(false)
  
  const subdivisionOptions = [1, 2, 3, 4, 6, 8]
  
  const handleSubdivisionChange = (newSubdivision) => {
    dispatch({
      type: 'UPDATE_BEAT_SUBDIVISION',
      payload: {
        beatIndex,
        subdivision: newSubdivision
      }
    })
    setShowPopup(false)
  }
  
  return (
    <div className="relative inline-block">
      <button
        className="w-5 h-5 border border-cyan-400 bg-daw-bg-secondary hover:bg-cyan-900 text-cyan-400 text-xs font-mono flex items-center justify-center transition-colors cursor-pointer"
        onClick={() => setShowPopup(!showPopup)}
        title={`Beat subdivision: ${currentSubdivision}`}
      >
        {currentSubdivision}
      </button>
      
      {showPopup && (
        <div className="absolute z-50 top-6 left-0 bg-daw-bg-panel border border-daw-border rounded-md shadow-lg">
          <div className="p-2">
            <div className="text-xs text-daw-text-secondary mb-2 font-semibold">Subdivisions</div>
            <div className="grid grid-cols-3 gap-1">
              {subdivisionOptions.map(option => (
                <button
                  key={option}
                  className={`w-8 h-8 text-xs font-mono transition-colors ${
                    option === currentSubdivision
                      ? 'bg-cyan-600 text-white'
                      : 'bg-daw-bg-secondary text-daw-text-primary hover:bg-daw-button'
                  } border border-daw-border rounded`}
                  onClick={() => handleSubdivisionChange(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {showPopup && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowPopup(false)}
        />
      )}
    </div>
  )
}