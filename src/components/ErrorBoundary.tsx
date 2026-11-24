import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  isQuotaExceeded: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
    isQuotaExceeded: false,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const raw = error.message || '';
    const isQuota = raw.toLowerCase().includes('quota exceeded');
    return {
      hasError: true,
      errorMessage: raw,
      isQuotaExceeded: isQuota,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMessage: '', isQuotaExceeded: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#E6F6FF] text-[#0A2A43]">
        <div className="max-w-md w-full glass-panel rounded-3xl p-7 bg-white/95 border-2 border-white shadow-[0_24px_64px_rgba(14,116,144,0.2)] space-y-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-[#DC2626]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#0A2A43]">
            {this.state.isQuotaExceeded
              ? 'Hệ thống bình luận tạm hết lượt miễn phí hôm nay'
              : 'Có lỗi kết nối dữ liệu xảy ra'}
          </h1>
          <p className="text-sm text-[#285270] leading-relaxed">
            {this.state.isQuotaExceeded
              ? 'Hạn mức đọc/ghi miễn phí trong ngày của cơ sở dữ liệu đã đạt giới hạn và sẽ tự động đặt lại vào ngày mai.'
              : 'Vui lòng tải lại trang để thử kết nối lại với phần bình luận và thả tim chung.'}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="glass-btn-lucky inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#15803D]" />
            <span>Tải lại trang</span>
          </button>
        </div>
      </div>
    );
  }
}
