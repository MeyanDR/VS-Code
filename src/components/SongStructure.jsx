import React from 'react'
import { useAppState } from '../contexts/AppContext'

export default function SongStructure() {
  const { state, dispatch } = useAppState()
  const sections = Object.values(state.project.sections)
  
  return (
    <div className="bg-daw-bg-secondary rounded-lg p-3 border border-daw-border">
      <h3 className="text-sm font-semibold text-daw-text-secondary mb-3">Song Structure</h3>
      
      <div className="space-y-1.5">
        {sections.map(section => (
          <div
            key={section.id}
            className={`px-2 py-1.5 rounded cursor-pointer transition-colors text-xs ${
              state.project.currentSection === section.id
                ? 'bg-daw-accent/20 border border-daw-accent text-daw-accent'
                : 'bg-daw-button hover:bg-daw-button-hover text-daw-text-primary'
            }`}
            onClick={() => {
              // TODO: Switch to section
              console.log('Switch to section:', section.id)
            }}
            draggable
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{section.name}</span>
              <span className="text-daw-text-dim">
                {section.grid.bars}b
              </span>
            </div>
          </div>
        ))}
        
        <button
          className="w-full px-2 py-1.5 border border-dashed border-daw-border rounded text-daw-text-dim hover:border-daw-accent hover:text-daw-accent transition-colors text-xs"
          onClick={() => {
            // TODO: Add new section
            console.log('Add new section')
          }}
        >
          + Add Section
        </button>
      </div>
    </div>
  )
}