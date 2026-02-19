import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.error('[ErrorBoundary] Rendering fallback due to error:', this.state.error);
      return (
        this.props.fallback || (
          <div style={{ padding: 20, color: 'red', border: '2px solid red', margin: 10 }}>
            <h3>Something went wrong</h3>
            <pre style={{ fontSize: 12, background: '#fee', padding: 10, overflow: 'auto' }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
