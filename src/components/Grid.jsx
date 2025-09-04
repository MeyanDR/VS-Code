import React, { useState } from 'react'
import { useAppState } from '../contexts/AppContext'
import BeatAnchor from './BeatAnchor'
import SubdivisionStep from './SubdivisionStep'
import StepEditModal from './StepEditModal'

// Constants for fixed layout
const BEAT_UNIT_WIDTH = 140  // Total width for beat anchor + subdivisions
const BEAT_ANCHOR_WIDTH = 40  // Width of the beat anchor box
const GAP_AFTER_ANCHOR = 8  // Gap between anchor and subdivisions (gap-2 = 8px)
const SUBDIVISION_AREA_WIDTH = BEAT_UNIT_WIDTH - BEAT_ANCHOR_WIDTH - GAP_AFTER_ANCHOR
const STEP_GAP = 2  // Gap between subdivision steps (gap-0.5 = 2px)

export default function Grid({ interaction }) {
  const { state, dispatch } = useAppState()
  const [showSubdivisionModal, setShowSubdivisionModal] = useState(null)
  const section = state.project.sections[state.project.currentSection]
  
  if (!section) return null
  
  const { instruments, grid } = section
  const { beatSubdivisions = Array(grid.bars * grid.beats).fill(grid.subdivisions || 4) } = grid
  
  // Get note at specific beat and subdivision
  const getNoteAt = (instrument, beatIndex, subdivisionIndex) => {
    return instrument.pattern.find(note => {
      // Support both old and new formats
      if (note.beatIndex !== undefined && note.subdivision !== undefined) {
        return note.beatIndex === beatIndex && note.subdivision === subdivisionIndex
      }
      // Calculate from old position format
      let position = 0
      for (let i = 0; i < beatIndex; i++) {
        position += beatSubdivisions[i] || 4
      }
      position += subdivisionIndex
      return note.position === position
    })
  }
  
  // Check if a position is selected
  const isPositionSelected = (instrumentId, beatIndex, subdivisionIndex) => {
    // Calculate position for selection tracking
    let position = 0
    for (let i = 0; i < beatIndex; i++) {
      position += beatSubdivisions[i] || 4
    }
    position += subdivisionIndex
    return state.ui.selectedSteps.has(`${instrumentId}-${position}`)
  }
  
  // Handle subdivision change
  const handleSubdivisionChange = (beatIndex) => {
    setShowSubdivisionModal(beatIndex)
  }
  
  // Update subdivision count
  const updateSubdivision = (beatIndex, newValue) => {
    dispatch({
      type: 'UPDATE_BEAT_SUBDIVISION',
      payload: {
        beatIndex,
        subdivision: newValue
      }
    })
    setShowSubdivisionModal(null)
  }
  
  // Calculate step width based on subdivision count, accounting for gaps
  const getStepWidth = (subdivisionCount) => {
    if (subdivisionCount === 1) {
      // Single subdivision fills entire area
      return SUBDIVISION_AREA_WIDTH
    }
    // Account for gaps between steps
    const totalGaps = (subdivisionCount - 1) * STEP_GAP
    const availableWidth = SUBDIVISION_AREA_WIDTH - totalGaps
    return Math.floor(availableWidth / subdivisionCount)
  }
  
  // Render a single beat unit with FIXED width
  const renderBeatUnit = (instrument, barIndex, beatInBar) => {
    const globalBeatIndex = barIndex * grid.beats + beatInBar
    const subdivisionCount = beatSubdivisions[globalBeatIndex] || 4
    const stepWidth = getStepWidth(subdivisionCount)
    
    return (
      <div 
        key={`${barIndex}-${beatInBar}`} 
        className="inline-block"
        style={{ width: `${BEAT_UNIT_WIDTH}px` }}
      >
        <div className="flex items-center h-8">
          {/* Beat anchor - fixed width */}
          <div style={{ width: `${BEAT_ANCHOR_WIDTH}px`, flexShrink: 0 }}>
            <BeatAnchor
              barIndex={barIndex}
              beatInBar={beatInBar}
              globalBeatIndex={globalBeatIndex}
              onSubdivisionChange={handleSubdivisionChange}
            />
          </div>
          
          {/* Subdivision steps container with fixed width and proper spacing */}
          <div 
            className="ml-2 flex items-center"
            style={{ 
              width: `${SUBDIVISION_AREA_WIDTH}px`,
              gap: subdivisionCount > 1 ? `${STEP_GAP}px` : 0
            }}
          >
            {Array.from({ length: subdivisionCount }, (_, subdivIndex) => {
              const note = getNoteAt(instrument, globalBeatIndex, subdivIndex)
              const isSelected = isPositionSelected(instrument.id, globalBeatIndex, subdivIndex)
              
              return (
                <div
                  key={subdivIndex}
                  style={{ 
                    width: `${stepWidth}px`,
                    flexShrink: 0
                  }}
                >
                  <SubdivisionStep
                    instrumentId={instrument.id}
                    beatIndex={globalBeatIndex}
                    subdivisionIndex={subdivIndex}
                    note={note}
                    isSelected={isSelected}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  
  // Render an instrument row
  const renderInstrumentRow = (instrument) => {
    return (
      <div key={instrument.id} className="flex items-center gap-4 bg-gray-900/40 rounded-lg p-4 hover:bg-gray-900/60 transition-colors border border-gray-800">
        {/* Instrument label */}
        <div className="w-28 flex-shrink-0">
          <span className="text-sm font-semibold text-cyan-300">{instrument.name}</span>
        </div>
        
        {/* Beat sequence with horizontal scroll */}
        <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <div className="inline-flex items-center gap-0">
            {Array.from({ length: grid.bars }, (_, barIndex) => (
              <div key={barIndex} className="inline-flex items-center gap-0 border-r-2 border-gray-700/50 pr-2 last:border-r-0">
                {Array.from({ length: grid.beats }, (_, beatInBar) => 
                  renderBeatUnit(instrument, barIndex, beatInBar)
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  // Render bar groups
  const renderBarGroup = (barStart, barEnd) => {
    const barsInGroup = []
    for (let i = barStart; i <= barEnd; i++) {
      if (i < grid.bars) {
        barsInGroup.push(i)
      }
    }
    
    if (barsInGroup.length === 0) return null
    
    return (
      <div key={`bars-${barStart}-${barEnd}`} className="bg-gray-900/30 rounded-xl p-5 mb-4 border border-cyan-900/30 shadow-lg">
        <h3 className="text-cyan-400 font-bold text-base mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
          Bars {barStart + 1}-{Math.min(barEnd + 1, grid.bars)}
        </h3>
        
        <div className="space-y-3">
          {instruments.map(instrument => renderInstrumentRow(instrument))}
        </div>
      </div>
    )
  }
  
  // Subdivision modal
  const SubdivisionModal = () => {
    if (showSubdivisionModal === null) return null
    
    const subdivisionOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9]  // Added 5, 7, 9
    const currentValue = beatSubdivisions[showSubdivisionModal] || 4
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setShowSubdivisionModal(null)}
      >
        <div 
          className="bg-daw-bg-panel border border-cyan-500 rounded-lg p-4 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-cyan-400 font-semibold text-sm mb-3">Select Subdivision</h3>
          <div className="grid grid-cols-3 gap-2">
            {subdivisionOptions.map(option => (
              <button
                key={option}
                className={`
                  w-12 h-12 rounded border-2 font-mono text-sm font-bold
                  transition-all duration-150
                  ${option === currentValue
                    ? 'bg-cyan-600 border-cyan-400 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-cyan-500'
                  }
                `}
                onClick={() => updateSubdivision(showSubdivisionModal, option)}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            onClick={() => setShowSubdivisionModal(null)}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <>
      <div className="space-y-4">
        {/* Group bars for better organization */}
        {grid.bars >= 2 && renderBarGroup(0, 1)}
        {grid.bars >= 4 && renderBarGroup(2, 3)}
        {grid.bars > 4 && 
          Array.from({ length: Math.ceil((grid.bars - 4) / 2) }, (_, i) => {
            const start = 4 + i * 2
            const end = start + 1
            return renderBarGroup(start, end)
          })
        }
        {grid.bars === 1 && renderBarGroup(0, 0)}
        {grid.bars === 3 && renderBarGroup(2, 2)}
      </div>
      
      {/* Modals */}
      <StepEditModal />
      <SubdivisionModal />
    </>
  )
}