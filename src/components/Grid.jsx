import React, { useState, useRef } from 'react'
import { useAppState } from '../contexts/AppContext'
import BeatAnchor from './BeatAnchor'
import SubdivisionStep from './SubdivisionStep'
import StepEditModal from './StepEditModal'
import BarRangeSelector from './BarRangeSelector'
import EditableText from './EditableText'
import InstrumentSettings from './InstrumentSettings'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { SortableInstrument } from './SortableInstrument'

// Constants for fixed layout
const BEAT_UNIT_WIDTH = 140  // Total width for beat anchor + subdivisions
const BEAT_ANCHOR_WIDTH = 40  // Width of the beat anchor box
const GAP_AFTER_ANCHOR = 8  // Gap between anchor and subdivisions (gap-2 = 8px)
const SUBDIVISION_AREA_WIDTH = BEAT_UNIT_WIDTH - BEAT_ANCHOR_WIDTH - GAP_AFTER_ANCHOR
const STEP_GAP = 2  // Gap between subdivision steps (gap-0.5 = 2px)

export default function Grid({ interaction }) {
  const { state, dispatch } = useAppState()
  const [showSubdivisionModal, setShowSubdivisionModal] = useState(null)
  const [showInstrumentSettings, setShowInstrumentSettings] = useState(null)
  const section = state.project.sections[state.project.currentSection]
  // Multiple bar ranges for line breaks
  const [barRanges, setBarRanges] = useState(() => {
    if (!section) return [{ start: 1, end: 1 }]
    const bars = section.grid.bars
    // Default: all bars on one line
    return [{ start: 1, end: bars }]
  })
  
  if (!section) return null
  
  const { instruments, grid } = section
  const beatSubdivisions = grid.beatSubdivisions || Array(grid.bars * grid.beats).fill(grid.subdivisions || 4)
  
  // Update barRanges when grid.bars changes
  React.useEffect(() => {
    setBarRanges(prevRanges => {
      // If bars changed, adjust ranges
      const lastRange = prevRanges[prevRanges.length - 1]
      if (lastRange && lastRange.end > grid.bars) {
        // Adjust the last range to not exceed bar count
        const updatedRanges = [...prevRanges]
        updatedRanges[updatedRanges.length - 1] = {
          ...lastRange,
          end: grid.bars
        }
        // Remove any ranges that are now invalid
        return updatedRanges.filter(range => range.start <= grid.bars)
      }
      // If no ranges or bars increased, ensure we cover all bars
      if (prevRanges.length === 0) {
        return [{ start: 1, end: grid.bars }]
      }
      const lastEnd = prevRanges[prevRanges.length - 1].end
      if (lastEnd < grid.bars) {
        // Add a new range for the additional bars
        return [...prevRanges, { start: lastEnd + 1, end: grid.bars }]
      }
      return prevRanges
    })
  }, [grid.bars])
  
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
    console.log('Opening subdivision modal for beat index:', beatIndex)
    setShowSubdivisionModal(beatIndex)
  }

  const handleInstrumentNameChange = (instrumentId, newName) => {
    dispatch({ 
      type: 'UPDATE_INSTRUMENT_NAME', 
      payload: { 
        instrumentId, 
        name: newName 
      } 
    })
  }
  
  const handleToggleInstrument = (instrumentId) => {
    dispatch({
      type: 'TOGGLE_INSTRUMENT_VISIBILITY',
      payload: { instrumentId }
    })
  }
  
  const handleUpdateInstrumentSettings = (instrumentId, settings) => {
    dispatch({
      type: 'UPDATE_INSTRUMENT_SETTINGS',
      payload: { instrumentId, settings }
    })
  }
  
  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const handleDragEnd = (event) => {
    const { active, over } = event
    
    if (active.id !== over.id) {
      const oldIndex = instruments.findIndex(i => i.id === active.id)
      const newIndex = instruments.findIndex(i => i.id === over.id)
      
      dispatch({
        type: 'REORDER_INSTRUMENTS',
        payload: { oldIndex, newIndex }
      })
    }
  }
  
  // Update subdivision count
  const updateSubdivision = (beatIndex, newValue) => {
    console.log('Updating subdivision for beat', beatIndex, 'to', newValue)
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
  
  // Handle bar range changes
  const handleBarRangeChange = (rangeIndex, newEnd) => {
    setBarRanges(prevRanges => {
      const updatedRanges = [...prevRanges]
      const currentRange = updatedRanges[rangeIndex]
      
      // Update the end of the current range
      updatedRanges[rangeIndex] = {
        ...currentRange,
        end: newEnd
      }
      
      // Update all following ranges' start positions
      for (let i = rangeIndex + 1; i < updatedRanges.length; i++) {
        const prevEnd = updatedRanges[i - 1].end
        updatedRanges[i] = {
          start: prevEnd + 1,
          end: Math.max(prevEnd + 1, updatedRanges[i].end)
        }
      }
      
      // If the last range doesn't cover all bars, add a new range
      const lastRange = updatedRanges[updatedRanges.length - 1]
      if (lastRange.end < grid.bars) {
        updatedRanges.push({
          start: lastRange.end + 1,
          end: grid.bars
        })
      }
      
      // Remove empty ranges
      return updatedRanges.filter(range => range.start <= range.end && range.start <= grid.bars)
    })
  }
  
  // Add a new line break
  const handleAddLineBreak = (afterBar) => {
    setBarRanges(prevRanges => {
      // Find which range contains this bar
      const rangeIndex = prevRanges.findIndex(range => 
        range.start <= afterBar && range.end >= afterBar
      )
      
      if (rangeIndex === -1) return prevRanges
      
      const currentRange = prevRanges[rangeIndex]
      if (currentRange.start === afterBar) return prevRanges // Can't split at the start
      
      const newRanges = [...prevRanges]
      
      // Split the current range
      newRanges[rangeIndex] = {
        ...currentRange,
        end: afterBar
      }
      
      // Insert new range
      newRanges.splice(rangeIndex + 1, 0, {
        start: afterBar + 1,
        end: currentRange.end
      })
      
      return newRanges
    })
  }
  
  // Remove a line break
  const handleRemoveLineBreak = (rangeIndex) => {
    if (rangeIndex === 0) return // Can't remove the first range
    
    setBarRanges(prevRanges => {
      if (prevRanges.length <= 1) return prevRanges
      
      const newRanges = [...prevRanges]
      const currentRange = newRanges[rangeIndex]
      const prevRange = newRanges[rangeIndex - 1]
      
      // Merge with previous range
      newRanges[rangeIndex - 1] = {
        ...prevRange,
        end: currentRange.end
      }
      
      // Remove current range
      newRanges.splice(rangeIndex, 1)
      
      return newRanges
    })
  }
  
  // Get bar ranges for rendering (convert to 0-indexed)
  const getBarRangesForRendering = () => {
    return barRanges.map(range => ({
      start: range.start - 1,
      end: range.end - 1
    }))
  }
  
  
  // Render a single beat unit with FIXED width
  const renderBeatUnit = (instrument, barIndex, beatInBar) => {
    const globalBeatIndex = barIndex * grid.beats + beatInBar
    const subdivisionCount = beatSubdivisions[globalBeatIndex] || 4
    const stepWidth = getStepWidth(subdivisionCount)
    const isVisible = instrument.visible !== false
    
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
              
              // Calculate cumulative position for interaction handlers
              let totalPosition = 0
              for (let i = 0; i < globalBeatIndex; i++) {
                totalPosition += beatSubdivisions[i] || 4
              }
              
              return (
                <div
                  key={subdivIndex}
                  style={{ 
                    width: `${stepWidth}px`,
                    flexShrink: 0,
                    pointerEvents: isVisible ? 'auto' : 'none'
                  }}
                >
                  <SubdivisionStep
                    instrumentId={instrument.id}
                    beatIndex={globalBeatIndex}
                    subdivisionIndex={subdivIndex}
                    note={note}
                    isSelected={isSelected}
                    stepIndex={totalPosition + subdivIndex}
                    onMouseDown={interaction?.handleCellMouseDown}
                    onMouseEnter={interaction?.handleCellMouseEnter}
                    onDoubleClick={interaction?.handleDoubleClick}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  
  // Render an instrument row (without individual scroll)
  const renderInstrumentRow = (instrument, dragHandleProps = {}, isDragging = false) => {
    const isVisible = instrument.visible !== false
    
    return (
      <div key={instrument.id} className={`flex items-center gap-2 ${!isVisible ? 'opacity-50' : ''} ${isDragging ? 'opacity-50' : ''}`}>
        {/* Toggle switch */}
        <button
          onClick={() => handleToggleInstrument(instrument.id)}
          className="w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
          style={{
            backgroundColor: isVisible ? '#06b6d4' : '#374151'
          }}
        >
          <div 
            className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200"
            style={{
              transform: isVisible ? 'translateX(26px)' : 'translateX(2px)'
            }}
          />
        </button>
        
        {/* Settings icon (6 dots) - now acts as drag handle */}
        <button
          {...dragHandleProps}
          onClick={(e) => {
            // Only open settings if not dragging
            if (!e.defaultPrevented) {
              setShowInstrumentSettings(instrument)
            }
          }}
          className="p-1 hover:bg-gray-700 rounded transition-colors cursor-grab active:cursor-grabbing"
          title="Drag to reorder / Click for settings"
        >
          <svg className="w-5 h-5 text-gray-400 hover:text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="6" cy="6" r="1.5" />
            <circle cx="10" cy="6" r="1.5" />
            <circle cx="14" cy="6" r="1.5" />
            <circle cx="6" cy="14" r="1.5" />
            <circle cx="10" cy="14" r="1.5" />
            <circle cx="14" cy="14" r="1.5" />
          </svg>
        </button>
        
        {/* Instrument label - fixed position */}
        <div className="w-24 flex-shrink-0">
          <EditableText
            value={instrument.name}
            onSave={(newName) => handleInstrumentNameChange(instrument.id, newName)}
            className="text-sm font-semibold text-cyan-300"
            inputClassName="text-sm font-semibold"
            maxLength={20}
          />
        </div>
        
        {/* Beat sequence - render bars based on ranges */}
        <div className="flex-1">
          {/* This will be rendered differently in the bar group */}
          <div className="bars-container" data-instrument-id={instrument.id}>
            {Array.from({ length: grid.bars }, (_, barIndex) => (
              <div 
                key={barIndex} 
                className="inline-flex items-center gap-0 border-r-2 pr-2 last:border-r-0 border-gray-700/50"
                data-bar-index={barIndex}
              >
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
  
  // Render instruments for a specific bar range
  const renderInstrumentsForRange = (rangeStart, rangeEnd) => {
    return instruments.map((instrument, index) => {
      const isVisible = instrument.visible !== false
      
      return (
        <div 
          key={`${instrument.id}-range-${rangeStart}-${rangeEnd}`}
          className={`flex items-center gap-2 ${!isVisible ? 'opacity-50' : ''}`}
        >
          {/* Only show controls on first line */}
          {rangeStart === 0 && (
            <>
              {/* Toggle switch */}
              <button
                onClick={() => handleToggleInstrument(instrument.id)}
                className="w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                style={{
                  backgroundColor: isVisible ? '#06b6d4' : '#374151'
                }}
              >
                <div 
                  className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200"
                  style={{
                    transform: isVisible ? 'translateX(26px)' : 'translateX(2px)'
                  }}
                />
              </button>
              
              {/* Settings icon */}
              <button
                onClick={() => setShowInstrumentSettings(instrument)}
                className="p-1 hover:bg-gray-700 rounded transition-colors cursor-grab"
                title="Settings"
              >
                <svg className="w-5 h-5 text-gray-400 hover:text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="6" cy="6" r="1.5" />
                  <circle cx="10" cy="6" r="1.5" />
                  <circle cx="14" cy="6" r="1.5" />
                  <circle cx="6" cy="14" r="1.5" />
                  <circle cx="10" cy="14" r="1.5" />
                  <circle cx="14" cy="14" r="1.5" />
                </svg>
              </button>
              
              {/* Instrument label */}
              <div className="w-24 flex-shrink-0">
                <EditableText
                  value={instrument.name}
                  onSave={(newName) => handleInstrumentNameChange(instrument.id, newName)}
                  className="text-sm font-semibold text-cyan-300"
                  inputClassName="text-sm font-semibold"
                  maxLength={20}
                />
              </div>
            </>
          )}
          
          {/* Spacer for continuation lines */}
          {rangeStart > 0 && (
            <div className="w-44 flex-shrink-0" /> 
          )}
          
          {/* Bars for this range */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-0">
              {Array.from({ length: rangeEnd - rangeStart + 1 }, (_, i) => {
                const barIndex = rangeStart + i
                return (
                  <div 
                    key={barIndex} 
                    className="inline-flex items-center gap-0 border-r-2 pr-2 last:border-r-0 border-gray-700/50"
                  >
                    {Array.from({ length: grid.beats }, (_, beatInBar) => 
                      renderBeatUnit(instrument, barIndex, beatInBar)
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    })
  }
  
  // Render bar groups with line breaks
  const renderBarGroup = () => {
    const renderRanges = getBarRangesForRendering()
    
    return (
      <div className="space-y-6">
        {renderRanges.map((range, rangeIndex) => (
          <div 
            key={`range-${rangeIndex}`}
            className="bg-gray-900/30 rounded-xl p-5 border border-cyan-900/30 shadow-lg"
          >
            {/* Range header with controls */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-cyan-400 font-bold text-base flex items-center gap-3">
                <BarRangeSelector 
                  barRange={barRanges[rangeIndex]}
                  totalBars={grid.bars}
                  isFirstRange={rangeIndex === 0}
                  isLastRange={rangeIndex === barRanges.length - 1}
                  previousRangeEnd={rangeIndex > 0 ? barRanges[rangeIndex - 1].end : 0}
                  onRangeChange={(newEnd) => handleBarRangeChange(rangeIndex, newEnd)}
                  onRemove={() => handleRemoveLineBreak(rangeIndex)}
                />
              </h3>
              
            </div>
            
            {/* Instruments for this range */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              <div className="min-w-min space-y-3">
                {rangeIndex === 0 ? (
                  /* First range with drag and drop */
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={instruments.map(i => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {instruments.map((instrument, index) => (
                        <SortableInstrument key={instrument.id} id={instrument.id}>
                          {({ dragHandleProps, isDragging }) => {
                            const isVisible = instrument.visible !== false
                            return (
                              <div 
                                className={`bg-gray-900/40 rounded-lg p-4 hover:bg-gray-900/60 transition-colors border border-gray-800 ${
                                  index < instruments.length - 1 ? 'mb-3' : ''
                                } ${isDragging ? 'opacity-50' : ''}`}
                              >
                                <div className={`flex items-center gap-2 ${!isVisible ? 'opacity-50' : ''}`}>
                                  {/* Toggle switch */}
                                  <button
                                    onClick={() => handleToggleInstrument(instrument.id)}
                                    className="w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                                    style={{
                                      backgroundColor: isVisible ? '#06b6d4' : '#374151'
                                    }}
                                  >
                                    <div 
                                      className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200"
                                      style={{
                                        transform: isVisible ? 'translateX(26px)' : 'translateX(2px)'
                                      }}
                                    />
                                  </button>
                                  
                                  {/* Settings/drag handle */}
                                  <button
                                    {...dragHandleProps}
                                    onClick={(e) => {
                                      if (!e.defaultPrevented) {
                                        setShowInstrumentSettings(instrument)
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-700 rounded transition-colors cursor-grab active:cursor-grabbing"
                                    title="Drag to reorder / Click for settings"
                                  >
                                    <svg className="w-5 h-5 text-gray-400 hover:text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                      <circle cx="6" cy="6" r="1.5" />
                                      <circle cx="10" cy="6" r="1.5" />
                                      <circle cx="14" cy="6" r="1.5" />
                                      <circle cx="6" cy="14" r="1.5" />
                                      <circle cx="10" cy="14" r="1.5" />
                                      <circle cx="14" cy="14" r="1.5" />
                                    </svg>
                                  </button>
                                  
                                  {/* Instrument label */}
                                  <div className="w-24 flex-shrink-0">
                                    <EditableText
                                      value={instrument.name}
                                      onSave={(newName) => handleInstrumentNameChange(instrument.id, newName)}
                                      className="text-sm font-semibold text-cyan-300"
                                      inputClassName="text-sm font-semibold"
                                      maxLength={20}
                                    />
                                  </div>
                                  
                                  {/* Bars for this range */}
                                  <div className="flex-1">
                                    <div className="inline-flex items-center gap-0">
                                      {Array.from({ length: range.end - range.start + 1 }, (_, i) => {
                                        const barIndex = range.start + i
                                        return (
                                          <div 
                                            key={barIndex} 
                                            className="inline-flex items-center gap-0 border-r-2 pr-2 last:border-r-0 border-gray-700/50"
                                          >
                                            {Array.from({ length: grid.beats }, (_, beatInBar) => 
                                              renderBeatUnit(instrument, barIndex, beatInBar)
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          }}
                        </SortableInstrument>
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  /* Continuation ranges without controls */
                  instruments.map((instrument, index) => {
                    const isVisible = instrument.visible !== false
                    return (
                      <div 
                        key={`${instrument.id}-${rangeIndex}`}
                        className={`bg-gray-900/40 rounded-lg p-4 hover:bg-gray-900/60 transition-colors border border-gray-800`}
                      >
                        <div className={`flex items-center gap-2 ${!isVisible ? 'opacity-50' : ''}`}>
                          {/* Spacer to align with first range */}
                          <div className="w-44 flex-shrink-0" />
                          
                          {/* Bars for this range */}
                          <div className="flex-1">
                            <div className="inline-flex items-center gap-0">
                              {Array.from({ length: range.end - range.start + 1 }, (_, i) => {
                                const barIndex = range.start + i
                                return (
                                  <div 
                                    key={barIndex} 
                                    className="inline-flex items-center gap-0 border-r-2 pr-2 last:border-r-0 border-gray-700/50"
                                  >
                                    {Array.from({ length: grid.beats }, (_, beatInBar) => 
                                      renderBeatUnit(instrument, barIndex, beatInBar)
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  // Subdivision modal
  const SubdivisionModal = () => {
    if (showSubdivisionModal === null) return null
    
    const subdivisionOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9]  // Added 5, 7, 9
    const currentValue = beatSubdivisions[showSubdivisionModal] || 4
    console.log('Modal open for beat', showSubdivisionModal, 'current value:', currentValue, 'beatSubdivisions:', beatSubdivisions)
    
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
        {renderBarGroup()}
      </div>
      
      {/* Modals */}
      <StepEditModal />
      <SubdivisionModal />
      
      {/* Instrument Settings Modal */}
      {showInstrumentSettings && (
        <InstrumentSettings
          instrument={showInstrumentSettings}
          onClose={() => setShowInstrumentSettings(null)}
          onUpdate={handleUpdateInstrumentSettings}
          currentSubdivision={showInstrumentSettings.subdivision || 4}
          currentBeats={showInstrumentSettings.beats || grid.beats}
          currentMeasures={showInstrumentSettings.measures || grid.bars}
        />
      )}
    </>
  )
}