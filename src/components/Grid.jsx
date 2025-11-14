import React, { useState, useRef } from 'react'
import { useAppState } from '../contexts/AppContext'
import BeatAnchor from './BeatAnchor'
import SubdivisionStep from './SubdivisionStep'
import StepEditModal from './StepEditModal'
import BarRangeSelector from './BarRangeSelector'
import EditableText from './EditableText'
import InstrumentSettings from './InstrumentSettings'
import GroupBrace from './GroupBrace'
import GroupControls from './GroupControls'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { SortableInstrument } from './SortableInstrument'
import { makeStepKey } from '../lib/selection'
import { TrashIcon, GearIcon } from '@radix-ui/react-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'

// Constants for fixed layout
const BEAT_UNIT_WIDTH = 180  // Total width for beat anchor + subdivisions (increased for better step sizes)
const BEAT_ANCHOR_WIDTH = 36  // Width of the beat anchor box (reduced from 40)
const GAP_AFTER_ANCHOR = 12  // Gap between anchor and subdivisions (increased to prevent overlap)
const SUBDIVISION_AREA_WIDTH = BEAT_UNIT_WIDTH - BEAT_ANCHOR_WIDTH - GAP_AFTER_ANCHOR
const STEP_GAP = 2  // Gap between subdivision steps (gap-0.5 = 2px)

export default function Grid({ interaction }) {
  const { state, dispatch } = useAppState()
  const [showSubdivisionModal, setShowSubdivisionModal] = useState(null)
  const [showInstrumentSettings, setShowInstrumentSettings] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [instrumentToDelete, setInstrumentToDelete] = useState(null)
  const section = state.project.sections[state.project.currentSection]
  // Multiple bar ranges for line breaks
  const [barRanges, setBarRanges] = useState(() => {
    if (!section) return [{ start: 1, end: 1 }]
    const bars = section.grid.bars
    // Default: all bars on one line
    return [{ start: 1, end: bars }]
  })
  
  if (!section) return null
  
  const { instruments, grid, groups = [] } = section
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
    return instrument.pattern.find(note =>
      note.beatIndex === beatIndex && note.subdivision === subdivisionIndex
    )
  }

  // Helper: Get nested subdivision count for a given path
  const getNestedSubdivision = (instrument, beatIndex, subdivisionPath) => {
    if (!instrument.nestedSubdivisions) return null

    const beatKey = `${beatIndex}`
    const beatData = instrument.nestedSubdivisions[beatKey]
    if (!beatData) return null

    const pathKey = Array.isArray(subdivisionPath)
      ? subdivisionPath.join('-')
      : `${subdivisionPath}`

    return beatData[pathKey] || null
  }

  // Helper: Get note at nested path
  const getNoteAtNested = (instrument, beatIndex, subdivisionPath) => {
    return instrument.pattern.find(note => {
      if (note.beatIndex !== beatIndex) return false

      if (Array.isArray(note.subdivision) && Array.isArray(subdivisionPath)) {
        return JSON.stringify(note.subdivision) === JSON.stringify(subdivisionPath)
      }

      return note.subdivision === subdivisionPath
    })
  }

  // Check if a position is selected
  const isPositionSelected = (instrumentId, beatIndex, subdivisionIndex) => {
    // Use makeStepKey to properly handle both flat and nested subdivisions
    const selectionKey = makeStepKey(instrumentId, beatIndex, subdivisionIndex)
    return state.ui.selectedSteps.has(selectionKey)
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
    console.log('🔧 [DEBUG] Updating instrument settings:', { instrumentId, settings })
    dispatch({
      type: 'UPDATE_INSTRUMENT_SETTINGS',
      payload: { instrumentId, settings }
    })
  }
  
  const handleCreateGroup = (instrumentIds) => {
    dispatch({
      type: 'CREATE_GROUP',
      payload: { instrumentIds }
    })
  }
  
  const handleAddToGroup = (groupId, instrumentId) => {
    dispatch({
      type: 'ADD_INSTRUMENT_TO_GROUP',
      payload: { groupId, instrumentId }
    })
  }
  
  const handleUngroup = (groupId) => {
    dispatch({
      type: 'UNGROUP',
      payload: { groupId }
    })
  }
  
  const handleToggleGroupCollapse = (groupId) => {
    dispatch({
      type: 'TOGGLE_GROUP_COLLAPSE',
      payload: { groupId }
    })
  }
  
  const handleUpdateGroupName = (groupId, name) => {
    dispatch({
      type: 'UPDATE_GROUP_NAME',
      payload: { groupId, name }
    })
  }

  const handleDeleteInstrumentClick = (instrument) => {
    setInstrumentToDelete(instrument)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (instrumentToDelete) {
      dispatch({
        type: 'DELETE_INSTRUMENT',
        payload: instrumentToDelete.id
      })
    }
    setDeleteConfirmOpen(false)
    setInstrumentToDelete(null)
  }

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false)
    setInstrumentToDelete(null)
  }

  // Helper to check if instrument is in a group
  const getInstrumentGroup = (instrumentId) => {
    return groups.find(g => g.instrumentIds.includes(instrumentId))
  }
  
  // Helper to check if instrument should be visible based on group collapse
  const isInstrumentVisibleInGroup = (instrument) => {
    const group = getInstrumentGroup(instrument.id)
    if (!group) return true
    if (group.collapsed) {
      // Only show first instrument in collapsed group
      return group.instrumentIds[0] === instrument.id
    }
    return true
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
    // Keep using section grid for layout consistency, but use instrument subdivision
    const globalBeatIndex = barIndex * grid.beats + beatInBar
    
    // Use beat-specific subdivision first, then instrument default, then global default
    const subdivisionCount = beatSubdivisions[globalBeatIndex] || instrument.subdivision || 4
    const stepWidth = getStepWidth(subdivisionCount)
    const isVisible = instrument.visible !== false
    
    // DEBUG: Log subdivision priority
    if (beatSubdivisions[globalBeatIndex] || instrument.subdivision) {
      console.log('✅ [DEBUG] Subdivision priority:', {
        instrumentId: instrument.id,
        instrumentName: instrument.name,
        'beatSubdivisions[globalBeatIndex]': beatSubdivisions[globalBeatIndex],
        'instrument.subdivision': instrument.subdivision,
        'final subdivisionCount': subdivisionCount,
        'source': beatSubdivisions[globalBeatIndex] ? 'beat-specific' : 'instrument-default',
        'globalBeatIndex': globalBeatIndex
      })
    }
    
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
                    onMouseDown={interaction?.handleCellMouseDown}
                    onMouseEnter={interaction?.handleCellMouseEnter}
                    onDoubleClick={interaction?.handleDoubleClick}
                    nestedSubdivisions={getNestedSubdivision(instrument, globalBeatIndex, subdivIndex)}
                    getNestedSubdivisionFn={getNestedSubdivision}
                    getNoteAtFn={getNoteAtNested}
                    isSelectedFn={isPositionSelected}
                    stepPath={[]}
                    width={stepWidth}
                    height={32}
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
          className="w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
          style={{
            backgroundColor: isVisible ? '#06b6d4' : '#374151'
          }}
        >
          <div 
            className="w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-200"
            style={{
              transform: isVisible ? 'translateX(18px)' : 'translateX(2px)'
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
        <div className="w-20 flex-shrink-0">
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
                className="w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                style={{
                  backgroundColor: isVisible ? '#06b6d4' : '#374151'
                }}
              >
                <div 
                  className="w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-200"
                  style={{
                    transform: isVisible ? 'translateX(18px)' : 'translateX(2px)'
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
              <div className="w-20 flex-shrink-0">
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
            <div className="w-40 flex-shrink-0" /> 
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
            className="bg-gray-900/30 rounded-xl py-5 px-1 border border-cyan-900/30 shadow-lg"
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
              <div className="space-y-3 pr-20" style={{ minWidth: `${BEAT_UNIT_WIDTH * (range.end - range.start + 1) * grid.beats}px` }}>
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
                      {(() => {
                        const processedIds = new Set()
                        
                        return instruments.map((instrument, index) => {
                          // Skip if already processed as part of a group
                          if (processedIds.has(instrument.id)) return null
                          
                          const group = getInstrumentGroup(instrument.id)
                          const nextInstrument = instruments[index + 1]
                          const canCreateGroupWithNext = !group && nextInstrument && !getInstrumentGroup(nextInstrument.id)
                          
                          if (group) {
                            // Mark all group members as processed
                            group.instrumentIds.forEach(id => processedIds.add(id))
                            
                            // Get all instruments in this group
                            const groupInstruments = instruments.filter(i => 
                              group.instrumentIds.includes(i.id)
                            )
                            
                            // Calculate group height for brace
                            const groupHeight = group.collapsed 
                              ? 80 
                              : groupInstruments.length * 80 + (groupInstruments.length - 1) * 12
                            
                            return (
                              <React.Fragment key={`group-${group.id}`}>
                                {/* Group controls above instruments */}
                                <div className="mb-2">
                                  <div className="inline-flex items-center gap-1 bg-gray-800/95 backdrop-blur-sm rounded-md px-2 py-1 border border-cyan-400/30 shadow-lg">
                                    {/* Group name */}
                                    <EditableText
                                      value={group.name}
                                      onSave={(newName) => handleUpdateGroupName(group.id, newName)}
                                      className="text-xs font-medium text-cyan-400 leading-none min-w-0"
                                      inputClassName="text-xs font-medium w-20 bg-transparent border-none text-cyan-400"
                                      maxLength={15}
                                    />
                                    
                                    {/* Collapse/Expand button */}
                                    <button
                                      onClick={() => handleToggleGroupCollapse(group.id)}
                                      className="text-gray-400 hover:text-cyan-400 transition-colors p-0.5 rounded hover:bg-gray-800/50"
                                      title={group.collapsed ? "Expand group" : "Collapse group"}
                                    >
                                      <svg 
                                        className={`w-3 h-3 transition-transform duration-200 ${group.collapsed ? 'rotate-0' : 'rotate-90'}`}
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                      >
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                    
                                    {/* Ungroup button */}
                                    <button
                                      onClick={() => handleUngroup(group.id)}
                                      className="text-gray-500 hover:text-red-400 transition-colors p-0.5 rounded hover:bg-red-900/20"
                                      title="Ungroup instruments"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Render entire group in one container */}
                                <div className="flex items-stretch mb-3 gap-3">
                                  {/* Group indicator on the left */}
                                  <div className="flex-shrink-0 flex items-center pt-4">
                                    <GroupBrace
                                      height={groupHeight}
                                    />
                                  </div>
                                
                                  {/* Stack of grouped instruments */}
                                  <div className="flex-1 space-y-3">
                                    {(group.collapsed ? [groupInstruments[0]] : groupInstruments).map(groupInstrument => {
                                      const isVisible = groupInstrument.visible !== false
                                      
                                      return (
                                        <SortableInstrument key={groupInstrument.id} id={groupInstrument.id}>
                                          {({ dragHandleProps, isDragging }) => (
                                            <div 
                                              className={`bg-gray-900/40 rounded-lg p-4 hover:bg-gray-900/60 transition-colors border
                                                border-cyan-600/30 bg-cyan-900/5 shadow-lg shadow-cyan-900/10
                                                ${isDragging ? 'opacity-50' : ''}
                                              `}
                                            >
                                              <div className={`${!isVisible ? 'opacity-50' : ''}`}>
                                                {/* Instrument name above the beat sequence */}
                                                <div className="mb-3 flex items-center gap-2">
                                                  {/* Toggle switch */}
                                                  <button
                                                    onClick={() => handleToggleInstrument(groupInstrument.id)}
                                                    className="w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                                                    style={{
                                                      backgroundColor: isVisible ? '#06b6d4' : '#374151'
                                                    }}
                                                  >
                                                    <div 
                                                      className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200"
                                                      style={{
                                                        transform: isVisible ? 'translateX(20px)' : 'translateX(2px)'
                                                      }}
                                                    />
                                                  </button>
                                                  
                                                  {/* Settings/drag handle with dropdown */}
                                                  <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                      <button
                                                        {...dragHandleProps}
                                                        className="p-1 hover:bg-gray-700 rounded transition-colors cursor-grab active:cursor-grabbing"
                                                        title="Drag to reorder / Click for menu"
                                                      >
                                                        <svg className="w-6 h-6 text-gray-400 hover:text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                                          <circle cx="6" cy="6" r="1.5" />
                                                          <circle cx="10" cy="6" r="1.5" />
                                                          <circle cx="14" cy="6" r="1.5" />
                                                          <circle cx="6" cy="14" r="1.5" />
                                                          <circle cx="10" cy="14" r="1.5" />
                                                          <circle cx="14" cy="14" r="1.5" />
                                                        </svg>
                                                      </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start">
                                                      <DropdownMenuItem
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          setShowInstrumentSettings(groupInstrument)
                                                        }}
                                                      >
                                                        <GearIcon className="mr-2 h-3 w-3" />
                                                        Settings
                                                      </DropdownMenuItem>
                                                      <DropdownMenuSeparator />
                                                      <DropdownMenuItem
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          handleDeleteInstrumentClick(groupInstrument)
                                                        }}
                                                        className="text-red-400 focus:text-red-400"
                                                      >
                                                        <TrashIcon className="mr-2 h-3 w-3" />
                                                        Delete
                                                      </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>
                                                  
                                                  {/* Instrument label - now as header */}
                                                  <div className="flex-1">
                                                    <EditableText
                                                      value={groupInstrument.name}
                                                      onSave={(newName) => handleInstrumentNameChange(groupInstrument.id, newName)}
                                                      className="text-base font-semibold text-cyan-300"
                                                      inputClassName="text-base font-semibold"
                                                      maxLength={20}
                                                    />
                                                  </div>
                                                </div>
                                                
                                                {/* Bars for this range - full width */}
                                                <div className="w-full">
                                                  <div className="inline-flex items-center gap-0">
                                                    {Array.from({ length: range.end - range.start + 1 }, (_, i) => {
                                                      const barIndex = range.start + i
                                                      return (
                                                        <div 
                                                          key={barIndex} 
                                                          className="inline-flex items-center gap-0 border-r-2 pr-2 last:border-r-0 border-gray-700/50"
                                                        >
                                                          {Array.from({ length: grid.beats }, (_, beatInBar) => 
                                                            renderBeatUnit(groupInstrument, barIndex, beatInBar)
                                                          )}
                                                        </div>
                                                      )
                                                    })}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </SortableInstrument>
                                      )
                                    })}
                                  </div>
                                </div>
                                
                                {/* Add to group button after group if next instrument can be added */}
                                {(() => {
                                  // Find the next instrument after this group
                                  const lastGroupMemberIndex = instruments.findIndex(i => 
                                    i.id === group.instrumentIds[group.instrumentIds.length - 1]
                                  )
                                  const nextInstrument = instruments[lastGroupMemberIndex + 1]
                                  const canAddToGroup = nextInstrument && !getInstrumentGroup(nextInstrument.id)
                                  
                                  if (canAddToGroup) {
                                    return (
                                      <div className="flex items-center gap-2 pl-4 py-1">
                                        {/* Spacer to align with toggle + settings buttons */}
                                        <div className="w-8" />
                                        <div className="w-5" />
                                        {/* Group button positioned where instrument name would be */}
                                        <div className="w-20 flex-shrink-0 flex justify-center">
                                          <GroupControls
                                            mode="add"
                                            onAddToGroup={handleAddToGroup}
                                            groupId={group.id}
                                            instrumentToAdd={nextInstrument.id}
                                          />
                                        </div>
                                      </div>
                                    )
                                  }
                                  return null
                                })()}
                              </React.Fragment>
                            )
                          }
                          
                          // Non-grouped instrument - render normally
                          processedIds.add(instrument.id)
                          
                          return (
                            <React.Fragment key={instrument.id}>
                              <SortableInstrument id={instrument.id}>
                                {({ dragHandleProps, isDragging }) => {
                                  const isVisible = instrument.visible !== false
                                  
                                  return (
                                    <div className="mb-3">
                                      <div 
                                        className={`bg-gray-900/40 rounded-lg p-4 hover:bg-gray-900/60 transition-colors border
                                          border-gray-800
                                          ${isDragging ? 'opacity-50' : ''}
                                        `}
                                      >
                                        <div className={`${!isVisible ? 'opacity-50' : ''}`}>
                                          {/* Instrument name above the beat sequence */}
                                          <div className="mb-3 flex items-center gap-2">
                                            {/* Toggle switch */}
                                            <button
                                              onClick={() => handleToggleInstrument(instrument.id)}
                                              className="w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                                              style={{
                                                backgroundColor: isVisible ? '#06b6d4' : '#374151'
                                              }}
                                            >
                                              <div 
                                                className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200"
                                                style={{
                                                  transform: isVisible ? 'translateX(20px)' : 'translateX(2px)'
                                                }}
                                              />
                                            </button>
                                            
                                            {/* Settings/drag handle with dropdown */}
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <button
                                                  {...dragHandleProps}
                                                  className="p-1 hover:bg-gray-700 rounded transition-colors cursor-grab active:cursor-grabbing"
                                                  title="Drag to reorder / Click for menu"
                                                >
                                                  <svg className="w-6 h-6 text-gray-400 hover:text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <circle cx="6" cy="6" r="1.5" />
                                                    <circle cx="10" cy="6" r="1.5" />
                                                    <circle cx="14" cy="6" r="1.5" />
                                                    <circle cx="6" cy="14" r="1.5" />
                                                    <circle cx="10" cy="14" r="1.5" />
                                                    <circle cx="14" cy="14" r="1.5" />
                                                  </svg>
                                                </button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="start">
                                                <DropdownMenuItem
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    setShowInstrumentSettings(instrument)
                                                  }}
                                                >
                                                  <GearIcon className="mr-2 h-3 w-3" />
                                                  Settings
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteInstrumentClick(instrument)
                                                  }}
                                                  className="text-red-400 focus:text-red-400"
                                                >
                                                  <TrashIcon className="mr-2 h-3 w-3" />
                                                  Delete
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                            
                                            {/* Instrument label - now as header */}
                                            <div className="flex-1">
                                              <EditableText
                                                value={instrument.name}
                                                onSave={(newName) => handleInstrumentNameChange(instrument.id, newName)}
                                                className="text-base font-semibold text-cyan-300"
                                                inputClassName="text-base font-semibold"
                                                maxLength={20}
                                              />
                                            </div>
                                          </div>
                                          
                                          {/* Bars for this range - full width */}
                                          <div className="w-full">
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
                                    </div>
                                  )
                                }}
                              </SortableInstrument>
                              
                              {/* Group creation button between instruments */}
                              {canCreateGroupWithNext && (
                                <div className="flex items-center gap-2 pl-4 py-1">
                                  {/* Spacer to align with toggle + settings buttons */}
                                  <div className="w-8" />
                                  <div className="w-5" />
                                  {/* Group button positioned where instrument name would be */}
                                  <div className="w-20 flex-shrink-0 flex justify-center">
                                    <GroupControls
                                      onCreateGroup={handleCreateGroup}
                                      instrumentAboveId={instrument.id}
                                      instrumentBelowId={nextInstrument.id}
                                    />
                                  </div>
                                </div>
                              )}
                            </React.Fragment>
                          )
                        })
                      })()}
                    </SortableContext>
                  </DndContext>
                ) : (
                  /* Continuation ranges without controls */
                  instruments.map((instrument, index) => {
                    const isVisible = instrument.visible !== false
                    const shouldShowInstrument = isInstrumentVisibleInGroup(instrument)
                    const group = getInstrumentGroup(instrument.id)
                    
                    if (!shouldShowInstrument) return null
                    
                    return (
                      <div 
                        key={`${instrument.id}-${rangeIndex}`}
                        className={`bg-gray-900/40 rounded-lg p-4 hover:bg-gray-900/60 transition-colors border ${
                          group ? 'border-cyan-600/30 ml-12 bg-cyan-900/5' : 'border-gray-800'
                        }`}
                      >
                        <div className={`${!isVisible ? 'opacity-50' : ''}`}>
                          {/* For continuation lines, just show the beat sequence without controls */}
                          <div className="w-full">
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
      <div
        id="drum-grid"
        className="space-y-4"
        style={{
          transform: `scale(${state.ui.gridScale})`,
          transformOrigin: 'top left'
        }}
      >
        {renderBarGroup()}
      </div>

      {/* Modals */}
      <StepEditModal />
      <SubdivisionModal />

      {/* Instrument Settings Modal */}
      {showInstrumentSettings && (
        <InstrumentSettings
          instrument={instruments.find(i => i.id === showInstrumentSettings.id) || showInstrumentSettings}
          onClose={() => setShowInstrumentSettings(null)}
          onUpdate={handleUpdateInstrumentSettings}
          currentSubdivision={showInstrumentSettings.subdivision || 4}
          currentBeats={showInstrumentSettings.beats || grid.beats}
          currentMeasures={showInstrumentSettings.measures || grid.bars}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Instrument</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{instrumentToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}