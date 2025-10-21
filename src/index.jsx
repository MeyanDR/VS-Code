import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles/main.css'

console.log('index.jsx: Starting application...')
console.log('index.jsx: React version:', React.version)

const rootElement = document.getElementById('app')
console.log('index.jsx: Root element found:', rootElement)

if (!rootElement) {
  console.error('index.jsx: FATAL - No root element with id="app" found!')
  document.body.innerHTML = '<div style="background: red; color: white; padding: 20px;">No root element found!</div>'
} else {
  try {
    console.log('index.jsx: Creating React root...')
    const root = ReactDOM.createRoot(rootElement)
    
    console.log('index.jsx: Rendering App with ErrorBoundary...')
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    )
    console.log('index.jsx: Render call completed')
  } catch (error) {
    console.error('index.jsx: Error during render:', error)
    rootElement.innerHTML = `<div style="background: red; color: white; padding: 20px;">
      <h1>Render Error</h1>
      <pre>${error.message}</pre>
    </div>`
  }
}