import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-asvo-bg flex items-center justify-center p-6">
          <div className="bg-asvo-surface border border-asvo-border rounded-2xl p-8 max-w-lg w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-asvo-red-dim flex items-center justify-center">
              <svg className="w-8 h-8 text-asvo-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-asvo-text mb-2">Произошла ошибка</h2>
            <p className="text-asvo-text-mid mb-4">
              Что-то пошло не так при отображении этой страницы.
            </p>
            {this.state.error && (
              <pre className="text-xs text-asvo-red bg-asvo-red-dim p-3 rounded-lg mb-4 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 bg-asvo-accent text-asvo-bg rounded-xl font-bold hover:bg-asvo-accent/80 transition"
              >
                Попробовать снова
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-asvo-surface-3 text-asvo-text rounded-xl font-bold hover:bg-asvo-grey transition"
              >
                Перезагрузить
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
