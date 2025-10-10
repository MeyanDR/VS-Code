import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Label } from './ui/label'

export default function NoteSymbolDropdown({ value, onChange, label }) {
  const symbols = [
    { value: 'o', label: 'Open Note', description: 'Basic open note' },
    { value: 'x', label: 'Cross Note', description: 'Muted or closed note' },
    { value: '+', label: 'Plus Note', description: 'Accent or addition' },
    { value: 'O', label: 'Large Open', description: 'Strong open note' },
    { value: 'X', label: 'Large Cross', description: 'Strong muted note' },
    { value: '◯', label: 'Circle', description: 'Hollow circle' },
    { value: '●', label: 'Filled Circle', description: 'Solid circle' },
    { value: '◆', label: 'Diamond', description: 'Diamond shape' },
    { value: '▲', label: 'Triangle', description: 'Triangle up' },
    { value: '■', label: 'Square', description: 'Filled square' }
  ]

  const selectedSymbol = symbols.find(s => s.value === value) || symbols[0]

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs text-daw-text-dim">{label}</Label>}
      
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span className="text-lg font-bold w-6 text-center text-daw-accent">{selectedSymbol.value}</span>
              <span>{selectedSymbol.label}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {symbols.map((symbol) => (
            <SelectItem key={symbol.value} value={symbol.value}>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold w-6 text-center text-daw-accent">
                  {symbol.value}
                </span>
                <div>
                  <div className="text-sm font-medium">
                    {symbol.label}
                  </div>
                  <div className="text-xs text-daw-text-dim">
                    {symbol.description}
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