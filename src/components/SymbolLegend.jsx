import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { useAppState } from '../contexts/AppContext'

export default function SymbolLegend() {
  const { state, dispatch } = useAppState()
  const { editingStep } = state.ui
  const noteSymbols = [
    { symbol: 'o', label: 'Open Note', description: 'Basic open note / Normal hit' },
    { symbol: 'x', label: 'Cross Note', description: 'Muted or closed note / Stick shot' },
    { symbol: '+', label: 'Plus Note', description: 'Accent or addition / Closed hi-hat' },
    { symbol: 'O', label: 'Large Open', description: 'Strong open note / Open sound' },
    { symbol: 'X', label: 'Large Cross', description: 'Strong muted note / Crash accent' },
    { symbol: '◯', label: 'Circle', description: 'Hollow circle / Ghost note' },
    { symbol: '●', label: 'Filled Circle', description: 'Solid circle / Strong accent' },
    { symbol: '◆', label: 'Diamond', description: 'Diamond shape / Flam' },
    { symbol: '▲', label: 'Triangle', description: 'Triangle up / Rimshot' },
    { symbol: '■', label: 'Square', description: 'Filled square / Cross-stick' }
  ]

  const articulationModifiers = [
    { symbol: '>', label: 'Accent', description: 'Strong accent' },
    { symbol: '^', label: 'Marcato', description: 'Marked emphasis' },
    { symbol: '<', label: 'Accent', description: 'Accent mark' },
    { symbol: '1', label: 'Single stroke', description: 'Single stroke' },
    { symbol: '2', label: 'Double stroke', description: 'Double stroke' },
    { symbol: '3', label: 'Triple stroke', description: 'Triple stroke' },
    { symbol: '(...)', label: 'Roll', description: 'Roll notation' },
    { symbol: '~', label: 'Tremolo', description: 'Tremolo/buzz roll' },
    { symbol: '=', label: 'Double roll', description: 'Double stroke roll' },
    { symbol: '≈', label: 'Flam tap', description: 'Flam tap' },
    { symbol: '.', label: 'Staccato', description: 'Short, detached' },
    { symbol: '-', label: 'Tenuto', description: 'Held, sustained' },
    { symbol: '_', label: 'Legato', description: 'Smooth connection' },
    { symbol: '´', label: 'Staccatissimo', description: 'Very short' }
  ]

  const techniqueModifiers = [
    { symbol: 'R', label: 'Right hand', description: 'Play with right hand' },
    { symbol: 'L', label: 'Left hand', description: 'Play with left hand' },
    { symbol: 'B', label: 'Both hands', description: 'Play with both hands' },
    { symbol: '×', label: 'Cross-stick', description: 'Cross-stick technique' },
    { symbol: '°', label: 'Rim shot', description: 'Rim shot technique' },
    { symbol: '◦', label: 'Ghost note', description: 'Ghost note indicator' }
  ]

  const effectModifiers = [
    { symbol: '↑', label: 'Crescendo', description: 'Gradually louder' },
    { symbol: '↓', label: 'Diminuendo', description: 'Gradually softer' },
    { symbol: '※', label: 'Special effect', description: 'Special technique' },
    { symbol: '⚡', label: 'Sharp attack', description: 'Sharp attack' },
    { symbol: '∆', label: 'Sustained', description: 'Triangle wave/sustained' }
  ]

  const groupingModifiers = [
    { symbol: '[', label: 'Phrase start', description: 'Start of phrase bracket' },
    { symbol: ']', label: 'Phrase end', description: 'End of phrase bracket' },
    { symbol: '{', label: 'Group start', description: 'Start of group bracket' },
    { symbol: '}', label: 'Group end', description: 'End of group bracket' }
  ]

  
  return (
    <Accordion type="single" collapsible defaultValue="symbol-modifier" className="bg-daw-bg-secondary rounded-lg border border-daw-border">
      <AccordionItem value="symbol-modifier" className="border-0">
        <AccordionTrigger className="px-3 py-2 hover:no-underline">
          <span className="text-sm font-semibold text-daw-text-secondary">Symbol and Modifier Library</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="px-3 pb-3">
            <Tabs defaultValue="symbols" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-1 mb-3">
          <TabsTrigger value="symbols" className="text-xs">Symbols</TabsTrigger>
          <TabsTrigger value="articulation" className="text-xs">Articulation</TabsTrigger>
          <TabsTrigger value="technique" className="text-xs">Technique</TabsTrigger>
          <TabsTrigger value="effects" className="text-xs">Effects</TabsTrigger>
        </TabsList>
        
        <TabsContent value="symbols" className="space-y-1.5 mt-0">
          <div className="text-xs text-daw-text-dim mb-2">
            Drag or double-click symbols to add them to your active palette:
          </div>
          <div className="grid gap-2">
            {noteSymbols.map(({ symbol, label, description }) => (
              <div 
                key={symbol} 
                draggable="true"
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: 'symbol',
                    value: symbol,
                    label,
                    description
                  }))
                  e.currentTarget.style.opacity = '0.5'
                }}
                onDragEnd={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
                onDoubleClick={() => {
                  dispatch({ type: 'ADD_AVAILABLE_SYMBOL', payload: { 
                    value: symbol, 
                    label, 
                    description 
                  }})
                  // Also populate edit modal field if it's open
                  if (editingStep) {
                    dispatch({ type: 'SET_EDIT_FIELD_SYMBOL', payload: symbol })
                  }
                }}
                className="flex items-center gap-3 p-1.5 rounded hover:bg-daw-bg-primary transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <span className="text-lg font-bold w-8 text-center text-daw-accent">
                  {symbol}
                </span>
                <div className="flex-1">
                  <span className="text-xs font-medium text-daw-text-primary">{label}</span>
                  <div className="text-xs text-daw-text-dim">{description}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="articulation" className="space-y-1.5 mt-0">
          <div className="text-xs text-daw-text-dim mb-2">
            Drag or double-click articulation modifiers to add them:
          </div>
          <div className="grid gap-2">
            {articulationModifiers.map(({ symbol, label, description }) => (
              <div 
                key={symbol} 
                draggable="true"
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: 'articulation',
                    value: symbol,
                    label,
                    description
                  }))
                  e.currentTarget.style.opacity = '0.5'
                }}
                onDragEnd={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
                onDoubleClick={() => {
                  dispatch({ type: 'ADD_AVAILABLE_ARTICULATION', payload: { 
                    value: symbol, 
                    label, 
                    description 
                  }})
                  // Also populate edit modal field if it's open
                  if (editingStep) {
                    dispatch({ type: 'SET_EDIT_FIELD_ARTICULATION', payload: symbol })
                  }
                }}
                className="flex items-center gap-3 p-1.5 rounded hover:bg-daw-bg-primary transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <span className="text-sm font-bold w-8 text-center text-daw-warning">
                  {symbol}
                </span>
                <div className="flex-1">
                  <span className="text-xs font-medium text-daw-text-primary">{label}</span>
                  <div className="text-xs text-daw-text-dim">{description}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="technique" className="space-y-1.5 mt-0">
          <div className="text-xs text-daw-text-dim mb-2">
            Drag or double-click technique modifiers to add them:
          </div>
          <div className="grid gap-2">
            {techniqueModifiers.map(({ symbol, label, description }) => (
              <div 
                key={symbol} 
                draggable="true"
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: 'technique',
                    value: symbol,
                    label,
                    description
                  }))
                  e.currentTarget.style.opacity = '0.5'
                }}
                onDragEnd={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
                onDoubleClick={() => {
                  dispatch({ type: 'ADD_AVAILABLE_TECHNIQUE', payload: { 
                    value: symbol, 
                    label, 
                    description 
                  }})
                  // Also populate edit modal field if it's open
                  if (editingStep) {
                    dispatch({ type: 'SET_EDIT_FIELD_TECHNIQUE', payload: symbol })
                  }
                }}
                className="flex items-center gap-3 p-1.5 rounded hover:bg-daw-bg-primary transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <span className="text-sm font-bold w-8 text-center text-blue-400">
                  {symbol}
                </span>
                <div className="flex-1">
                  <span className="text-xs font-medium text-daw-text-primary">{label}</span>
                  <div className="text-xs text-daw-text-dim">{description}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="effects" className="space-y-1.5 mt-0">
          <div className="text-xs text-daw-text-dim mb-2">
            Drag or double-click effect modifiers to add them:
          </div>
          <div className="grid gap-2">
            {effectModifiers.map(({ symbol, label, description }) => (
              <div 
                key={symbol} 
                draggable="true"
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: 'effect',
                    value: symbol,
                    label,
                    description
                  }))
                  e.currentTarget.style.opacity = '0.5'
                }}
                onDragEnd={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
                onDoubleClick={() => {
                  dispatch({ type: 'ADD_AVAILABLE_EFFECT', payload: { 
                    value: symbol, 
                    label, 
                    description 
                  }})
                  // Also populate edit modal field if it's open
                  if (editingStep) {
                    dispatch({ type: 'SET_EDIT_FIELD_EFFECT', payload: symbol })
                  }
                }}
                className="flex items-center gap-3 p-1.5 rounded hover:bg-daw-bg-primary transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <span className="text-sm font-bold w-8 text-center text-green-400">
                  {symbol}
                </span>
                <div className="flex-1">
                  <span className="text-xs font-medium text-daw-text-primary">{label}</span>
                  <div className="text-xs text-daw-text-dim">{description}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
            </Tabs>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}