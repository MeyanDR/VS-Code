import React, { useState, useEffect } from 'react'
import { useAppState } from '../contexts/AppContext'

export default function Header() {
  const { state, dispatch } = useAppState()
  const projectName = state.project.name || 'Untitled Project'
  const [inputWidth, setInputWidth] = useState(Math.max(200, projectName.length * 12))

  const handleProjectNameChange = (e) => {
    dispatch({ type: 'SET_PROJECT_NAME', payload: e.target.value })
  }

  const handleInput = (e) => {
    setInputWidth(Math.max(200, e.target.value.length * 12))
  }

  useEffect(() => {
    setInputWidth(Math.max(200, projectName.length * 12))
  }, [projectName])

  return (
    <div className="header-container bg-daw-bg-secondary border-b border-daw-border shadow-panel px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🥁</span>
          <div>
            <h1 className="text-2xl font-bold text-daw-text-primary">
              The <span className="text-daw-accent">TROMKLUB</span> machine
            </h1>
            <p className="text-xs text-daw-text-dim">
              Made By Jan Heirman
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={projectName}
            onChange={handleProjectNameChange}
            onInput={handleInput}
            className="bg-daw-bg-panel text-lg font-medium text-daw-text-primary text-center 
              border border-daw-border rounded-md px-3 py-1.5
              hover:border-daw-accent/50 focus:border-daw-accent focus:outline-none 
              focus:ring-1 focus:ring-daw-accent/30 transition-all"
            placeholder="Enter project name..."
            style={{ minWidth: '200px', width: `${inputWidth}px` }}
          />
          <div className="text-xs text-daw-text-dim">
            v1.0.0
          </div>
        </div>
      </div>
    </div>
  )
}

