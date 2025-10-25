import React, { useState } from 'react'
import { cn } from '../lib/utils'

export default function ExportKnob({ onClick, className, disabled = false }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      className={cn(
        "relative group flex flex-col items-center justify-center",
        "w-20 h-20 rounded-lg",
        "bg-daw-accent hover:bg-daw-accent-hover",
        "transition-all duration-300 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-daw-accent focus-visible:ring-offset-2 focus-visible:ring-offset-daw-bg-primary",
        "disabled:pointer-events-none disabled:opacity-50",
        "shadow-lg hover:shadow-xl",
        "transform hover:scale-105",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Export to PDF or JPG"
    >
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-2 rounded-md",
        "bg-gradient-to-br from-white/20 to-transparent",
        "transition-transform duration-500 ease-in-out",
        isHovered ? "scale-105" : "scale-100"
      )} />
      
      {/* Text content */}
      <div className="flex flex-col items-center justify-center text-center relative z-10">
        <span className="text-xs font-medium text-daw-bg-primary leading-tight">
          export to
        </span>
        <span className="text-xs font-medium text-daw-bg-primary leading-tight">
          pdf/jpg
        </span>
      </div>
      
      {/* Hover glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-lg",
        "bg-daw-accent/50 blur-md",
        "transition-opacity duration-300",
        isHovered ? "opacity-100" : "opacity-0",
        "-z-10"
      )} />
    </button>
  )
}