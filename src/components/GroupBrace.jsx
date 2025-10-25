import React from 'react'

export default function GroupBrace({ height }) {
  return (
    <div className="flex items-center h-full">
      {/* Clean left border indicator */}
      <div 
        className="w-1 bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-400 rounded-full opacity-60"
        style={{ height: `${Math.max(height - 16, 20)}px` }}
      />
    </div>
  )
}