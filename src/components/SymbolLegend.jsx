import React, { useState } from 'react'

export default function SymbolLegend() {
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
    <div className="bg-daw-bg-secondary rounded-lg p-3 border border-daw-border">
      <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">Symbol Legend</h3>
      <div className="space-y-1.5">
        {symbols.map(({ symbol, description }) => (
          <div key={symbol} className="flex items-center gap-2 text-xs">
            <span className="text-daw-accent font-bold w-5 text-center">
              {symbol}
            </span>
            <span className="text-daw-text-primary">{description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}