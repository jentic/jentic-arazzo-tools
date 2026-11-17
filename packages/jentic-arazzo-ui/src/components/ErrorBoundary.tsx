import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** what failed, e.g. "This workflow"; used by the default fallback */
  label?: string;
  /** replaces the default fallback; `null` renders nothing */
  fallback?: React.ReactNode;
  /** the boundary recovers when this value changes, e.g. when a new document is loaded */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Contains render errors to one part of the viewer, so an invalid document still shows
 * everything that can be displayed.
 */
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

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return (
        <RenderErrorNotice
          label={this.props.label}
          message={this.state.error?.message ?? String(this.state.error)}
        />
      );
    }

    return this.props.children;
  }
}

export const RenderErrorNotice: React.FC<{ label?: string; message: string }> = ({
  label = 'This part of the document',
  message,
}) => (
  <div
    role="alert"
    style={{
      margin: '8px 0',
      padding: '10px 14px',
      border: '1px solid #fca5a5',
      borderRadius: 6,
      background: '#fef2f2',
      color: '#991b1b',
      fontSize: 13,
      lineHeight: 1.5,
    }}
  >
    {label} couldn't be displayed, which usually means the document is invalid. The Validation
    section of the docs view lists its problems.
    <details style={{ marginTop: 4 }}>
      <summary style={{ cursor: 'pointer', fontSize: 12 }}>Details</summary>
      <code style={{ fontSize: 12, wordBreak: 'break-word' }}>{message}</code>
    </details>
  </div>
);
