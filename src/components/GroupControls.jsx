import React from 'react'

export default function GroupControls({ 
  onCreateGroup, 
  onAddToGroup,
  instrumentAboveId, 
  instrumentBelowId,
  groupId,
  instrumentToAdd,
  mode = 'create', // 'create' or 'add'
  isVisible = true 
}) {
  const handleClick = () => {
    if (mode === 'add' && groupId && instrumentToAdd && onAddToGroup) {
      onAddToGroup(groupId, instrumentToAdd)
    } else if (mode === 'create' && instrumentAboveId && instrumentBelowId && onCreateGroup) {
      onCreateGroup([instrumentAboveId, instrumentBelowId])
    }
  }
  
  if (!isVisible) return null
  
  const isAddMode = mode === 'add'
  const title = isAddMode 
    ? "Add instrument to group" 
    : "Group these instruments together"
  
  return (
    <div className="flex justify-center items-center w-full py-1">
      <button
        onClick={handleClick}
        className="
          w-6 h-6 rounded-full 
          bg-gray-700/70 hover:bg-cyan-600/80
          border border-gray-500 hover:border-cyan-400
          flex items-center justify-center
          transition-all duration-200 transform hover:scale-110
          group opacity-60 hover:opacity-100
        "
        title={title}
      >
        <svg 
          className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors duration-200" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}