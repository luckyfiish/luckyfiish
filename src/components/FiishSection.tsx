import { ExternalLink, Heart, MessageCircle, Unlock } from 'lucide-react';
import { CharacterProfile } from '../types/character';

interface FiishSectionProps {
  characters: CharacterProfile[];
  userName: string;
  unlockedCount: number;
  ownedImagesCount: number;
  totalLikes: number;
  totalComments: number;
  clovers: number;
}

const CREATOR_FACEBOOK_URL = 'https://www.facebook.com/share/1A5uTiqgpB/';
const CREATOR_AVATAR_URL =
  '/assets/aistudio/Camera_XHS_1795285441236notes_pre_post_1040g3k832692i5e2k40g5p8he7np2lbk5n8ocu8_58c35a21.jpg';

export function FiishSection({
  characters,
  userName,
  unlockedCount,
  ownedImagesCount,
  totalLikes,
  totalComments,
  clovers,
}: FiishSectionProps) {
  return (
    <section className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 glass-panel rounded-3xl p-7 sm:p-9 space-y-5">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white shadow-[0_10px_28px_rgba(14,116,144,0.2)] bg-[#D6F1FE] shrink-0">
              <img
                src={CREATOR_AVATAR_URL}
                alt="Ảnh đại diện Cá May Mắn - luckyfiish"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0284C7]">
                Hồ sơ người lập web
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0A2A43]">
                Cá May Mắn
              </h1>
              <p className="text-sm font-bold text-[#285270]">luckyfiish</p>
            </div>
          </div>

          <div className="space-y-2.5 text-[15px] text-[#1E4460] leading-relaxed pt-2 border-t border-[#BAE6FD]/60">
            <p className="font-semibold text-[#0A2A43]">
              Xin chào, mình là luckyfiish, một creater tạo nhân vật AI.
            </p>
            <p>
              <strong className="text-[#0A2A43]">Tuổi:</strong> 2x+
            </p>
            <p>
              <strong className="text-[#0A2A43]">Thời gian hoạt động:</strong> Không
              rõ ràng
            </p>
            <p>
              Nếu có ý tưởng hoặc muốn góp ý, có thể thông qua link Facebook nhắn tin
              trực tiếp với mình nhé.
            </p>
            <p className="font-semibold text-[#0284C7]">
              Chúc các bạn có sự trải nghiệm thú vị, vui vẻ tại đây.
            </p>
          </div>

          <div className="pt-2">
            <a
              href={CREATOR_FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-btn-lucky inline-flex items-center gap-2.5 px-6 py-3 text-sm font-bold whitespace-nowrap shrink-0"
            >
              <span>Facebook cá nhân của luckyfiish</span>
              <ExternalLink className="w-4 h-4 text-[#0A2A43]" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="font-display text-2xl font-bold text-[#0A2A43]">
            Bộ sưu tập của {userName}
          </h2>
          <dl className="grid grid-cols-2 gap-5 pt-3 border-t border-[#0E7490]/15">
            <div>
              <dt className="text-xs text-[#4B7796] inline-flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Đã mở khóa link</span>
              </dt>
              <dd className="font-display text-3xl font-bold text-[#0A2A43] mt-1 tabular-nums">
                {unlockedCount}/{characters.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#4B7796]">Ảnh &amp; 🍀 hiện có</dt>
              <dd className="font-display text-2xl font-bold text-[#0284C7] mt-1 tabular-nums">
                {ownedImagesCount} ảnh · {clovers} 🍀
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#4B7796] inline-flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>Tổng lượt tim</span>
              </dt>
              <dd className="font-display text-3xl font-bold text-[#0A2A43] mt-1 tabular-nums">
                {totalLikes}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#4B7796] inline-flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Bình luận</span>
              </dt>
              <dd className="font-display text-3xl font-bold text-[#15803D] mt-1 tabular-nums">
                {totalComments}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
