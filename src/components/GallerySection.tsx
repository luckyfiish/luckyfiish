import { FormEvent, useState } from 'react';
import { ExternalLink, KeyRound, Lock, Sparkles } from 'lucide-react';
import { CharacterProfile } from '../types/character';
import { PortraitImage } from './PortraitImage';

interface GallerySectionProps {
  characters: CharacterProfile[];
  unlockedIds: string[];
  ownedImageIds: string[];
  visitedUnlockLinkIds: string[];
  linkVerifiedIds: string[];
  clovers: number;
  onUnlock: (id: string) => void;
  onVisitUnlockLink: (id: string) => void;
  onVerifyPassword: (id: string, password: string) => { ok: boolean; message?: string };
  onSelectCharacter: (character: CharacterProfile) => void;
  onSelectTag: (tag: string) => void;
}

export function GallerySection({
  characters,
  unlockedIds,
  ownedImageIds,
  visitedUnlockLinkIds,
  linkVerifiedIds,
  clovers,
  onUnlock,
  onVisitUnlockLink,
  onVerifyPassword,
  onSelectCharacter,
  onSelectTag,
}: GallerySectionProps) {
  const [passwordInputs, setPasswordInputs] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const handlePasswordSubmit = (e: FormEvent, charId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const res = onVerifyPassword(charId, passwordInputs[charId] || '');
    if (!res.ok) {
      setPasswordErrors((prev) => ({
        ...prev,
        [charId]: res.message || 'Mật khẩu chưa đúng.',
      }));
    } else {
      setPasswordErrors((prev) => ({ ...prev, [charId]: '' }));
      setPasswordInputs((prev) => ({ ...prev, [charId]: '' }));
    }
  };

  return (
    <section className="max-w-[1040px] mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-bold text-[#0284C7] mb-2">
          Thư Viện Hồ Sơ Nhân Vật
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0A2A43] text-balance">
          Thư Viện Luckyfish
        </h1>
        <p className="text-sm sm:text-base text-[#285270] mt-3 max-w-2xl leading-relaxed">
          Mỗi hàng hiển thị 3 khung hồ sơ nhỏ gọn. Bấm vào hình hoặc bất kỳ vị trí
          nào trên thẻ (trừ tags) để mở hồ sơ chi tiết của nhân vật.
        </p>
      </div>

      {/* 3 hồ sơ nằm trong 1 dòng: A, B, C / D, E, F */}
      {characters.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center">
          <p className="font-display text-2xl font-bold text-[#0A2A43]">
            Thư viện hiện chưa có nhân vật nào
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-3 gap-2.5 sm:gap-5 lg:gap-6">
        {characters.map((char) => {
          const isUnlocked = unlockedIds.includes(char.id);
          const isImageOwned = ownedImageIds.includes(char.id);
          const hasVisited = visitedUnlockLinkIds.includes(char.id);
          const isVerified = linkVerifiedIds.includes(char.id);

          return (
            <article
              key={char.id}
              onClick={() => onSelectCharacter(char)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectCharacter(char);
                }
              }}
              className="glass-panel rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col w-full cursor-pointer transition-all duration-200 hover:border-white hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7] group"
            >
              {/* Bấm vào hình cũng là bấm vào hồ sơ — luôn giữ nguyên màu sắc */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#D6F1FE]">
                <PortraitImage
                  src={char.portraitUrl}
                  alt={`Hình hồ sơ ${char.name}`}
                  name={char.name}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between gap-2 sm:gap-3">
                <div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold text-[#285270] tabular-nums">
                    <span>Số {char.code}</span>
                    <span>{char.age} tuổi</span>
                  </div>
                  <h2 className="font-display text-sm sm:text-xl font-bold text-[#0A2A43] group-hover:text-[#0284C7] transition-colors mt-0.5 truncate">
                    {char.name}
                  </h2>

                  {/* Tags bấm riêng được — không trigger mở hồ sơ */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                    {char.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTag(tag);
                        }}
                        className="text-[11px] font-bold text-[#0A2A43] hover:text-[#0284C7] hover:underline underline-offset-2 cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {isUnlocked ? (
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803D] mt-2">
                      <Sparkles className="w-3 h-3" />
                      <span>Đã mở khóa · Sở hữu</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4B7796] mt-2">
                      <Lock className="w-3 h-3" />
                      <span>
                        {isImageOwned
                          ? 'Đã có ảnh · Chưa mở khóa link'
                          : 'Chưa mở khóa link'}
                      </span>
                    </div>
                  )}
                </div>

                {!isUnlocked ? (
                  <div onClick={(e) => e.stopPropagation()} className="pt-1">
                    <button
                      type="button"
                      disabled={clovers < 1}
                      onClick={() => onUnlock(char.id)}
                      className="glass-btn-lucky w-full sm:w-auto inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold leading-tight cursor-pointer disabled:opacity-50"
                    >
                      <Lock className="w-3 h-3 text-[#15803D] shrink-0" />
                      <span>Mở khóa (1 🍀)</span>
                    </button>
                  </div>
                ) : !isVerified ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="space-y-2 pt-2 border-t border-[#BAE6FD]/60"
                  >
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-bold text-[#0A2A43]">
                        Link Mật Khẩu:{' '}
                        <a
                          href={char.unlockLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => onVisitUnlockLink(char.id)}
                          onAuxClick={() => onVisitUnlockLink(char.id)}
                          className="text-[#0284C7] underline underline-offset-2 hover:text-[#0A2A43]"
                        >
                          Lấy Mật khẩu
                        </a>
                        {hasVisited && <span className="ml-1 text-[#15803D]">✓</span>}
                      </div>
                      {char.passwordHint && (
                        <p className="text-[10px] italic text-[#4B7796] leading-tight">
                          *Gợi ý: {char.passwordHint}
                        </p>
                      )}
                    </div>

                    <form
                      onSubmit={(e) => handlePasswordSubmit(e, char.id)}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-1.5"
                    >
                      <div className="relative flex-1 min-w-[70px]">
                        <KeyRound className="w-3 h-3 text-[#4B7796] absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={passwordInputs[char.id] || ''}
                          onChange={(e) => {
                            setPasswordInputs((prev) => ({
                              ...prev,
                              [char.id]: e.target.value,
                            }));
                            if (passwordErrors[char.id]) {
                              setPasswordErrors((prev) => ({
                                ...prev,
                                [char.id]: '',
                              }));
                            }
                          }}
                          placeholder="Mật khẩu..."
                          aria-label={`Mật khẩu cho ${char.name}`}
                          className="w-full pl-6 sm:pl-7 pr-2 py-1 sm:py-1.5 text-[10px] sm:text-[11px] rounded-full bg-white/90 border border-[#BAE6FD] text-[#0A2A43] placeholder:text-[#4B7796] focus:outline-none focus:border-[#0284C7]"
                        />
                      </div>
                      <button
                        type="submit"
                        aria-label="Xác nhận mật khẩu"
                        title="Xác nhận mật khẩu"
                        className="glass-btn-lucky px-2.5 sm:px-3.5 py-1 text-xs sm:text-sm leading-none whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        🐬
                      </button>
                    </form>
                    {passwordErrors[char.id] && (
                      <p className="text-[10px] sm:text-[11px] font-semibold text-[#B91C1C]">
                        {passwordErrors[char.id]}
                      </p>
                    )}
                  </div>
                ) : (
                  <div onClick={(e) => e.stopPropagation()} className="pt-1">
                    <a
                      href={char.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-btn-lucky w-full sm:w-auto inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold leading-tight"
                    >
                      <span>Link Nhập Vai</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
      )}
    </section>
  );
}
