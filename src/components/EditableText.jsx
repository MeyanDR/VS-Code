import React, { useState, useRef, useEffect } from 'react'

const EditableText = ({ 
  value, 
  onSave, 
  className = "",
  inputClassName = "",
  maxLength = 30,
  placeholder = "Click to edit"
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleClick = () => {
    setIsEditing(true)
    setEditValue(value)
  }

  const handleSave = () => {
    const trimmedValue = editValue.trim()
    if (trimmedValue && trimmedValue !== value) {
      onSave(trimmedValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleBlur = () => {
    handleSave()
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        className={`bg-gray-800 text-cyan-300 px-2 py-1 rounded border border-cyan-500 outline-none focus:ring-2 focus:ring-cyan-400 ${inputClassName}`}
      />
    )
  }

  return (
    <span 
      onClick={handleClick}
      className={`cursor-pointer hover:text-cyan-400 transition-colors ${className}`}
      title="Click to edit"
    >
      {value || placeholder}
    </span>
  )
}

export default EditableText