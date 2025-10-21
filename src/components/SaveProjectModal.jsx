import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Save, AlertCircle, HardDrive } from 'lucide-react'
import { projectManager } from '../services/ProjectManager'

export function SaveProjectModal({ 
  isOpen, 
  onClose, 
  currentState, 
  existingProject = null,
  onSaveSuccess 
}) {
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [storageInfo, setStorageInfo] = useState(null)

  useEffect(() => {
    if (isOpen) {
      if (existingProject) {
        setProjectName(existingProject.name || '')
        setDescription(existingProject.description || '')
      } else {
        setProjectName(currentState?.project?.name || 'My Project')
        setDescription('')
      }
      setError('')
      
      const info = projectManager.getStorageInfo()
      setStorageInfo(info)
    }
  }, [isOpen, existingProject, currentState])

  const handleSave = async () => {
    if (!projectName.trim()) {
      setError('Please enter a project name')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const serializable = {
        ...currentState,
        ui: {
          ...currentState.ui,
          selectedSteps: currentState.ui?.selectedSteps 
            ? Array.from(currentState.ui.selectedSteps) 
            : []
        }
      }

      const metadata = {
        id: existingProject?.id,
        name: projectName.trim(),
        description: description.trim(),
        createdAt: existingProject?.createdAt
      }

      const result = projectManager.saveProject(serializable, metadata)

      if (result.success) {
        window.dispatchEvent(new CustomEvent('project-saved', {
          detail: { projectId: result.projectId, name: projectName }
        }))
        
        if (onSaveSuccess) {
          onSaveSuccess(result.projectId, projectName)
        }
        
        onClose()
      } else {
        // Show more helpful error message if it's a browser storage issue
        if (result.isBrowserStorageFull) {
          setError(result.error || 'Browser storage is full. Open the Load dialog and use "Clear Browser Storage" to free up space.')
        } else {
          setError(result.error || 'Failed to save project')
        }
      }
    } catch (err) {
      console.error('Save error:', err)
      setError('An unexpected error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            {existingProject ? 'Update Project' : 'Save Project'}
          </DialogTitle>
          <DialogDescription>
            {existingProject 
              ? 'Update your project with the current changes'
              : 'Save your current work as a project'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter project name..."
              autoFocus
              maxLength={100}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for your project..."
              maxLength={500}
            />
            <span className="text-xs text-gray-500 text-right">
              {description.length}/500
            </span>
          </div>

          {storageInfo && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <HardDrive className="w-4 h-4" />
                <span>
                  Browser Storage: {storageInfo.usedKB} KB / {storageInfo.availableMB} MB used ({storageInfo.percentage}%)
                </span>
              </div>
              {parseFloat(storageInfo.percentage) > 80 && (
                <span className="text-sm text-yellow-600 ml-6">
                  ⚠️ Storage nearly full - consider deleting old projects
                </span>
              )}
              <span className="text-xs text-gray-500 ml-6">
                This app stores projects in your browser's local storage
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !projectName.trim()}
          >
            {isSaving ? 'Saving...' : (existingProject ? 'Update' : 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}