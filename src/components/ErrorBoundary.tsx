import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mb-6 border border-rose-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Something went wrong</h1>
          <p className="text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
            The application encountered an unexpected error. This might be due to corrupted local data or a temporary connection issue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
            >
              Reload App
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
            >
              Clear Cache & Reset
            </button>
          </div>
          {this.state.error && (
            <div className="mt-12 p-4 bg-slate-900/50 rounded-xl border border-slate-800 max-w-2xl w-full overflow-hidden">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-2 text-left">Error Details</p>
              <pre className="text-[10px] font-mono text-rose-400/80 text-left overflow-x-auto whitespace-pre-wrap">
                {this.state.error.toString()}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
