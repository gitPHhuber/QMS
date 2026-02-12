import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-asvo-bg flex items-center justify-center p-6">
          <div className="bg-asvo-surface border border-asvo-border rounded-2xl p-8 max-w-md w-full text-center">
            <div className="mx-auto w-14 h-14 bg-asvo-red-dim rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="text-asvo-red" size={28} />
            </div>
            <h2 className="text-xl font-bold text-asvo-text mb-2">
              Произошла ошибка
            </h2>
            <p className="text-asvo-text-mid text-sm mb-4">
              {this.state.error?.message || "Неизвестная ошибка приложения"}
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-3 bg-asvo-accent hover:bg-asvo-accent/80 text-asvo-bg font-bold rounded-xl transition"
            >
              <RefreshCw size={18} /> Перезагрузить
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
