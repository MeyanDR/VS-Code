import React, { useState } from 'react'

export default function SymbolLegend() {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const symbols = [
    { symbol: 'o', description: 'Normal hit' },
    { symbol: 'x', description: 'Stick shot' },
    { symbol: '+', description: 'Closed hi-hat' },
    { symbol: 'O', description: 'Open sound' },
    { symbol: 'X', description: 'Crash/accent' },
    { symbol: '◯', description: 'Ghost note' },
    { symbol: '●', description: 'Accent' },
    { symbol: '◆', description: 'Flam' },
    { symbol: '▲', description: 'Rimshot' },
    { symbol: '■', description: 'Cross-stick' }
  ]
  
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        className="bg-slate-800 px-4 py-2 rounded-lg text-cyan-400 font-bold hover:bg-slate-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Hide' : 'Show'} Symbol Legend
      </button>
      
      {isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 bg-slate-800 p-4 rounded-lg shadow-xl min-w-[250px]">
          <h3 className="text-cyan-400 font-bold mb-3">Symbol Legend</h3>
          <div className="space-y-2">
            {symbols.map(({ symbol, description }) => (
              <div key={symbol} className="flex items-center gap-3">
                <span className="text-white font-bold text-lg w-6 text-center">
                  {symbol}
                </span>
                <span className="text-gray-300 text-sm">{description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}