import { useEffect, useRef, useCallback } from 'react'

const AUTOSAVE_INTERVAL = 5000 // 5 seconds
const STORAGE_KEY = 'tromklub_autosave'

export function useAutoSave(state) {
  const saveTimeoutRef = useRef(null)
  const lastSaveRef = useRef(null)
  
  const saveToLocalStorage = useCallback(() => {
    try {
      // Convert Sets to Arrays for serialization
      const stateToSave = {
        ...state,
        ui: {
          ...state.ui,
          selectedSteps: Array.from(state.ui.selectedSteps)
        }
      }
      
      const serialized = JSON.stringify(stateToSave)
      
      // Only save if state has changed
      if (serialized !== lastSaveRef.current) {
        localStorage.setItem(STORAGE_KEY, serialized)
        lastSaveRef.current = serialized
        
        // Show save notification
        showSaveNotification('Auto-saved')
      }
    } catch (error) {
      console.error('Failed to auto-save:', error)
    }
  }, [state])
  
  // Auto-save on interval
  useEffect(() => {
    const interval = setInterval(saveToLocalStorage, AUTOSAVE_INTERVAL)
    
    return () => clearInterval(interval)
  }, [saveToLocalStorage])
  
  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      saveToLocalStorage()
      // Some browsers require this for the beforeunload event
      e.returnValue = ''
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [saveToLocalStorage])
  
  // Listen for manual save events
  useEffect(() => {
    const handleSaveEvent = () => {
      saveToLocalStorage()
      showSaveNotification('Project saved')
    }
    
    window.addEventListener('save-project', handleSaveEvent)
    
    return () => {
      window.removeEventListener('save-project', handleSaveEvent)
    }
  }, [saveToLocalStorage])
  
  return {
    save: saveToLocalStorage,
    load: loadFromLocalStorage
  }
}

export function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      
      // Convert Arrays back to Sets
      if (parsed.ui && Array.isArray(parsed.ui.selectedSteps)) {
        parsed.ui.selectedSteps = new Set(parsed.ui.selectedSteps)
      }
      
      return parsed
    }
  } catch (error) {
    console.error('Failed to load saved state:', error)
  }
  return null
}

export function clearAutoSave() {
  localStorage.removeItem(STORAGE_KEY)
}

function showSaveNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div')
  notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white font-medium transition-opacity z-50 ${
    type === 'success' ? 'bg-green-600' : 'bg-red-600'
  }`
  notification.textContent = message
  notification.style.opacity = '0'
  
  document.body.appendChild(notification)
  
  // Fade in
  requestAnimationFrame(() => {
    notification.style.opacity = '1'
  })
  
  // Remove after 2 seconds
  setTimeout(() => {
    notification.style.opacity = '0'
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 2000)
}