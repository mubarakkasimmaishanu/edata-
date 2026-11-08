import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // If dynamic chunk loading failed (usually caused by a new production deployment)
    const isChunkError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.message?.includes('Loading chunk') ||
      error?.name === 'ChunkLoadError';

    if (isChunkError) {
      const lastReload = sessionStorage.getItem('edata_chunk_reload');
      const now = Date.now();
      // Reload automatically if not done in the last 10 seconds
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('edata_chunk_reload', String(now));
        window.location.reload();
      }
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[360px] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1.5">
            Update or connection issue
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5">
            A new update may have been deployed or the connection was interrupted while loading this section.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-sm active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Page
            </button>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors active:scale-95"
            >
              <Home className="w-3.5 h-3.5" />
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
