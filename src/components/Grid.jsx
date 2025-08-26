import React from 'react'
import { useAppState } from '../contexts/AppContext'

export default function Grid({ interaction }) {
  const { state, dispatch } = useAppState()
  const section = state.project.sections[state.project.currentSection]
  
  if (!section) return null
  
  const { instruments, grid } = section
  const totalSteps = grid.bars * grid.beats * grid.subdivisions
  
  // Use interaction hook if provided, otherwise fallback to basic click handler
  const handleStepClick = interaction ? 
    (instrumentId, position, event) => {
      interaction.handleCellMouseDown(instrumentId, position, event)
    } : 
    (instrumentId, position) => {
      const instrument = instruments.find(i => i.id === instrumentId)
      const hasNote = instrument?.pattern.some(n => n.position === position)
      
      if (hasNote) {
        dispatch({
          type: 'REMOVE_NOTE',
          payload: { instrumentId, position }
        })
      } else {
        dispatch({
          type: 'ADD_NOTE',
          payload: {
            instrumentId,
            position,
            symbol: state.ui.activeSymbol,
            modifier: state.ui.activeModifier
          }
        })
      }
    }
  
  const handleStepMouseEnter = interaction ? 
    (instrumentId, position, event) => {
      interaction.handleCellMouseEnter(instrumentId, position, event)
    } : null
    
  const handleStepDoubleClick = interaction ?
    (instrumentId, position) => {
      interaction.handleDoubleClick(instrumentId, position)
    } : null
  
  const renderBarGroup = (barStart, barEnd) => {
    return (
      <div key={`bars-${barStart}-${barEnd}`} className="bg-slate-800/50 p-4 rounded-lg">
        <h3 className="text-cyan-400 font-bold mb-3">
          Bars {barStart + 1}-{barEnd + 1}
        </h3>
        
        <div className="overflow-x-auto">
          <table className="drum-grid">
            <thead>
              <tr>
                <th className="text-gray-400 text-sm w-24">Instrument</th>
                {Array.from({ length: (barEnd - barStart + 1) * grid.beats * grid.subdivisions }, (_, i) => {
                  const stepInGroup = i
                  const beat = Math.floor(stepInGroup / grid.subdivisions) % grid.beats
                  const subdivision = stepInGroup % grid.subdivisions
                  const bar = barStart + Math.floor(stepInGroup / (grid.beats * grid.subdivisions))
                  
                  return (
                    <th key={i} className="text-gray-500 text-xs px-1">
                      {subdivision === 0 ? `${bar + 1}.${beat + 1}` : ''}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {instruments.map(instrument => (
                <tr key={instrument.id}>
                  <td className="text-white font-medium pr-4">{instrument.name}</td>
                  {Array.from({ length: (barEnd - barStart + 1) * grid.beats * grid.subdivisions }, (_, i) => {
                    const globalPosition = barStart * grid.beats * grid.subdivisions + i
                    const note = instrument.pattern.find(n => n.position === globalPosition)
                    const isSelected = state.ui.selectedSteps.has(`${instrument.id}-${globalPosition}`)
                    
                    return (
                      <td
                        key={i}
                        className={`step-cell border border-slate-600 w-8 h-8 text-center cursor-pointer hover:bg-slate-700 ${
                          note ? 'bg-cyan-900' : ''
                        } ${isSelected ? 'ring-2 ring-cyan-400' : ''}`}
                        onMouseDown={(e) => handleStepClick(instrument.id, globalPosition, e)}
                        onMouseEnter={handleStepMouseEnter ? (e) => handleStepMouseEnter(instrument.id, globalPosition, e) : undefined}
                        onDoubleClick={handleStepDoubleClick ? () => handleStepDoubleClick(instrument.id, globalPosition) : undefined}
                      >
                        {note ? note.symbol : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Render bar groups (e.g., Bars 1-2, Bars 3-4) */}
      {grid.bars >= 2 && renderBarGroup(0, 1)}
      {grid.bars >= 4 && renderBarGroup(2, 3)}
      {grid.bars > 4 && 
        Array.from({ length: Math.ceil((grid.bars - 4) / 2) }, (_, i) => {
          const start = 4 + i * 2
          const end = Math.min(start + 1, grid.bars - 1)
          return renderBarGroup(start, end)
        })
      }
    </div>
  )
}