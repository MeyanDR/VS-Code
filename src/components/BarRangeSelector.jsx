import React, { useState, useRef, useEffect } from 'react'

const BarRangeSelector = ({ 
  barRange,
  totalBars, 
  isFirstRange,
  isLastRange,
  previousRangeEnd,
  onRangeChange,
  onRemove
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tempEnd, setTempEnd] = useState(barRange.end)
  const modalRef = useRef(null)
  
  // The start is fixed based on previous range
  const fixedStart = isFirstRange ? 1 : previousRangeEnd + 1
  
  // Generate options for end bar (from fixed start to total bars)
  const endOptions = Array.from(
    { length: totalBars - fixedStart + 1 }, 
    (_, i) => fixedStart + i
  )
  
  useEffect(() => {
    setTempEnd(barRange.end)
  }, [barRange.end])
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false)
        setTempEnd(barRange.end)
      }
    }
    
    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isModalOpen, barRange.end])
  
  const handleEndChange = (newEnd) => {
    setTempEnd(newEnd)
  }
  
  const handleApply = () => {
    onRangeChange(tempEnd)
    setIsModalOpen(false)
  }
  
  const handleCancel = () => {
    setTempEnd(barRange.end)
    setIsModalOpen(false)
  }
  
  const getDisplayText = () => {
    if (fixedStart === barRange.end) {
      return `Bar ${fixedStart}`
    }
    return `Bars ${fixedStart}-${barRange.end}`
  }
  
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors cursor-pointer"
        >
          {getDisplayText()}
        </button>
        
        {/* Remove button for non-first ranges */}
        {!isFirstRange && (
          <button
            onClick={onRemove}
            className="ml-2 text-red-400 hover:text-red-300 transition-colors text-sm"
            title="Remove line break"
          >
            ✕
          </button>
        )}
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div 
            ref={modalRef}
            className="bg-gray-900 border border-cyan-900/50 rounded-lg p-6 shadow-xl w-96"
          >
            <h3 className="text-cyan-400 font-bold text-lg mb-4">Set Line Break</h3>
            
            <div className="space-y-4">
              {/* Start Bar (Fixed) */}
              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-sm w-24">From Bar:</label>
                <div className="flex-1">
                  <div className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-400">
                    {fixedStart} {!isFirstRange && <span className="text-xs">(fixed)</span>}
                  </div>
                </div>
              </div>
              
              {/* End Bar Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-sm w-24">To Bar:</label>
                <div className="flex-1">
                  <select
                    value={tempEnd}
                    onChange={(e) => handleEndChange(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-cyan-900/50 rounded text-cyan-300 focus:outline-none focus:border-cyan-400"
                  >
                    {endOptions.map(bar => (
                      <option key={bar} value={bar}>{bar}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mt-2">
                This range will display bars {fixedStart} to {tempEnd} on this line.
                {tempEnd < totalBars && (
                  <span className="block mt-1">
                    The next line will start at bar {tempEnd + 1}.
                  </span>
                )}
              </div>
            </div>
            
            {/* Modal Actions */}
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BarRangeSelector