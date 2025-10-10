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
  const { editingStep } = state.ui
  const [symbol, setSymbol] = useState('')
  const [modifier, setModifier] = useState('')
  
  useEffect(() => {
    if (editingStep) {
      setSymbol(editingStep.symbol || '')
      setModifier(editingStep.modifier || '')
    }
  }, [editingStep])
  
  const handleClose = () => {
    dispatch({ type: 'CLOSE_EDIT_MODAL' })
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
          modifier
        }
      })
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
              Modifier
            </Label>
            <Input
              id="modifier"
              value={modifier}
              onChange={(e) => setModifier(e.target.value)}
              className="col-span-3"
            />
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