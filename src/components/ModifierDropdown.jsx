import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Label } from './ui/label'

export default function ModifierDropdown({ value, onChange, label }) {
  const modifiers = [
    { value: 'none', label: 'None', description: 'No modifier' },
    { value: 'f', label: 'Forte (f)', description: 'Loud' },
    { value: 'p', label: 'Piano (p)', description: 'Soft' },
    { value: 'mf', label: 'Mezzo-forte (mf)', description: 'Moderately loud' },
    { value: 'mp', label: 'Mezzo-piano (mp)', description: 'Moderately soft' },
    { value: 'ff', label: 'Fortissimo (ff)', description: 'Very loud' },
    { value: 'pp', label: 'Pianissimo (pp)', description: 'Very soft' },
    { value: '>', label: 'Accent (>)', description: 'Strong accent' },
    { value: '^', label: 'Marcato (^)', description: 'Marked emphasis' }
  ]

  // Convert empty string to 'none' for Select component
  const selectValue = value === '' ? 'none' : value
  const handleChange = (newValue) => {
    onChange(newValue === 'none' ? '' : newValue)
  }

  const selectedModifier = modifiers.find(m => (m.value === 'none' && value === '') || m.value === value) || modifiers[0]

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs text-daw-text-dim">{label}</Label>}
      
      <Select value={selectValue} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <span className="flex items-center gap-2">
              {selectedModifier.value !== 'none' && (
                <span className="text-daw-warning font-bold min-w-[1.5rem] text-center">
                  {selectedModifier.value}
                </span>
              )}
              <span>{selectedModifier.label}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {modifiers.map((modifier) => (
            <SelectItem key={modifier.value} value={modifier.value}>
              <div className="flex items-center gap-3">
                <span className="font-bold min-w-[1.5rem] text-center text-daw-warning">
                  {modifier.value === 'none' ? '-' : modifier.value}
                </span>
                <div>
                  <div className="text-sm font-medium">
                    {modifier.label}
                  </div>
                  <div className="text-xs text-daw-text-dim">
                    {modifier.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}