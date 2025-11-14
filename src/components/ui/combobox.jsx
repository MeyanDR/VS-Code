import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDownIcon } from '@radix-ui/react-icons'

/**
 * Combobox - A single unified control that combines input and dropdown
 * Like Figma/VS Code zoom selector - click to type OR click arrow for presets
 */
export function Combobox({
  value,
  onChange,
  options = [],
  min,
  max,
  suffix = '',
  placeholder = '',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value?.toString() || '')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Update input value when external value changes
  useEffect(() => {
    setInputValue(value?.toString() || '')
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      const isClickInside =
        (containerRef.current && containerRef.current.contains(event.target)) ||
        (dropdownRef.current && dropdownRef.current.contains(event.target))

      if (!isClickInside) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4, // 4px gap below the input
        left: rect.left,
        width: rect.width
      })
    }
  }, [isOpen])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Parse and validate
    const numValue = parseFloat(newValue)
    if (!isNaN(numValue)) {
      // Apply min/max constraints
      let constrainedValue = numValue
      if (min !== undefined && numValue < min) constrainedValue = min
      if (max !== undefined && numValue > max) constrainedValue = max

      onChange(constrainedValue)
    }
  }

  const handleInputBlur = () => {
    // Ensure value is valid on blur
    const numValue = parseFloat(inputValue)
    if (isNaN(numValue)) {
      // Reset to current value if invalid
      setInputValue(value?.toString() || '')
    } else {
      // Apply constraints
      let constrainedValue = numValue
      if (min !== undefined && numValue < min) {
        constrainedValue = min
        setInputValue(constrainedValue.toString())
        onChange(constrainedValue)
      }
      if (max !== undefined && numValue > max) {
        constrainedValue = max
        setInputValue(constrainedValue.toString())
        onChange(constrainedValue)
      }
    }
  }

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
      setIsOpen(false)
    } else if (e.key === 'Escape') {
      setInputValue(value?.toString() || '')
      inputRef.current?.blur()
      setIsOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIsOpen(true)
    }
  }

  const handleOptionClick = (optionValue) => {
    setInputValue(optionValue.toString())
    onChange(optionValue)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const toggleDropdown = (e) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Single unified control */}
      <div className="flex items-center bg-gray-800 border border-gray-700 rounded overflow-hidden">
        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onFocus={() => inputRef.current?.select()}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm px-2 py-1 outline-none text-center w-12"
        />

        {/* Suffix (e.g., "%") */}
        {suffix && (
          <span className="text-white text-sm pr-1">{suffix}</span>
        )}

        {/* Dropdown button */}
        <button
          type="button"
          onClick={toggleDropdown}
          className="px-1 py-1 text-gray-400 hover:text-white transition-colors border-l border-gray-700"
        >
          <ChevronDownIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown menu - rendered as portal to overlay on top of everything */}
      {isOpen && options.length > 0 && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg max-h-60 overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999
          }}
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleOptionClick(option)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                option === value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {option}{suffix}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
