import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected error occurred',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen flex items-center justify-center px-4 bg-[#181214] text-stone-100"
        >
          <div className="max-w-md w-full p-6 rounded-2xl border border-white/10 bg-[#22191C] text-center space-y-4 shadow-xl">
            <h1 className="text-xl font-extrabold text-white">حدث خطأ غير متوقع</h1>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              نعتذر عن هذا الخلل. يمكنك إعادة تحميل الصفحة لاستكمال رحلتك الروحية.
            </p>
            {this.state.errorMessage && (
              <p
                dir="ltr"
                className="text-[11px] font-mono text-red-300/90 bg-black/30 rounded-lg p-2.5 break-words"
              >
                {this.state.errorMessage}
              </p>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full min-h-[44px] rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-bold transition-colors cursor-pointer"
            >
              إعادة تحميل التطبيق
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
