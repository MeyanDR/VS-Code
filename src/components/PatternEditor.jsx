import React from 'react'
import { useAppState } from '../contexts/AppContext'
import NoteSymbolDropdown from './NoteSymbolDropdown'
import ModifierDropdown from './ModifierDropdown'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export default function PatternEditor() {
  const { state, dispatch } = useAppState()
  
  const handleSymbolChange = (symbol) => {
    dispatch({ type: 'SET_ACTIVE_SYMBOL', payload: symbol })
  }
  
  const handleModifierChange = (modifier) => {
    dispatch({ type: 'SET_ACTIVE_MODIFIER', payload: modifier })
  }
  
  return (
    <div className="bg-daw-bg-secondary rounded-lg p-4 border border-daw-border">
      <h3 className="text-sm font-semibold text-daw-text-secondary mb-4">Pattern Editor</h3>
      
      <Tabs defaultValue="note" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="note">Note</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="note" className="space-y-4 mt-4">
          <NoteSymbolDropdown
            value={state.ui.activeSymbol}
            onChange={handleSymbolChange}
            label="Note Symbol"
          />
          
          <ModifierDropdown
            value={state.ui.activeModifier}
            onChange={handleModifierChange}
            label="Modifier"
          />
        </TabsContent>
        
        <TabsContent value="preview" className="mt-4">
          <div className="p-3 bg-daw-bg-panel rounded-lg border border-daw-border">
            <p className="text-xs text-daw-text-dim mb-2">Current Selection:</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-daw-accent">{state.ui.activeSymbol}</span>
              {state.ui.activeModifier && (
                <span className="text-lg text-daw-warning font-semibold">
                  {state.ui.activeModifier}
                </span>
              )}
              <div className="ml-auto text-xs text-daw-text-secondary">
                Click on grid to apply
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}