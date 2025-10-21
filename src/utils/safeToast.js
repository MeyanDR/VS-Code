import { toast } from '../hooks/useToast'

export const safeToast = (props) => {
  try {
    // Ensure props are valid
    const safeProps = {
      title: props?.title || 'Notification',
      description: props?.description || '',
      variant: props?.variant || 'default'
    }
    
    // Filter out undefined values
    Object.keys(safeProps).forEach(key => {
      if (safeProps[key] === undefined) {
        delete safeProps[key]
      }
    })
    
    return toast(safeProps)
  } catch (error) {
    console.error('Toast error:', error)
    // Fallback to console if toast fails
    console.log(`[${props?.variant || 'info'}] ${props?.title}: ${props?.description}`)
    return { id: null, dismiss: () => {}, update: () => {} }
  }
}

export default safeToast