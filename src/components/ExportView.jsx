import React from 'react'
import { useAppState } from '../contexts/AppContext'

const ExportView = ({ sectionId = null, renderMode = 'full' }) => {
  const { state } = useAppState()
  
  // Get the section to export (current or specific)
  const section = sectionId 
    ? state.project?.sections?.[sectionId]
    : state.project?.sections?.[state.project?.currentSection]
    
  if (!section) return null
  
  // Get instruments from the section
  const instruments = section.instruments || []
  const grid = section.grid || { bars: 4, beats: 4, subdivisions: 4 }
  const beatSubdivisions = grid.beatSubdivisions || Array(grid.bars * grid.beats).fill(grid.subdivisions)
  
  // Get all available symbols and modifiers from state
  const availableSymbols = state.ui?.availableSymbols || []
  const symbolsMap = {}
  availableSymbols.forEach(sym => {
    symbolsMap[sym.value] = sym
  })
  
  // Collect used symbols
  const usedSymbols = new Set()
  instruments.forEach(inst => {
    if (inst.pattern) {
      inst.pattern.forEach(note => {
        if (note.symbol && note.symbol !== '/' && note.symbol !== '') {
          usedSymbols.add(note.symbol)
        }
      })
    }
  })
  
  // Calculate total beats and bars
  const totalBeats = grid.bars * grid.beats
  const groups = section.groups || []
  
  const renderBar = (instrument, barIndex) => {
    const startBeat = barIndex * grid.beats
    const endBeat = Math.min(startBeat + grid.beats, totalBeats)
    
    return (
      <div className="bar" key={`${instrument.id}-bar-${barIndex}`}>
        <div className="bar-number">{barIndex + 1}</div>
        <div className="beats">
          {Array.from({ length: endBeat - startBeat }, (_, beatOffset) => {
            const beatIndex = startBeat + beatOffset
            const subdivisions = beatSubdivisions[beatIndex] || grid.subdivisions
            
            return (
              <div key={`beat-${beatIndex}`} className="beat-group">
                {Array.from({ length: subdivisions }, (_, subdivision) => {
                  // Find note at this position
                  const note = instrument.pattern?.find(n => 
                    n.beatIndex === beatIndex && n.subdivision === subdivision
                  )
                  
                  return (
                    <div 
                      key={`${beatIndex}-${subdivision}`} 
                      className={`export-step ${subdivision === 0 ? 'beat-marker' : ''}`}
                    >
                      {note && note.symbol && note.symbol !== '/' ? (
                        <span className="symbol">
                          {note.symbol}
                        </span>
                      ) : (
                        <span className="empty-step">·</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  
  return (
    <div id="export-view" className="export-container">
      {/* Header */}
      <div className="export-header">
        <h1 className="export-title">
          {state.project?.name || 'Drum Pattern'}
        </h1>
        <div className="export-metadata">
          <span className="section-name">Section: {section.name || 'Intro'}</span>
          <span className="time-sig">
            {grid.bars} bars × {grid.beats} beats
          </span>
        </div>
      </div>
      
      {/* Pattern Grid */}
      <div className="export-pattern">
        {/* Group instruments */}
        {groups.length > 0 ? (
          groups.map(group => {
            // Get instruments in this group
            const groupInstruments = instruments.filter(inst => 
              inst.groupId === group.id
            )
            
            if (groupInstruments.length === 0) return null
            
            return (
              <div key={group.id} className="instrument-group">
                <div className="group-header">
                  <span className="group-name">{group.name}</span>
                </div>
                {groupInstruments.map(instrument => (
                  <div key={instrument.id} className="instrument-row">
                    <div className="instrument-label">
                      <span className="instrument-name">{instrument.name}</span>
                    </div>
                    <div className="bars">
                      {Array.from({ length: grid.bars }, (_, i) => 
                        renderBar(instrument, i)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })
        ) : null}
        
        {/* Ungrouped instruments */}
        {instruments.filter(inst => !inst.groupId).map(instrument => (
          <div key={instrument.id} className="instrument-row">
            <div className="instrument-label">
              <span className="instrument-name">{instrument.name}</span>
            </div>
            <div className="bars">
              {Array.from({ length: grid.bars }, (_, i) => 
                renderBar(instrument, i)
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      {usedSymbols.size > 0 && (
        <div className="export-legend">
          <h3>Legend:</h3>
          <div className="legend-items">
            {Array.from(usedSymbols).map(symbol => {
              const symbolData = symbolsMap[symbol]
              if (!symbolData) return null
              
              return (
                <div key={symbol} className="legend-item">
                  <span className="legend-symbol">{symbolData.display || symbol}</span>
                  <span className="legend-label">
                    {symbolData.label || symbolData.description || symbol}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      <style>{`
        .export-container {
          background: white;
          color: black;
          padding: 40px;
          font-family: 'Arial', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .export-header {
          margin-bottom: 30px;
          border-bottom: 2px solid black;
          padding-bottom: 15px;
        }
        
        .export-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .export-metadata {
          display: flex;
          gap: 20px;
          font-size: 14px;
        }
        
        .export-pattern {
          margin-bottom: 30px;
        }
        
        .instrument-group {
          margin-bottom: 20px;
        }
        
        .group-header {
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .instrument-row {
          display: flex;
          margin-bottom: 15px;
          align-items: center;
        }
        
        .instrument-label {
          width: 150px;
          padding-right: 20px;
          font-size: 14px;
        }
        
        .instrument-name {
          font-weight: bold;
          display: block;
        }
        
        .instrument-notation {
          font-size: 12px;
          color: #666;
        }
        
        .bars {
          display: flex;
          gap: 20px;
          flex: 1;
        }
        
        .bar {
          display: flex;
          border: 1px solid #ccc;
          position: relative;
        }
        
        .bar-number {
          position: absolute;
          top: -20px;
          left: 5px;
          font-size: 11px;
          color: #666;
        }
        
        .beats {
          display: flex;
          padding: 5px;
          gap: 4px;
        }
        
        .beat-group {
          display: flex;
          border-right: 1px solid #999;
          padding-right: 2px;
        }
        
        .beat-group:last-child {
          border-right: none;
        }
        
        .export-step {
          width: 20px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        
        .export-step.beat-marker {
          padding-left: 2px;
        }
        
        .note-symbols {
          font-weight: bold;
        }
        
        .empty-step {
          color: #ddd;
        }
        
        .export-legend {
          border-top: 1px solid #ccc;
          padding-top: 20px;
          margin-top: 30px;
        }
        
        .export-legend h3 {
          font-size: 16px;
          margin-bottom: 10px;
        }
        
        .legend-items {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }
        
        .legend-symbol {
          font-weight: bold;
          font-size: 16px;
          min-width: 20px;
        }
        
        .legend-desc {
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}

export default ExportView