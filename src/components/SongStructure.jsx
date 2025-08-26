import React from 'react'
import { useAppState } from '../contexts/AppContext'

export default function SongStructure() {
  const { state, dispatch } = useAppState()
  const sections = Object.values(state.project.sections)
  
  return (
    <div className="bg-slate-800/50 p-4 rounded-lg">
      <h3 className="text-cyan-400 font-bold mb-4">Song Structure</h3>
      
      <div className="space-y-2">
        {sections.map(section => (
          <div
            key={section.id}
            className={`p-3 rounded cursor-pointer transition-colors ${
              state.project.currentSection === section.id
                ? 'bg-cyan-600/20 border border-cyan-500'
                : 'bg-slate-700/50 hover:bg-slate-700'
            }`}
            onClick={() => {
              // TODO: Switch to section
              console.log('Switch to section:', section.id)
            }}
          >
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">{section.name}</span>
              <span className="text-gray-400 text-sm">
                {section.grid.bars} bars
              </span>
            </div>
          </div>
        ))}
        
        <button
          className="w-full p-3 border-2 border-dashed border-slate-600 rounded text-gray-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
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