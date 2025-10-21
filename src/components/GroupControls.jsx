import React from 'react'

export default function GroupControls({ 
  onCreateGroup, 
  instrumentAboveId, 
  instrumentBelowId,
  isVisible = true 
}) {
  const handleClick = () => {
    if (instrumentAboveId && instrumentBelowId) {
      onCreateGroup([instrumentAboveId, instrumentBelowId])
    }
  }
  
  if (!isVisible) return null
  
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
        title="Group these instruments together"
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