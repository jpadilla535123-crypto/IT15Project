import { Component } from 'react'
import { RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleReset() {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || String(this.state.error)
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-8 text-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Something went wrong</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-[#9CA3AF]">
              An unexpected error occurred while rendering this page. Try reloading, or go back to the dashboard.
            </p>
            <p className="mt-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-mono text-rose-600 dark:text-rose-300 break-words">
              {msg}
            </p>
            <button
              onClick={this.handleReset}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FF2B66] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity">
              <RefreshCw size={16} /> Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}