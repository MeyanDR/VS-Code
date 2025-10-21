import React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { useAppState } from '../contexts/AppContext'

// Helper function to check for duplicate shortcuts
const checkDuplicateShortcut = (shortcut, currentValue, state) => {
  if (!shortcut) return false
  
  return (
    state.ui.availableSymbols.some(s => s.value !== currentValue && s.shortcut === shortcut) ||
    state.ui.availableArticulationModifiers.some(m => m.value !== currentValue && m.shortcut === shortcut) ||
    state.ui.availableTechniqueModifiers.some(m => m.value !== currentValue && m.shortcut === shortcut) ||
    state.ui.availableEffectModifiers.some(m => m.value !== currentValue && m.shortcut === shortcut)
  )
}

export default function NoteConfigurationPanel({
  // Note Type props
  isDragOverSymbols,
  setIsDragOverSymbols,
  noteTypes,
  activeSymbol,
  handleSymbolChange,
  handleRemoveSymbol,
  
  // Articulations props
  isDragOverModifiers,
  setIsDragOverModifiers,
  articulationModifiers,
  activeModifier,
  handleModifierChange,
  handleRemoveArticulation,
  
  // Technique props
  isDragOverTechnique,
  setIsDragOverTechnique,
  techniqueModifiers,
  activeTechnique,
  handleTechniqueChange,
  handleRemoveTechnique,
  
  // Effect props
  isDragOverEffect,
  setIsDragOverEffect,
  effectModifiers,
  activeEffect,
  handleEffectChange,
  handleRemoveEffect,
  
  // Common props
  handleDrop,
  handleDragOver
}) {
  const { state, dispatch } = useAppState()
  const selectOnlyMode = state.ui.selectOnlyMode

  return (
    <div className="bg-daw-bg-secondary rounded-lg border border-daw-border">
      {/* Select Mode Toggle */}
      <div className="p-3 border-b border-daw-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-daw-text-secondary">Write</span>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SELECT_ONLY_MODE' })}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-daw-bg-secondary"
            style={{
              backgroundColor: selectOnlyMode ? '#f59e0b' : '#374151'
            }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                selectOnlyMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-daw-text-secondary">Select</span>
        </div>
      </div>
      
      <Accordion type="multiple" defaultValue={["note-type", "articulations", "technique", "effect", "preview"]} className="w-full">
        {/* Note Type Section */}
        <AccordionItem value="note-type" className="border-0">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            <span className="text-sm font-semibold text-daw-text-secondary">Note Type</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-3 pb-3">
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
                {isDragOverSymbols && (
                  <div className="text-xs text-daw-accent mb-2">Drop symbol here</div>
                )}
                
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
                        <input
                          type="text"
                          maxLength="1"
                          value={note.shortcut || ''}
                          onChange={(e) => {
                            const newShortcut = e.target.value.toLowerCase()
                            if (!checkDuplicateShortcut(newShortcut, note.value, state)) {
                              dispatch({ 
                                type: 'UPDATE_SYMBOL_SHORTCUT', 
                                payload: { value: note.value, shortcut: newShortcut }
                              })
                            }
                          }}
                          className={`w-8 px-1 py-0.5 text-xs text-center bg-daw-bg-panel border rounded text-daw-text-primary focus:outline-none focus:ring-1 ${
                            checkDuplicateShortcut(note.shortcut, note.value, state)
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-daw-border focus:ring-daw-accent'
                          }`}
                          placeholder="-"
                          title={checkDuplicateShortcut(note.shortcut, note.value, state) 
                            ? "This shortcut is already in use" 
                            : "Keyboard shortcut"}
                        />
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Articulations Section */}
        <AccordionItem value="articulations" className="border-t border-daw-border">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            <span className="text-sm font-semibold text-daw-text-secondary">Articulations</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-3 pb-3">
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
                {isDragOverModifiers && (
                  <div className="text-xs text-daw-warning mb-2">Drop articulation here</div>
                )}
                
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
                        <input
                          type="text"
                          maxLength="1"
                          value={mod.shortcut || ''}
                          onChange={(e) => {
                            const newShortcut = e.target.value.toLowerCase()
                            if (!checkDuplicateShortcut(newShortcut, mod.value, state)) {
                              dispatch({ 
                                type: 'UPDATE_ARTICULATION_SHORTCUT', 
                                payload: { value: mod.value, shortcut: newShortcut }
                              })
                            }
                          }}
                          className={`w-8 px-1 py-0.5 text-xs text-center bg-daw-bg-panel border rounded text-daw-text-primary focus:outline-none focus:ring-1 ${
                            checkDuplicateShortcut(mod.shortcut, mod.value, state)
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-daw-border focus:ring-daw-accent'
                          }`}
                          placeholder="-"
                          title={checkDuplicateShortcut(mod.shortcut, mod.value, state) 
                            ? "This shortcut is already in use" 
                            : "Keyboard shortcut"}
                        />
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Technique Section */}
        <AccordionItem value="technique" className="border-t border-daw-border">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            <span className="text-sm font-semibold text-daw-text-secondary">Technique</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-3 pb-3">
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
                {isDragOverTechnique && (
                  <div className="text-xs text-blue-400 mb-2">Drop technique here</div>
                )}
                
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
                        <input
                          type="text"
                          maxLength="1"
                          value={mod.shortcut || ''}
                          onChange={(e) => {
                            const newShortcut = e.target.value.toLowerCase()
                            if (!checkDuplicateShortcut(newShortcut, mod.value, state)) {
                              dispatch({ 
                                type: 'UPDATE_TECHNIQUE_SHORTCUT', 
                                payload: { value: mod.value, shortcut: newShortcut }
                              })
                            }
                          }}
                          className={`w-8 px-1 py-0.5 text-xs text-center bg-daw-bg-panel border rounded text-daw-text-primary focus:outline-none focus:ring-1 ${
                            checkDuplicateShortcut(mod.shortcut, mod.value, state)
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-daw-border focus:ring-daw-accent'
                          }`}
                          placeholder="-"
                          title={checkDuplicateShortcut(mod.shortcut, mod.value, state) 
                            ? "This shortcut is already in use" 
                            : "Keyboard shortcut"}
                        />
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Effect Section */}
        <AccordionItem value="effect" className="border-t border-daw-border">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            <span className="text-sm font-semibold text-daw-text-secondary">Effect</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-3 pb-3">
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
                {isDragOverEffect && (
                  <div className="text-xs text-green-400 mb-2">Drop effect here</div>
                )}
                
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
                        <input
                          type="text"
                          maxLength="1"
                          value={mod.shortcut || ''}
                          onChange={(e) => {
                            const newShortcut = e.target.value.toLowerCase()
                            if (!checkDuplicateShortcut(newShortcut, mod.value, state)) {
                              dispatch({ 
                                type: 'UPDATE_EFFECT_SHORTCUT', 
                                payload: { value: mod.value, shortcut: newShortcut }
                              })
                            }
                          }}
                          className={`w-8 px-1 py-0.5 text-xs text-center bg-daw-bg-panel border rounded text-daw-text-primary focus:outline-none focus:ring-1 ${
                            checkDuplicateShortcut(mod.shortcut, mod.value, state)
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-daw-border focus:ring-daw-accent'
                          }`}
                          placeholder="-"
                          title={checkDuplicateShortcut(mod.shortcut, mod.value, state) 
                            ? "This shortcut is already in use" 
                            : "Keyboard shortcut"}
                        />
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Preview Section */}
        <AccordionItem value="preview" className="border-t border-daw-border">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            <span className="text-sm font-semibold text-daw-text-secondary">Preview</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-3 pb-3">
              <div className="p-4 bg-daw-bg-panel rounded border border-daw-border">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="h-6 flex items-center justify-center">
                    {activeEffect && (
                      <span className="text-lg font-bold text-green-400">
                        {activeEffect}
                      </span>
                    )}
                  </div>
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}