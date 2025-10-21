import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/main.css'

console.log('index-debug.jsx loaded');

function DebugApp() {
  console.log('DebugApp component rendering');
  
  return (
    <div style={{ 
      background: 'white', 
      color: 'black', 
      padding: '20px',
      minHeight: '100vh'
    }}>
      <h1>Debug Mode - App is Loading</h1>
      <p>If you see this, React is working!</p>
      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
        <h2>Checking Components:</h2>
        <ul>
          <li>✓ React loaded</li>
          <li>✓ ReactDOM loaded</li>
          <li>✓ Component rendering</li>
        </ul>
      </div>
    </div>
  )
}

try {
  console.log('Looking for root element...');
  const rootElement = document.getElementById('app');
  console.log('Root element:', rootElement);
  
  if (rootElement) {
    console.log('Creating React root...');
    const root = ReactDOM.createRoot(rootElement);
    console.log('Rendering DebugApp...');
    root.render(<DebugApp />);
    console.log('Render complete');
  } else {
    console.error('Could not find root element with id="app"');
  }
} catch (error) {
  console.error('Error during initialization:', error);
  document.body.innerHTML = `
    <div style="background: red; color: white; padding: 20px;">
      <h1>Error Loading App</h1>
      <pre>${error.message}</pre>
      <pre>${error.stack}</pre>
    </div>
  `;
}