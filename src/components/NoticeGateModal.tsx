import { useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface NoticeGateModalProps {
  onAccept: () => void;
}

export function NoticeGateModal({ onAccept }: NoticeGateModalProps) {
  const [declinedNotice, setDeclinedNotice] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-transparent"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-gate-title"
    >
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 bg-white/92 backdrop-blur-md border-2 border-white shadow-[0_24px_64px_rgba(14,116,144,0.25)] space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#BAE6FD] to-[#FEF08A] border border-white flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-[#0A2A43]" />
          </div>
          <h1
            id="notice-gate-title"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0A2A43]"
          >
            Thông báo cần lưu ý
          </h1>
        </div>

        <ol className="space-y-3 text-sm text-[#1E4460] leading-relaxed rounded-2xl p-4 sm:p-5 bg-[#F2FAFF]/95 border border-[#BAE6FD]">
          <li>
            <strong className="text-[#0A2A43]">1.</strong> Tất cả những Nhân Vật đều
            không có thật, những gì được mô tả, thiết lập cho nhân vật không được dùng
            để đánh giá người dùng.
          </li>
          <li>
            <strong className="text-[#0A2A43]">2.</strong> Các Nhân Vật được tạo ra
            100% vào việc giải trí, sáng tạo,... Không dùng để giáo dục tư tưởng cho bất
            kì ai.
          </li>
          <li>
            <strong className="text-[#0A2A43]">3.</strong> Không được bình luận{' '}
            <strong className="text-[#0A2A43]">MẬT KHẨU</strong> công khai!
          </li>
          <li>
            <strong className="text-[#0A2A43]">4.</strong> Vui lòng không bình luận
            khiếm nhã dưới các hồ sơ nhân vật và bình luận tương tác tiêu cực.
          </li>
        </ol>

        {declinedNotice && (
          <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 bg-[#FEF9C3]/85 border border-[#FDE047] text-xs font-bold text-[#92400E]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Bạn cần bấm <strong>Đồng ý</strong> với các lưu ý trên để có thể vào web.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => setDeclinedNotice(true)}
            className="glass-btn px-5 py-2.5 text-sm font-bold text-[#4B7796] hover:text-[#0A2A43] cursor-pointer"
          >
            Không đồng ý
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="glass-btn-lucky inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            <span>Đồng ý</span>
          </button>
        </div>
      </div>
    </div>
  );
}
