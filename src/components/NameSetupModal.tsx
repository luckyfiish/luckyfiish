import { FormEvent, useState } from 'react';
import { CheckCircle2, Sparkles, UserRound } from 'lucide-react';

interface NameSetupModalProps {
  initialName?: string;
  canCancel?: boolean;
  onSaveName: (name: string) => void;
  onCancel?: () => void;
}

export function NameSetupModal({
  initialName = '',
  canCancel = false,
  onSaveName,
  onCancel,
}: NameSetupModalProps) {
  const [nameInput, setNameInput] = useState(initialName);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim().slice(0, 30);
    if (!trimmed) {
      setError('Vui lòng nhập tên của bạn để tiếp tục.');
      return;
    }
    onSaveName(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-transparent"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-setup-title"
    >
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 bg-white/92 backdrop-blur-md border-2 border-white shadow-[0_24px_64px_rgba(14,116,144,0.25)] space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BAE6FD] to-[#A7F3D0] border border-white flex items-center justify-center shrink-0">
            <UserRound className="w-5 h-5 text-[#0A2A43]" />
          </div>
          <div>
            <h1
              id="name-setup-title"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0A2A43]"
            >
              {canCancel ? 'Đổi tên của bạn' : 'Đặt tên của bạn'}
            </h1>
          </div>
        </div>

        <p className="text-sm text-[#285270] leading-relaxed">
          Tên này sẽ được dùng để hiển thị khi bạn <strong>bình luận</strong>, xem{' '}
          <strong>bộ sưu tập cá nhân</strong> và tương tác trên trang web.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <input
              type="text"
              autoFocus
              maxLength={30}
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (error) setError('');
              }}
              placeholder="Nhập tên hoặc biệt danh của bạn..."
              aria-label="Tên của bạn"
              className="w-full px-4 py-3 text-sm rounded-full bg-[#F2FAFF] border border-[#BAE6FD] text-[#0A2A43] placeholder:text-[#4B7796] focus:outline-none focus:border-[#0284C7]"
            />
            {error && (
              <p className="text-xs font-semibold text-[#B91C1C] px-2">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            {canCancel && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="glass-btn px-5 py-2.5 text-sm font-bold text-[#4B7796] hover:text-[#0A2A43] cursor-pointer"
              >
                Hủy
              </button>
            )}
            <button
              type="submit"
              className="glass-btn-lucky inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold cursor-pointer"
            >
              {canCancel ? (
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#15803D]" />
              )}
              <span>{canCancel ? 'Lưu tên mới' : 'Bắt đầu khám phá'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
