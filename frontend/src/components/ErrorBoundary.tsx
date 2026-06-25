import { Component, type ErrorInfo, type ReactNode } from 'react';
import { t } from '../i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-error-bg)] flex items-center justify-center mx-auto mb-4">
              <span className="text-[var(--color-error)] text-xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-semibold text-[var(--fg-primary)] mb-2">
              {t('error_boundary_title')}
            </h2>
            <p className="text-sm text-[var(--fg-secondary)] mb-2">
              {t('error_boundary_message')}
            </p>
            {this.state.errorMessage && (
              <p className="text-xs text-[var(--fg-muted)] font-mono bg-[var(--bg-elevated)] rounded-lg px-3 py-2 mb-6 break-words">
                {this.state.errorMessage}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="px-5 py-2 bg-[var(--skelica-accent)] hover:opacity-90 text-white text-sm font-medium rounded-lg transition-opacity"
            >
              {t('error_boundary_retry')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
