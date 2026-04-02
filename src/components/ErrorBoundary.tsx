import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('NEON-GRID render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b18] text-white flex items-center justify-center px-6">
          <div className="max-w-2xl text-left space-y-4 rounded-3xl border border-white/10 bg-black/60 p-8">
            <p className="text-xs font-mono tracking-[0.35em] text-neon-cyan uppercase">Render interrupted</p>
            <h1 className="text-4xl font-black italic tracking-tighter">
              NEON<span className="text-neon-magenta">GRID</span>
            </h1>
            <p className="text-sm text-white/70 font-mono leading-relaxed">
              The interface hit a runtime error instead of going blank.
            </p>
            <pre className="whitespace-pre-wrap wrap-break-word text-xs text-white/80 font-mono rounded-2xl border border-white/10 bg-black/40 p-4 max-h-[50vh] overflow-auto">
{this.state.error?.message || 'Unknown error'}

{this.state.error?.stack || this.state.errorInfo?.componentStack || ''}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
