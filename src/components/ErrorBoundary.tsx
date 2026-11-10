import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[ErrorBoundary caught an error]:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[320px] flex items-center justify-center p-6 bg-[#FAF6EE] border border-[#D8C9AD] rounded-3xl m-4 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#263D30]">
              {this.props.fallbackTitle || 'Something went wrong loading this section'}
            </h3>
            <p className="text-xs text-[#302C26]/75 leading-relaxed">
              Our Vedic dairy platform recovered safely. Please refresh or try again in a moment.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#263D30] hover:bg-[#1E3026] text-[#FAF6EE] rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Section</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
