import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0D0E0F',
            fontFamily: '"Inter", sans-serif',
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              textAlign: 'center',
              padding: '2.5rem 2rem',
              borderRadius: '1rem',
              border: '1px solid #2A2D2F',
              backgroundColor: '#16181A',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <AlertTriangle style={{ width: '24px', height: '24px', color: '#EF4444' }} />
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#F1F5F9',
                marginBottom: '0.5rem',
                letterSpacing: '-0.01em',
              }}
            >
              System Exception Detected
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: '0.8125rem',
                color: '#94A3B8',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}
            >
              An unexpected error occurred in the application runtime. 
              This has been logged for diagnostic review.
            </p>

            {/* Error details */}
            {this.state.error && (
              <div
                style={{
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  marginBottom: '1.5rem',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.6875rem',
                  color: '#EF4444',
                  wordBreak: 'break-word',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3B82F6',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase' as const,
                }}
              >
                <RotateCcw style={{ width: '14px', height: '14px' }} />
                Reload
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #2A2D2F',
                  backgroundColor: '#16181A',
                  color: '#94A3B8',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase' as const,
                }}
              >
                <Home style={{ width: '14px', height: '14px' }} />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
