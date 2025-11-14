import React, { useState, useEffect } from 'react'
import { useAppState } from '../contexts/AppContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

export default function EditModal() {
  const { state, dispatch } = useAppState()
  const { editingStep, editFieldSymbol, editFieldArticulation, editFieldTechnique, editFieldEffect } = state.ui
  const [symbol, setSymbol] = useState('')
  const [modifier, setModifier] = useState('')
  const [technique, setTechnique] = useState('')
  const [effect, setEffect] = useState('')
  const [showSubdivideMenu, setShowSubdivideMenu] = useState(false)
  
  useEffect(() => {
    if (editingStep) {
      setSymbol(editingStep.symbol || '')
      setModifier(editingStep.modifier || '')
      setTechnique(editingStep.technique || '')
      setEffect(editingStep.effect || '')
    }
  }, [editingStep])
  
  // Update local state when fields are set from SymbolLegend
  useEffect(() => {
    if (editFieldSymbol !== null) {
      setSymbol(editFieldSymbol)
      dispatch({ type: 'SET_EDIT_FIELD_SYMBOL', payload: null })
    }
  }, [editFieldSymbol, dispatch])
  
  useEffect(() => {
    if (editFieldArticulation !== null) {
      setModifier(editFieldArticulation)
      dispatch({ type: 'SET_EDIT_FIELD_ARTICULATION', payload: null })
    }
  }, [editFieldArticulation, dispatch])
  
  useEffect(() => {
    if (editFieldTechnique !== null) {
      setTechnique(editFieldTechnique)
      dispatch({ type: 'SET_EDIT_FIELD_TECHNIQUE', payload: null })
    }
  }, [editFieldTechnique, dispatch])
  
  useEffect(() => {
    if (editFieldEffect !== null) {
      setEffect(editFieldEffect)
      dispatch({ type: 'SET_EDIT_FIELD_EFFECT', payload: null })
    }
  }, [editFieldEffect, dispatch])
  
  const handleClose = () => {
    dispatch({ type: 'CLOSE_EDIT_MODAL' })
    dispatch({ type: 'CLEAR_EDIT_FIELDS' })
  }
  
  const handleSave = () => {
    if (editingStep) {
      dispatch({
        type: 'UPDATE_NOTE',
        payload: {
          instrumentId: editingStep.instrumentId,
          position: editingStep.position,
          beatIndex: editingStep.beatIndex,
          subdivision: editingStep.subdivision,
          symbol,
          modifier,
          technique,
          effect
        }
      })
    }
    handleClose()
  }

  const handleSubdivide = (subdivisionValue) => {
    if (editingStep) {
      // Get the current subdivision path
      const currentPath = Array.isArray(editingStep.subdivision)
        ? editingStep.subdivision
        : [editingStep.subdivision]

      // Dispatch nested subdivision update
      dispatch({
        type: 'UPDATE_NESTED_SUBDIVISION',
        payload: {
          instrumentId: editingStep.instrumentId,
          beatIndex: editingStep.beatIndex,
          stepPath: currentPath,
          subdivision: subdivisionValue
        }
      })

      // If there's a note at this position, migrate it to the first nested subdivision
      if (symbol) {
        // Remove current note
        dispatch({
          type: 'REMOVE_NOTE',
          payload: {
            instrumentId: editingStep.instrumentId,
            beatIndex: editingStep.beatIndex,
            subdivision: editingStep.subdivision
          }
        })

        // Add note at first nested subdivision
        const newSubdivisionPath = Array.isArray(editingStep.subdivision)
          ? [...editingStep.subdivision, 0]
          : [editingStep.subdivision, 0]

        dispatch({
          type: 'ADD_NOTE',
          payload: {
            instrumentId: editingStep.instrumentId,
            beatIndex: editingStep.beatIndex,
            subdivision: newSubdivisionPath,
            symbol,
            modifier,
            technique,
            effect
          }
        })
      }
    }
    handleClose()
  }
  
  return (
    <Dialog open={!!editingStep} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
          <DialogDescription>
            Modify the symbol and modifier for this note.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="symbol" className="text-right">
              Symbol
            </Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modifier" className="text-right">
              Articulation
            </Label>
            <Input
              id="modifier"
              value={modifier}
              onChange={(e) => setModifier(e.target.value)}
              className="col-span-3"
              placeholder="e.g., >, 1, 2, 3, (...)"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="technique" className="text-right">
              Technique
            </Label>
            <Input
              id="technique"
              value={technique}
              onChange={(e) => setTechnique(e.target.value)}
              className="col-span-3"
              placeholder="e.g., R, L, B"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="effect" className="text-right">
              Effect
            </Label>
            <Input
              id="effect"
              value={effect}
              onChange={(e) => setEffect(e.target.value)}
              className="col-span-3"
              placeholder="e.g., ↑, ↓, ※"
            />
          </div>

          {/* Subdivide section */}
          <div className="border-t pt-4 mt-2">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Subdivide Step</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSubdivideMenu(!showSubdivideMenu)}
                className="text-xs"
              >
                {showSubdivideMenu ? 'Hide' : 'Show'}
              </Button>
            </div>

            {showSubdivideMenu && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-3">
                  Choose how many subdivisions to create within this step:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <Button
                      key={num}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSubdivide(num)}
                      className="h-12 text-sm font-semibold hover:bg-cyan-600 hover:text-white hover:border-cyan-400"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}