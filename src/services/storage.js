import { store } from '../core/state.js'
import { loadProject } from '../core/actions.js'

class StorageService {
  constructor() {
    this.STORAGE_KEY = 'tromklub_project'
    this.AUTO_SAVE_KEY = 'tromklub_autosave'
    this.autoSaveInterval = null
  }

  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.autoSave()
    }, 5000)
    
    window.addEventListener('beforeunload', () => {
      this.autoSave()
    })
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }

  autoSave() {
    const state = store.getState()
    const saveData = {
      project: state.project,
      timestamp: Date.now()
    }
    
    try {
      localStorage.setItem(this.AUTO_SAVE_KEY, JSON.stringify(saveData))
      return true
    } catch (error) {
      console.error('Auto-save failed:', error)
      return false
    }
  }

  saveProject() {
    const state = store.getState()
    const saveData = {
      project: state.project,
      version: '1.0.0',
      timestamp: Date.now()
    }
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData))
      this.showSaveNotification('Project saved successfully')
      return true
    } catch (error) {
      console.error('Failed to save project:', error)
      this.showSaveNotification('Failed to save project', 'error')
      return false
    }
  }

  loadProject() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.project) {
          const projectData = this.migrateProjectData(data.project)
          store.dispatch(loadProject(projectData))
          this.showSaveNotification('Project loaded successfully')
          return true
        }
      }
      
      const autoSaved = localStorage.getItem(this.AUTO_SAVE_KEY)
      if (autoSaved) {
        const data = JSON.parse(autoSaved)
        if (data.project) {
          const projectData = this.migrateProjectData(data.project)
          store.dispatch(loadProject(projectData))
          this.showSaveNotification('Auto-save restored')
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('Failed to load project:', error)
      return false
    }
  }

  migrateProjectData(projectData) {
    if (projectData.sections) {
      Object.values(projectData.sections).forEach(section => {
        section.instruments.forEach(instrument => {
          if (!instrument.pattern) {
            instrument.pattern = []
          }
        })
      })
    }
    return projectData
  }

  downloadProject() {
    const state = store.getState()
    const saveData = {
      project: state.project,
      version: '1.0.0',
      timestamp: Date.now()
    }
    
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.project.name || 'tromklub-project'}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    this.showSaveNotification('Project downloaded successfully')
  }

  uploadProject(file) {
    return this.importProjectFile(file)
  }

  importProjectFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (data.project) {
            const projectData = this.migrateProjectData(data.project)
            store.dispatch(loadProject(projectData))
            this.showSaveNotification('Project imported successfully')
            resolve(true)
          } else {
            reject(new Error('Invalid project file'))
          }
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  clearStorage() {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      localStorage.removeItem(this.AUTO_SAVE_KEY)
      return true
    } catch (error) {
      console.error('Failed to clear storage:', error)
      return false
    }
  }

  showSaveNotification(message, type = 'success') {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white font-semibold text-sm z-50 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.opacity = '0'
      notification.style.transition = 'opacity 0.3s'
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 300)
    }, 2000)
  }

  getStorageInfo() {
    const used = new Blob(Object.values(localStorage)).size
    const available = 5 * 1024 * 1024
    const percentage = (used / available) * 100
    
    return {
      used,
      available,
      percentage: percentage.toFixed(2)
    }
  }
}

export const storageService = new StorageService()