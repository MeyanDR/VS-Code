import React from 'react'

export default function GroupBrace({ height }) {
  return (
    <div className="flex items-start h-full">
      {/* Musical Brace SVG - pure visual component */}
      <svg 
        width="40" 
        height={height} 
        className="block"
      >
        {/* Main curly brace shape */}
        <path
          d={`
            M 35 5
            C 25 5, 20 10, 20 20
            L 20 ${height/2 - 10}
            C 20 ${height/2 - 5}, 15 ${height/2 - 5}, 10 ${height/2}
            C 15 ${height/2 + 5}, 20 ${height/2 + 5}, 20 ${height/2 + 10}
            L 20 ${height - 20}
            C 20 ${height - 10}, 25 ${height - 5}, 35 ${height - 5}
          `}
          stroke="#06b6d4"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}