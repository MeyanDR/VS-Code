import React, { useState } from 'react'
import { useAppState } from '../contexts/AppContext'

export default function PatternEditor() {
  const { state, dispatch } = useAppState()
  const [isDragOverSymbols, setIsDragOverSymbols] = useState(false)
  const [isDragOverModifiers, setIsDragOverModifiers] = useState(false)
  const [isDragOverTechnique, setIsDragOverTechnique] = useState(false)
  const [isDragOverEffect, setIsDragOverEffect] = useState(false)
  
  const handlePatternTypeChange = (type) => {
    dispatch({ type: 'SET_PATTERN_TYPE', payload: type })
  }
  
  const handleSymbolChange = (symbol) => {
    dispatch({ type: 'SET_ACTIVE_SYMBOL', payload: symbol })
  }
  
  const handleModifierChange = (modifier) => {
    dispatch({ type: 'SET_ACTIVE_MODIFIER', payload: modifier })
  }
  
  const handleTechniqueChange = (technique) => {
    dispatch({ type: 'SET_ACTIVE_TECHNIQUE', payload: technique })
  }
  
  const handleEffectChange = (effect) => {
    dispatch({ type: 'SET_ACTIVE_EFFECT', payload: effect })
  }
  
  const handleDrop = (e, type) => {
    e.preventDefault()
    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    
    if (type === 'symbol' && data.type === 'symbol') {
      dispatch({ type: 'ADD_AVAILABLE_SYMBOL', payload: { 
        value: data.value, 
        label: data.label, 
        description: data.description 
      }})
    } else if (type === 'articulation' && data.type === 'articulation') {
      dispatch({ type: 'ADD_AVAILABLE_ARTICULATION', payload: { 
        value: data.value, 
        label: data.label, 
        description: data.description 
      }})
    } else if (type === 'technique' && data.type === 'technique') {
      dispatch({ type: 'ADD_AVAILABLE_TECHNIQUE', payload: { 
        value: data.value, 
        label: data.label, 
        description: data.description 
      }})
    } else if (type === 'effect' && data.type === 'effect') {
      dispatch({ type: 'ADD_AVAILABLE_EFFECT', payload: { 
        value: data.value, 
        label: data.label, 
        description: data.description 
      }})
    }
    
    if (type === 'symbol') setIsDragOverSymbols(false)
    if (type === 'articulation') setIsDragOverModifiers(false)
    if (type === 'technique') setIsDragOverTechnique(false)
    if (type === 'effect') setIsDragOverEffect(false)
  }
  
  const handleDragOver = (e) => {
    e.preventDefault()
  }
  
  const handleRemoveSymbol = (symbolValue) => {
    dispatch({ type: 'REMOVE_AVAILABLE_SYMBOL', payload: symbolValue })
  }
  
  const handleRemoveArticulation = (articulationValue) => {
    dispatch({ type: 'REMOVE_AVAILABLE_ARTICULATION', payload: articulationValue })
  }
  
  const handleRemoveTechnique = (techniqueValue) => {
    dispatch({ type: 'REMOVE_AVAILABLE_TECHNIQUE', payload: techniqueValue })
  }
  
  const handleRemoveEffect = (effectValue) => {
    dispatch({ type: 'REMOVE_AVAILABLE_EFFECT', payload: effectValue })
  }
  
  const patternTypes = [
    { value: 'loop', symbol: '∞' },
    { value: 'boundary', symbol: '||' }
  ]
  
  const noteTypes = state.ui.availableSymbols
  const articulationModifiers = state.ui.availableArticulationModifiers
  const techniqueModifiers = state.ui.availableTechniqueModifiers
  const effectModifiers = state.ui.availableEffectModifiers
  
  const activePatternType = state.ui.patternType || 'loop'
  const activeSymbol = state.ui.activeSymbol || 'o'
  const activeModifier = state.ui.activeModifier || ''
  const activeTechnique = state.ui.activeTechnique || ''
  const activeEffect = state.ui.activeEffect || ''
  
  return (
    <div className="bg-daw-bg-secondary rounded-lg p-3 border border-daw-border space-y-4">
      {/* Pattern Type Section */}
      <div>
        <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">Pattern Type</h3>
        <div className="space-y-1.5">
          {patternTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handlePatternTypeChange(type.value)}
              className={`
                flex items-center gap-2 text-xs w-full text-left p-1 rounded transition-all
                ${activePatternType === type.value 
                  ? 'bg-daw-accent/20 text-daw-accent' 
                  : 'text-daw-text-primary hover:bg-daw-button/50'
                }
              `}
            >
              <span className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${activePatternType === type.value 
                  ? 'border-daw-accent' 
                  : 'border-daw-text-secondary'
                }
              `}>
                {activePatternType === type.value && (
                  <span className="w-2 h-2 bg-daw-accent rounded-full"></span>
                )}
              </span>
              <span className="font-bold w-5 text-center">{type.symbol}</span>
              <span>{type.value === 'loop' ? 'Loop' : 'Boundary'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Note Type Section */}
      <div
        onDrop={(e) => handleDrop(e, 'symbol')}
        onDragOver={handleDragOver}
        onDragEnter={() => setIsDragOverSymbols(true)}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOverSymbols(false)
          }
        }}
        className={`
          p-2 rounded-lg transition-all
          ${isDragOverSymbols 
            ? 'bg-daw-accent/10 border-2 border-daw-accent border-dashed' 
            : 'border-2 border-transparent'
          }
        `}
      >
        <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">
          Note Type
          {isDragOverSymbols && <span className="text-daw-accent ml-2">Drop symbol here</span>}
        </h3>
        
        {noteTypes.length === 0 ? (
          <div className="text-xs text-daw-text-dim text-center p-4 border-2 border-dashed border-daw-border rounded">
            Drag symbols from the reference panel to add them here
          </div>
        ) : (
          <div className="space-y-1.5">
            {noteTypes.map((note) => (
              <div key={note.value} className="flex items-center gap-2">
                <button
                  onClick={() => handleSymbolChange(note.value)}
                  className={`
                    flex items-center gap-2 text-xs flex-1 text-left p-1 rounded transition-all
                    ${activeSymbol === note.value 
                      ? 'bg-daw-accent/20 text-daw-accent' 
                      : 'text-daw-text-primary hover:bg-daw-button/50'
                    }
                  `}
                >
                  <span className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${activeSymbol === note.value 
                      ? 'border-daw-accent' 
                      : 'border-daw-text-secondary'
                    }
                  `}>
                    {activeSymbol === note.value && (
                      <span className="w-2 h-2 bg-daw-accent rounded-full"></span>
                    )}
                  </span>
                  <span className="font-bold w-5 text-center">{note.value}</span>
                  <span>{note.label || note.description}</span>
                </button>
                {noteTypes.length > 1 && (
                  <button
                    onClick={() => handleRemoveSymbol(note.value)}
                    className="text-xs text-daw-text-dim hover:text-red-400 px-1"
                    title="Remove symbol"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Articulation Modifier Section */}
      <div
        onDrop={(e) => handleDrop(e, 'articulation')}
        onDragOver={handleDragOver}
        onDragEnter={() => setIsDragOverModifiers(true)}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOverModifiers(false)
          }
        }}
        className={`
          p-2 rounded-lg transition-all
          ${isDragOverModifiers 
            ? 'bg-daw-warning/10 border-2 border-daw-warning border-dashed' 
            : 'border-2 border-transparent'
          }
        `}
      >
        <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">
          Articulation
          {isDragOverModifiers && <span className="text-daw-warning ml-2">Drop articulation here</span>}
        </h3>
        
        {articulationModifiers.length === 0 ? (
          <div className="text-xs text-daw-text-dim text-center p-4 border-2 border-dashed border-daw-border rounded">
            Drag articulation modifiers from the reference panel to add them here
          </div>
        ) : (
          <div className="space-y-1.5">
            {articulationModifiers.map((mod) => (
              <div key={mod.value} className="flex items-center gap-2">
                <button
                  onClick={() => handleModifierChange(mod.value)}
                  className={`
                    flex items-center gap-2 text-xs flex-1 text-left p-1 rounded transition-all
                    ${activeModifier === mod.value 
                      ? 'bg-daw-accent/20 text-daw-accent' 
                      : 'text-daw-text-primary hover:bg-daw-button/50'
                    }
                  `}
                >
                  <span className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${activeModifier === mod.value 
                      ? 'border-daw-accent' 
                      : 'border-daw-text-secondary'
                    }
                  `}>
                    {activeModifier === mod.value && (
                      <span className="w-2 h-2 bg-daw-accent rounded-full"></span>
                    )}
                  </span>
                  <span className="font-bold w-5 text-center">{mod.value || '-'}</span>
                  <span>{mod.label || mod.description}</span>
                </button>
                {articulationModifiers.length > 1 && mod.value !== '' && (
                  <button
                    onClick={() => handleRemoveArticulation(mod.value)}
                    className="text-xs text-daw-text-dim hover:text-red-400 px-1"
                    title="Remove articulation"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Technique Modifier Section */}
      <div
        onDrop={(e) => handleDrop(e, 'technique')}
        onDragOver={handleDragOver}
        onDragEnter={() => setIsDragOverTechnique(true)}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOverTechnique(false)
          }
        }}
        className={`
          p-2 rounded-lg transition-all
          ${isDragOverTechnique 
            ? 'bg-blue-400/10 border-2 border-blue-400 border-dashed' 
            : 'border-2 border-transparent'
          }
        `}
      >
        <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">
          Technique (Below)
          {isDragOverTechnique && <span className="text-blue-400 ml-2">Drop technique here</span>}
        </h3>
        
        {techniqueModifiers.length === 0 ? (
          <div className="text-xs text-daw-text-dim text-center p-4 border-2 border-dashed border-daw-border rounded">
            Drag technique modifiers from the reference panel to add them here
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTechniqueChange('')}
                className={`
                  flex items-center gap-2 text-xs flex-1 text-left p-1 rounded transition-all
                  ${activeTechnique === '' 
                    ? 'bg-daw-accent/20 text-daw-accent' 
                    : 'text-daw-text-primary hover:bg-daw-button/50'
                  }
                `}
              >
                <span className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${activeTechnique === '' 
                    ? 'border-daw-accent' 
                    : 'border-daw-text-secondary'
                  }
                `}>
                  {activeTechnique === '' && (
                    <span className="w-2 h-2 bg-daw-accent rounded-full"></span>
                  )}
                </span>
                <span className="font-bold w-5 text-center text-blue-400">-</span>
                <span>None</span>
              </button>
            </div>
            {techniqueModifiers.map((mod) => (
              <div key={mod.value} className="flex items-center gap-2">
                <button
                  onClick={() => handleTechniqueChange(mod.value)}
                  className={`
                    flex items-center gap-2 text-xs flex-1 text-left p-1 rounded transition-all
                    ${activeTechnique === mod.value 
                      ? 'bg-daw-accent/20 text-daw-accent' 
                      : 'text-daw-text-primary hover:bg-daw-button/50'
                    }
                  `}
                >
                  <span className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${activeTechnique === mod.value 
                      ? 'border-daw-accent' 
                      : 'border-daw-text-secondary'
                    }
                  `}>
                    {activeTechnique === mod.value && (
                      <span className="w-2 h-2 bg-daw-accent rounded-full"></span>
                    )}
                  </span>
                  <span className="font-bold w-5 text-center text-blue-400">{mod.value}</span>
                  <span>{mod.label || mod.description}</span>
                </button>
                <button
                  onClick={() => handleRemoveTechnique(mod.value)}
                  className="text-xs text-daw-text-dim hover:text-red-400 px-1"
                  title="Remove technique"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Effect Modifier Section */}
      <div
        onDrop={(e) => handleDrop(e, 'effect')}
        onDragOver={handleDragOver}
        onDragEnter={() => setIsDragOverEffect(true)}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOverEffect(false)
          }
        }}
        className={`
          p-2 rounded-lg transition-all
          ${isDragOverEffect 
            ? 'bg-green-400/10 border-2 border-green-400 border-dashed' 
            : 'border-2 border-transparent'
          }
        `}
      >
        <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">
          Effects (Above)
          {isDragOverEffect && <span className="text-green-400 ml-2">Drop effect here</span>}
        </h3>
        
        {effectModifiers.length === 0 ? (
          <div className="text-xs text-daw-text-dim text-center p-4 border-2 border-dashed border-daw-border rounded">
            Drag effect modifiers from the reference panel to add them here
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEffectChange('')}
                className={`
                  flex items-center gap-2 text-xs flex-1 text-left p-1 rounded transition-all
                  ${activeEffect === '' 
                    ? 'bg-daw-accent/20 text-daw-accent' 
                    : 'text-daw-text-primary hover:bg-daw-button/50'
                  }
                `}
              >
                <span className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${activeEffect === '' 
                    ? 'border-daw-accent' 
                    : 'border-daw-text-secondary'
                  }
                `}>
                  {activeEffect === '' && (
                    <span className="w-2 h-2 bg-daw-accent rounded-full"></span>
                  )}
                </span>
                <span className="font-bold w-5 text-center text-green-400">-</span>
                <span>None</span>
              </button>
            </div>
            {effectModifiers.map((mod) => (
              <div key={mod.value} className="flex items-center gap-2">
                <button
                  onClick={() => handleEffectChange(mod.value)}
                  className={`
                    flex items-center gap-2 text-xs flex-1 text-left p-1 rounded transition-all
                    ${activeEffect === mod.value 
                      ? 'bg-daw-accent/20 text-daw-accent' 
                      : 'text-daw-text-primary hover:bg-daw-button/50'
                    }
                  `}
                >
                  <span className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${activeEffect === mod.value 
                      ? 'border-daw-accent' 
                      : 'border-daw-text-secondary'
                    }
                  `}>
                    {activeEffect === mod.value && (
                      <span className="w-2 h-2 bg-daw-accent rounded-full"></span>
                    )}
                  </span>
                  <span className="font-bold w-5 text-center text-green-400">{mod.value}</span>
                  <span>{mod.label || mod.description}</span>
                </button>
                <button
                  onClick={() => handleRemoveEffect(mod.value)}
                  className="text-xs text-daw-text-dim hover:text-red-400 px-1"
                  title="Remove effect"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Section */}
      <div>
        <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">Preview</h3>
        <div className="p-4 bg-daw-bg-panel rounded border border-daw-border">
          <div className="flex flex-col items-center justify-center space-y-1">
            {/* Effect (above) */}
            <div className="h-6 flex items-center justify-center">
              {activeEffect && (
                <span className="text-lg font-bold text-green-400">
                  {activeEffect}
                </span>
              )}
            </div>
            
            {/* Main symbol + articulation */}
            <div className="flex items-start justify-center">
              {activeModifier === '(...)' ? (
                <span className="text-2xl font-bold text-daw-accent">
                  ({activeSymbol})
                </span>
              ) : (
                <>
                  <span className="text-2xl font-bold text-daw-accent">
                    {activeSymbol}
                  </span>
                  {activeModifier && (
                    <span className="text-sm font-bold text-daw-warning -mt-1">
                      {activeModifier}
                    </span>
                  )}
                </>
              )}
            </div>
            
            {/* Technique (below) */}
            <div className="h-6 flex items-center justify-center">
              {activeTechnique && (
                <span className="text-lg font-bold text-blue-400">
                  {activeTechnique}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}