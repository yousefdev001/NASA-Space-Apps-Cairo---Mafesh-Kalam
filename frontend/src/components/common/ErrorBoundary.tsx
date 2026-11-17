import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in AuraMed component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/mission-control';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 shadow-[0_0_25px_rgba(244,63,94,0.3)]">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-lg mb-6">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-rose-400 border border-rose-500/40 bg-rose-950/40 px-2.5 py-0.5 rounded-full">
              MISSION TELEMETRY FAULT DETECTED
            </span>
            <h1 className="text-xl sm:text-2xl font-mono font-black tracking-tight text-white">
              An unexpected render anomaly occurred
            </h1>
            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              {this.state.error?.message || 'A client-side component encountered an unhandled exception.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400 hover:bg-cyan-500/30 font-mono text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.2)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Telemetry Stream
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-mono text-xs font-bold transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              Return to Mission Control
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
