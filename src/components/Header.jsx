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
    <div className="header-container bg-gradient-to-r from-slate-900 to-slate-800 border-b-2 border-cyan-500/30 px-8 py-6">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-5xl">🥁</span>
          <h1 className="text-5xl font-bold">
            The <span className="text-cyan-400">TROMKLUB</span> <span className="text-cyan-300">machine</span>
          </h1>
        </div>
        
        <p className="text-gray-400 italic text-lg mb-4">
          Made By Jan Heirman
        </p>
        
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={projectName}
            onChange={handleProjectNameChange}
            onInput={handleInput}
            className="bg-transparent text-2xl font-semibold text-white text-center border-b-2 border-transparent hover:border-cyan-500/50 focus:border-cyan-500 focus:outline-none px-2 py-1 transition-colors"
            placeholder="Enter project name..."
            style={{ minWidth: '200px', width: `${inputWidth}px` }}
          />
        </div>
      </div>
    </div>
  )
}

