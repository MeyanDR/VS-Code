import React from 'react'

export default function BeatAnchor({
  barIndex,
  beatInBar,
  onSubdivisionChange,
  globalBeatIndex,
  instrumentId,
  height
}) {
  const beatNumber = `${barIndex + 1}.${beatInBar + 1}`
  
  const handleClick = (e) => {
    e.stopPropagation()
    onSubdivisionChange && onSubdivisionChange(globalBeatIndex, instrumentId)
  }
  
  return (
    <div
      className={`
        w-full border-2 border-cyan-400 rounded-md flex items-center justify-center
        cursor-pointer transition-all duration-150 shadow-sm
        bg-gray-900 text-cyan-400 hover:bg-cyan-950 hover:border-cyan-300
        font-mono text-xs font-bold
      `}
      style={{ height: height ? `${height}px` : '48px' }}
      onClick={handleClick}
      title={`Beat ${beatNumber} - Click to change subdivision`}
    >
      {beatNumber}
    </div>
  )
}