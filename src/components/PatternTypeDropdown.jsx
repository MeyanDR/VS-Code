import React, { useState, useRef, useEffect } from 'react'

export default function PatternTypeDropdown({ value, onChange, options, label }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  const patternTypes = options || [
    { value: 'loop', symbol: '∞', label: 'Loop' },
    { value: 'boundary', symbol: '||', label: 'Boundary' }
  ]

  const filteredOptions = patternTypes.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.symbol.includes(searchTerm)
  )

  const selectedOption = patternTypes.find(option => option.value === value) || patternTypes[0]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option) => {
    onChange(option.value)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="text-xs text-daw-text-dim mb-1 block">{label}</label>}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-daw-button text-daw-text-primary rounded 
                   hover:bg-daw-button-hover transition-colors flex items-center justify-between
                   border border-daw-border text-sm"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg font-bold">{selectedOption.symbol}</span>
          <span>{selectedOption.label}</span>
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-daw-bg-secondary border border-daw-border rounded shadow-lg">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 bg-daw-bg-primary border border-daw-border rounded 
                       text-daw-text-primary text-sm focus:outline-none focus:border-daw-accent"
              autoFocus
            />
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-daw-text-dim">No results found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`w-full px-3 py-2 text-left hover:bg-daw-button-hover transition-colors
                            flex items-center gap-2 ${
                              option.value === value ? 'bg-daw-accent text-daw-bg-primary' : 'text-daw-text-primary'
                            }`}
                >
                  <span className="text-lg font-bold">{option.symbol}</span>
                  <span className="text-sm">{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}