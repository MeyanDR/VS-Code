import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-800 rounded-lg p-8 shadow-xl">
            <h1 className="text-3xl font-bold text-red-400 mb-4">Something went wrong</h1>
            
            <div className="bg-gray-900 rounded p-4 mb-6">
              <p className="text-gray-300 mb-2">An error occurred while running the application.</p>
              {this.state.error && (
                <div className="mt-4">
                  <p className="text-sm font-mono text-red-300">{this.state.error.toString()}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Reload Application
              </button>
              
              <button
                onClick={() => {
                  localStorage.clear()
                  window.location.reload()
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded transition-colors"
              >
                Clear Storage & Reload
              </button>
            </div>

            <details className="mt-6">
              <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
                Technical Details
              </summary>
              <pre className="mt-4 p-4 bg-gray-900 rounded text-xs text-gray-400 overflow-auto max-h-64">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary