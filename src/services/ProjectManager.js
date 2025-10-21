class ProjectManager {
  constructor() {
    this.PROJECTS_KEY = 'tromklub_projects'
    this.LEGACY_KEY = 'tromklub_autosave'
    this.LEGACY_PROJECT_KEY = 'tromklub_project'
  }

  getAllProjects() {
    try {
      const projectsData = localStorage.getItem(this.PROJECTS_KEY)
      if (projectsData) {
        return JSON.parse(projectsData)
      }
      
      this.migrateLegacyData()
      
      const migratedData = localStorage.getItem(this.PROJECTS_KEY)
      return migratedData ? JSON.parse(migratedData) : []
    } catch (error) {
      console.error('Failed to get projects:', error)
      return []
    }
  }

  saveProject(projectData, metadata) {
    try {
      // First, test if we can write to localStorage at all
      const testKey = `tromklub_test_${Date.now()}`
      try {
        localStorage.setItem(testKey, 'test')
        localStorage.removeItem(testKey)
      } catch (testError) {
        if (testError.name === 'QuotaExceededError') {
          // Get actual browser storage info
          const totalUsed = new Blob(Object.values(localStorage)).size
          const totalMB = (totalUsed / (1024 * 1024)).toFixed(2)
          
          return {
            success: false,
            error: `Browser localStorage is full (${totalMB} MB used). This includes data from ALL websites on localhost. Click "Clear Browser Storage" in the Load dialog to free up space.`,
            isBrowserStorageFull: true
          }
        }
      }
      
      const projects = this.getAllProjects()
      const projectId = metadata.id || `project_${Date.now()}`
      
      const projectToSave = {
        id: projectId,
        name: metadata.name || 'Untitled Project',
        description: metadata.description || '',
        createdAt: metadata.createdAt || Date.now(),
        modifiedAt: Date.now(),
        data: projectData
      }
      
      const existingIndex = projects.findIndex(p => p.id === projectId)
      
      if (existingIndex >= 0) {
        projects[existingIndex] = projectToSave
      } else {
        projects.unshift(projectToSave)
      }
      
      // Limit to 20 projects to manage storage
      if (projects.length > 20) {
        // Remove oldest projects
        projects.sort((a, b) => b.modifiedAt - a.modifiedAt)
        projects.splice(20)
      }
      
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects))
      
      return { success: true, projectId }
    } catch (error) {
      console.error('Failed to save project:', error)
      
      if (error.name === 'QuotaExceededError') {
        const totalUsed = new Blob(Object.values(localStorage)).size
        const totalMB = (totalUsed / (1024 * 1024)).toFixed(2)
        
        return { 
          success: false, 
          error: `Cannot save: Browser storage is full (${totalMB} MB total). Try clearing browser storage or deleting old projects.`,
          isBrowserStorageFull: true
        }
      }
      
      return { success: false, error: error.message }
    }
  }

  loadProject(projectId) {
    try {
      const projects = this.getAllProjects()
      const project = projects.find(p => p.id === projectId)
      
      if (!project) {
        return { success: false, error: 'Project not found' }
      }
      
      // Import validator dynamically to avoid circular dependencies
      const { validateProjectData } = require('../utils/projectValidator')
      
      // Validate project data
      const validation = validateProjectData(project.data)
      
      if (!validation.valid && !validation.fixedData) {
        return { 
          success: false, 
          error: 'Project data is corrupted and cannot be recovered' 
        }
      }
      
      // Use fixed data if validation found issues
      const projectData = validation.wasFixed ? validation.fixedData : project.data
      
      // Log any fixes that were made
      if (validation.wasFixed && validation.errors.length > 0) {
        console.warn('Project data was repaired:', validation.errors)
      }
      
      this.updateProjectTimestamp(projectId)
      
      return { 
        success: true, 
        project: projectData, 
        metadata: project,
        wasRepaired: validation.wasFixed,
        repairs: validation.errors
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      return { success: false, error: error.message }
    }
  }

  deleteProject(projectId) {
    try {
      const projects = this.getAllProjects()
      const filtered = projects.filter(p => p.id !== projectId)
      
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(filtered))
      
      return { success: true }
    } catch (error) {
      console.error('Failed to delete project:', error)
      return { success: false, error: error.message }
    }
  }
  
  getProjectSize(project) {
    const dataString = project.data ? JSON.stringify(project.data) : JSON.stringify(project)
    const sizeBytes = new Blob([dataString]).size
    return {
      bytes: sizeBytes,
      kb: (sizeBytes / 1024).toFixed(1),
      mb: (sizeBytes / (1024 * 1024)).toFixed(2)
    }
  }
  
  clearAllProjects() {
    try {
      localStorage.removeItem(this.PROJECTS_KEY)
      localStorage.removeItem(this.LEGACY_KEY)
      localStorage.removeItem(this.LEGACY_PROJECT_KEY)
      return { success: true }
    } catch (error) {
      console.error('Failed to clear projects:', error)
      return { success: false, error: error.message }
    }
  }
  
  clearBrowserStorage() {
    try {
      // This clears ALL localStorage data for the current origin
      localStorage.clear()
      return { success: true }
    } catch (error) {
      console.error('Failed to clear browser storage:', error)
      return { success: false, error: error.message }
    }
  }
  
  getBrowserStorageInfo() {
    try {
      // Calculate total localStorage usage (all apps)
      const totalUsed = new Blob(Object.values(localStorage)).size
      const totalMB = (totalUsed / (1024 * 1024)).toFixed(2)
      const totalKB = (totalUsed / 1024).toFixed(1)
      
      // Get this app's usage
      const appInfo = this.getStorageInfo()
      
      return {
        browserTotal: totalUsed,
        browserTotalKB: totalKB,
        browserTotalMB: totalMB,
        appUsed: appInfo.used,
        appUsedKB: appInfo.usedKB,
        appUsedMB: appInfo.usedMB,
        otherAppsKB: ((totalUsed - appInfo.used) / 1024).toFixed(1),
        otherAppsMB: ((totalUsed - appInfo.used) / (1024 * 1024)).toFixed(2)
      }
    } catch (error) {
      console.error('Failed to get browser storage info:', error)
      return null
    }
  }

  duplicateProject(projectId, newName) {
    try {
      const projects = this.getAllProjects()
      const originalProject = projects.find(p => p.id === projectId)
      
      if (!originalProject) {
        return { success: false, error: 'Project not found' }
      }
      
      const duplicatedProject = {
        ...originalProject,
        id: `project_${Date.now()}`,
        name: newName || `${originalProject.name} (Copy)`,
        createdAt: Date.now(),
        modifiedAt: Date.now()
      }
      
      projects.unshift(duplicatedProject)
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects))
      
      return { success: true, projectId: duplicatedProject.id }
    } catch (error) {
      console.error('Failed to duplicate project:', error)
      return { success: false, error: error.message }
    }
  }

  exportProject(projectId) {
    try {
      const projects = this.getAllProjects()
      const project = projects.find(p => p.id === projectId)
      
      if (!project) {
        return { success: false, error: 'Project not found' }
      }
      
      const exportData = {
        version: '2.0.0',
        exported: new Date().toISOString(),
        project: project
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.tromklub`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      return { success: true }
    } catch (error) {
      console.error('Failed to export project:', error)
      return { success: false, error: error.message }
    }
  }

  importProject(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          
          let projectToImport
          
          if (data.version === '2.0.0' && data.project) {
            projectToImport = {
              ...data.project,
              id: `project_${Date.now()}`,
              name: `${data.project.name} (Imported)`,
              createdAt: Date.now(),
              modifiedAt: Date.now()
            }
          } else if (data.project && data.version === '1.0.0') {
            projectToImport = {
              id: `project_${Date.now()}`,
              name: 'Imported Legacy Project',
              description: 'Imported from version 1.0.0',
              createdAt: data.timestamp || Date.now(),
              modifiedAt: Date.now(),
              data: data.project
            }
          } else {
            reject(new Error('Invalid project file format'))
            return
          }
          
          const projects = this.getAllProjects()
          projects.unshift(projectToImport)
          localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects))
          
          resolve({ success: true, project: projectToImport })
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  updateProjectTimestamp(projectId) {
    try {
      const projects = this.getAllProjects()
      const projectIndex = projects.findIndex(p => p.id === projectId)
      
      if (projectIndex >= 0) {
        projects[projectIndex].modifiedAt = Date.now()
        localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects))
      }
    } catch (error) {
      console.error('Failed to update project timestamp:', error)
    }
  }

  migrateLegacyData() {
    try {
      const projects = []
      
      const legacyAutoSave = localStorage.getItem(this.LEGACY_KEY)
      if (legacyAutoSave) {
        try {
          const data = JSON.parse(legacyAutoSave)
          projects.push({
            id: 'legacy_autosave',
            name: 'Auto-saved Project',
            description: 'Migrated from auto-save',
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            data: data
          })
        } catch (e) {
          console.warn('Failed to migrate auto-save data:', e)
        }
      }
      
      const legacyProject = localStorage.getItem(this.LEGACY_PROJECT_KEY)
      if (legacyProject) {
        try {
          const data = JSON.parse(legacyProject)
          projects.push({
            id: 'legacy_project',
            name: 'Previous Project',
            description: 'Migrated from previous save',
            createdAt: data.timestamp || Date.now(),
            modifiedAt: data.timestamp || Date.now(),
            data: data.project || data
          })
        } catch (e) {
          console.warn('Failed to migrate project data:', e)
        }
      }
      
      if (projects.length > 0) {
        localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects))
        
        // Clean up legacy data after successful migration
        localStorage.removeItem(this.LEGACY_KEY)
        localStorage.removeItem(this.LEGACY_PROJECT_KEY)
        console.log('Legacy data migrated and cleaned up successfully')
      }
    } catch (error) {
      console.error('Failed to migrate legacy data:', error)
    }
  }

  getStorageInfo() {
    // Only count storage used by this app
    let appStorageUsed = 0
    const appKeys = [
      this.PROJECTS_KEY,
      this.LEGACY_KEY,
      this.LEGACY_PROJECT_KEY
    ]
    
    for (const key of appKeys) {
      const value = localStorage.getItem(key)
      if (value) {
        appStorageUsed += new Blob([value]).size
      }
    }
    
    // Browser localStorage limit is typically 5-10MB
    const available = 5 * 1024 * 1024 // 5MB
    const percentage = (appStorageUsed / available) * 100
    
    return {
      used: appStorageUsed,
      usedKB: (appStorageUsed / 1024).toFixed(1),
      usedMB: (appStorageUsed / (1024 * 1024)).toFixed(2),
      available,
      availableMB: (available / (1024 * 1024)).toFixed(0),
      percentage: percentage.toFixed(1),
      remaining: available - appStorageUsed,
      remainingKB: ((available - appStorageUsed) / 1024).toFixed(1)
    }
  }
}

export const projectManager = new ProjectManager()