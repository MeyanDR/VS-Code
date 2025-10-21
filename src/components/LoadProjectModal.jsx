import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import safeToast from '../utils/safeToast'
import {
  FolderOpen,
  Trash2,
  Download,
  Upload,
  Copy,
  Search,
  Clock,
  FileText,
  AlertCircle,
  AlertTriangle,
  HardDrive
} from 'lucide-react'
import { projectManager } from '../services/ProjectManager'
export function LoadProjectModal({ 
  isOpen, 
  onClose, 
  onLoadProject,
  currentProjectId 
}) {
  const [projects, setProjects] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [storageInfo, setStorageInfo] = useState(null)
  const [browserStorageInfo, setBrowserStorageInfo] = useState(null)
  const [showStorageWarning, setShowStorageWarning] = useState(false)
  const toast = safeToast

  useEffect(() => {
    if (isOpen) {
      loadProjects()
      setSearchQuery('')
      setSelectedProject(null)
      setDeleteConfirm(null)
      setStorageInfo(projectManager.getStorageInfo())
      const browserInfo = projectManager.getBrowserStorageInfo()
      setBrowserStorageInfo(browserInfo)
      // Show warning if browser storage is over 4MB (80% of 5MB)
      if (browserInfo && browserInfo.browserTotal > 4 * 1024 * 1024) {
        setShowStorageWarning(true)
      }
    }
  }, [isOpen])

  const loadProjects = () => {
    const allProjects = projectManager.getAllProjects()
    // Add size information to each project
    const projectsWithSize = allProjects.map(project => ({
      ...project,
      size: projectManager.getProjectSize(project)
    }))
    setProjects(projectsWithSize.sort((a, b) => b.modifiedAt - a.modifiedAt))
  }

  const filteredProjects = projects.filter(project => {
    const query = searchQuery.toLowerCase()
    return (
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    )
  })

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const handleLoad = async () => {
    if (!selectedProject) return

    setIsLoading(true)
    try {
      const result = projectManager.loadProject(selectedProject.id)
      
      if (result.success) {
        onLoadProject(result.project, result.metadata)
        
        // Show different message if project was repaired
        if (result.wasRepaired) {
          toast({
            title: "Project loaded with repairs",
            description: `"${selectedProject.name}" had issues that were automatically fixed`
          })
        } else {
          toast({
            title: "Project loaded",
            description: `Successfully loaded "${selectedProject.name}"`
          })
        }
        onClose()
      } else {
        toast({
          title: "Failed to load project",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Load error:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (project, e) => {
    e.stopPropagation()
    
    if (deleteConfirm === project.id) {
      const result = projectManager.deleteProject(project.id)
      
      if (result.success) {
        toast({
          title: "Project deleted",
          description: `"${project.name}" has been deleted`
        })
        loadProjects()
        if (selectedProject?.id === project.id) {
          setSelectedProject(null)
        }
      } else {
        toast({
          title: "Failed to delete",
          description: result.error,
          variant: "destructive"
        })
      }
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(project.id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const handleDuplicate = (project, e) => {
    e.stopPropagation()
    
    const result = projectManager.duplicateProject(project.id)
    
    if (result.success) {
      toast({
        title: "Project duplicated",
        description: `Created copy of "${project.name}"`
      })
      loadProjects()
    } else {
      toast({
        title: "Failed to duplicate",
        description: result.error,
        variant: "destructive"
      })
    }
  }

  const handleExport = (project, e) => {
    e.stopPropagation()
    
    const result = projectManager.exportProject(project.id)
    
    if (result.success) {
      toast({
        title: "Project exported",
        description: `Downloaded "${project.name}"`
      })
    } else {
      toast({
        title: "Failed to export",
        description: result.error,
        variant: "destructive"
      })
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await projectManager.importProject(file)
      
      if (result.success) {
        toast({
          title: "Project imported",
          description: `Successfully imported "${result.project.name}"`
        })
        loadProjects()
      }
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: "Import failed",
        description: error.message || "Invalid project file",
        variant: "destructive"
      })
    }
    
    e.target.value = ''
  }
  
  const handleClearBrowserStorage = () => {
    if (window.confirm(
      'WARNING: This will clear ALL browser storage for localhost including data from other apps.\n\n' +
      'Your Tromklub projects will be deleted.\n\n' +
      'Consider exporting important projects first.\n\n' +
      'Are you sure you want to continue?'
    )) {
      const result = projectManager.clearBrowserStorage()
      
      if (result.success) {
        toast({
          title: "Browser storage cleared",
          description: "All localStorage data has been removed"
        })
        loadProjects()
        setStorageInfo(projectManager.getStorageInfo())
        setBrowserStorageInfo(projectManager.getBrowserStorageInfo())
        setShowStorageWarning(false)
      } else {
        toast({
          title: "Failed to clear storage",
          description: result.error,
          variant: "destructive"
        })
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Load Project
          </DialogTitle>
          <DialogDescription>
            Select a project to load or import from file
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-file').click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".json,.tromklub"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              {filteredProjects.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchQuery 
                    ? "No projects match your search"
                    : "No saved projects yet"
                  }
                </div>
              ) : (
                <div className="divide-y">
                  {filteredProjects.map(project => (
                    <div
                      key={project.id}
                      className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                        selectedProject?.id === project.id ? 'bg-accent' : ''
                      } ${project.id === currentProjectId ? 'ring-2 ring-primary ring-inset' : ''}`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">
                              {project.name}
                            </h3>
                            {project.id === currentProjectId && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                Current
                              </span>
                            )}
                          </div>
                          
                          {project.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(project.modifiedAt)}
                            </span>
                            <span>
                              Size: {project.size?.kb || '0'} KB
                            </span>
                            <span>
                              Created {formatDate(project.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleDuplicate(project, e)}
                            title="Duplicate project"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleExport(project, e)}
                            title="Export project"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleDelete(project, e)}
                            className={deleteConfirm === project.id ? 'text-red-600' : ''}
                            title={deleteConfirm === project.id ? 'Click again to confirm' : 'Delete project'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {showStorageWarning && browserStorageInfo && (
            <div className="border border-yellow-500 bg-yellow-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    Browser Storage Nearly Full
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Total browser storage: {browserStorageInfo.browserTotalMB} MB / 5 MB
                  </p>
                  <p className="text-xs text-yellow-700">
                    This app: {browserStorageInfo.appUsedKB} KB | Other apps: {browserStorageInfo.otherAppsKB} KB
                  </p>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="mt-2"
                    onClick={handleClearBrowserStorage}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All Browser Storage
                  </Button>
                  <p className="text-xs text-gray-600 mt-1">
                    ⚠️ This will delete ALL data from localhost apps
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                {projects.length} project{projects.length !== 1 ? 's' : ''} saved
              </span>
              {storageInfo && (
                <span className="text-xs text-gray-500">
                  Storage: {storageInfo.usedKB} KB / {storageInfo.availableMB} MB ({storageInfo.percentage}%)
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleLoad}
                disabled={!selectedProject || isLoading}
              >
                {isLoading ? 'Loading...' : 'Load Project'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}