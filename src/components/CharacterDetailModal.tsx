import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  ExternalLink,
  Heart,
  Images,
  KeyRound,
  Lock,
  MessageCircle,
  Send,
  X,
} from 'lucide-react';
import { CharacterComment, CharacterProfile } from '../types/character';
import { PortraitImage } from './PortraitImage';
import { OceanLuckyAtmosphere } from './OceanLuckyAtmosphere';

interface CharacterDetailModalProps {
  character: CharacterProfile | null;
  isUnlocked: boolean;
  hasVisitedUnlockLink: boolean;
  isLinkVerified: boolean;
  clovers: number;
  totalCount: number;
  currentIndex: number;
  likesCount: number;
  isLiked: boolean;
  comments: CharacterComment[];
  onUnlock: (id: string) => void;
  onVisitUnlockLink: (id: string) => void;
  onVerifyPassword: (id: string, password: string) => { ok: boolean; message?: string };
  onSelectTag: (tag: string) => void;
  onToggleLike: (id: string) => void;
  onAddComment: (id: string, author: string, content: string) => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function CharacterDetailModal({
  character,
  isUnlocked,
  hasVisitedUnlockLink,
  isLinkVerified,
  clovers,
  totalCount,
  currentIndex,
  likesCount,
  isLiked,
  comments,
  onUnlock,
  onVisitUnlockLink,
  onVerifyPassword,
  onSelectTag,
  onToggleLike,
  onAddComment,
  onClose,
  onPrev,
  onNext,
}: CharacterDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [authorInput, setAuthorInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isBackstoryExpanded, setIsBackstoryExpanded] = useState(false);
  const [isPhotosOpen, setIsPhotosOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [modalScrollY, setModalScrollY] = useState(0);
  const [burstTrigger, setBurstTrigger] = useState<{
    x: number;
    y: number;
    tick: number;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCopied(false);
    setCommentInput('');
    setPasswordInput('');
    setPasswordError('');
    setIsBackstoryExpanded(false);
    setIsPhotosOpen(false);
    setLightboxIndex(null);
    setModalScrollY(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [character?.id]);

  useEffect(() => {
    if (!character) return;
    const photoCount = Array.from(
      new Set([character.portraitUrl, ...(character.galleryImages ?? [])].filter(Boolean))
    ).length;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (lightboxIndex !== null) {
          setLightboxIndex(null);
        } else {
          onClose();
        }
      } else if (event.key === 'ArrowLeft') {
        if (lightboxIndex !== null && photoCount > 1) {
          setLightboxIndex((prev) =>
            prev === null ? 0 : prev <= 0 ? photoCount - 1 : prev - 1
          );
        } else if (lightboxIndex === null && totalCount > 1) {
          onPrev();
        }
      } else if (event.key === 'ArrowRight') {
        if (lightboxIndex !== null && photoCount > 1) {
          setLightboxIndex((prev) =>
            prev === null ? 0 : prev >= photoCount - 1 ? 0 : prev + 1
          );
        } else if (lightboxIndex === null && totalCount > 1) {
          onNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [character, totalCount, lightboxIndex, onClose, onPrev, onNext]);

  if (!character) return null;

  const handleCopyLink = async () => {
    if (!isLinkVerified || !character.link) return;
    try {
      await navigator.clipboard.writeText(character.link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleSubmitComment = (e: FormEvent) => {
    e.preventDefault();
    const content = commentInput.trim();
    if (!content) return;
    onAddComment(character.id, authorInput.trim() || 'Khách ghé thăm', content);
    setCommentInput('');
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    const res = onVerifyPassword(character.id, passwordInput);
    if (!res.ok) {
      setPasswordError(res.message || 'Mật khẩu chưa đúng.');
    } else {
      setPasswordError('');
      setPasswordInput('');
    }
  };

  const triggerBurst = (x: number, y: number) => {
    setBurstTrigger({ x, y, tick: Date.now() });
  };

  const formattedBackstory = character.backstory
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const isLongBackstory =
    formattedBackstory.length > 3 || character.backstory.length > 520;

  const characterPhotos = Array.from(
    new Set([character.portraitUrl, ...(character.galleryImages ?? [])].filter(Boolean))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#D6F0FF]/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="character-dossier-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col bg-white/95 backdrop-blur-2xl border-2 border-white shadow-[0_24px_64px_rgba(14,116,144,0.2)]"
        onClick={(e) => triggerBurst(e.clientX, e.clientY)}
      >
        <OceanLuckyAtmosphere
          scoped
          externalScrollY={modalScrollY}
          burstTrigger={burstTrigger}
        />

        {/* Top bar: số thứ tự và tags nhỏ ở góc bên trái */}
        <div className="relative z-30 flex items-center justify-between gap-4 px-6 py-4 border-b border-[#BAE6FD]/60 bg-[#F2FAFF]/95">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#285270] tabular-nums min-w-0">
            <span className="font-bold text-[#0A2A43]">{character.code}</span>
            <span aria-hidden="true">·</span>
            {character.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTag(tag);
                  onClose();
                }}
                className="font-bold text-[#0A2A43] hover:text-[#0284C7] hover:underline underline-offset-2 cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {totalCount > 1 && (
              <>
                <span className="text-xs font-semibold text-[#4B7796] mr-1 tabular-nums hidden sm:inline">
                  {currentIndex + 1}/{totalCount}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrev();
                  }}
                  aria-label="Nhân vật trước"
                  className="glass-btn p-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNext();
                  }}
                  aria-label="Nhân vật tiếp theo"
                  className="glass-btn p-2 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Đóng hồ sơ"
              className="glass-btn inline-flex items-center justify-center w-9 h-9 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0284C7]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable dossier content — luôn hiển thị đầy đủ Tên, Tuổi, Giới tính, Ngoại hình, Backstory, Tags; chỉ khóa phần Link nhân vật */}
        <div
          ref={scrollRef}
          onScroll={(e) => setModalScrollY(e.currentTarget.scrollTop)}
          className="relative z-30 overflow-y-auto px-6 sm:px-10 py-8 space-y-6"
        >
          {/* 1. Ảnh ở giữa */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-[280px] sm:max-w-[310px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white shadow-[0_16px_36px_rgba(14,116,144,0.16)] bg-[#D6F1FE]">
              <PortraitImage
                src={character.portraitUrl}
                alt={`Chân dung nhân vật ${character.name}`}
                name={character.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 2. Tên (khung trái) & Tuổi, Giới tính (khung phải) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5 bg-[#F2FAFF]/95 border border-[#BAE6FD] shadow-[0_6px_18px_rgba(14,116,144,0.06)]">
              <div className="text-xs font-semibold text-[#4B7796]">
                Tên nhân vật
              </div>
              <h2
                id="character-dossier-title"
                className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0A2A43] mt-1"
              >
                {character.name}
              </h2>
              <p className="text-xs font-semibold text-[#0284C7] mt-1">
                {character.role}
              </p>
            </div>

            <div className="rounded-2xl p-5 bg-[#F2FAFF]/95 border border-[#BAE6FD] shadow-[0_6px_18px_rgba(14,116,144,0.06)] flex flex-col justify-center sm:text-right">
              <div className="text-xs font-semibold text-[#4B7796]">
                Tuổi &amp; Giới tính
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-[#0A2A43] mt-1 tabular-nums">
                {character.age} tuổi
              </div>
              <div className="text-sm font-bold text-[#0284C7] mt-1">
                Giới tính: {character.gender}
              </div>
            </div>
          </div>

          {/* 3. Ngoại hình */}
          <section aria-labelledby="section-appearance">
            <h3
              id="section-appearance"
              className="text-sm font-bold text-[#0A2A43] mb-2"
            >
              Ngoại hình
            </h3>
            <p className="text-[15px] text-[#1E4460] leading-relaxed">
              {character.appearance}
            </p>
          </section>

          {/* 4. Dòng gạch mỏng nhỏ */}
          <hr className="w-28 mx-auto border-0 border-t border-[#0284C7]/25 my-2" />

          {/* 5. Backstory */}
          <section aria-labelledby="section-backstory">
            <h3
              id="section-backstory"
              className="text-sm font-bold text-[#0A2A43] mb-2"
            >
              Backstory
            </h3>
            <div className="relative">
              <div
                className={`space-y-3 text-[15px] text-[#1E4460] leading-relaxed transition-all duration-300 ${
                  isLongBackstory && !isBackstoryExpanded
                    ? 'max-h-[210px] overflow-hidden'
                    : ''
                }`}
              >
                {formattedBackstory.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {isLongBackstory && !isBackstoryExpanded && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent"
                />
              )}
            </div>

            {isLongBackstory && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBackstoryExpanded((prev) => !prev);
                  }}
                  className="glass-btn inline-flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold text-[#0284C7] hover:text-[#0A2A43] cursor-pointer"
                >
                  <span>{isBackstoryExpanded ? 'Thu gọn' : 'Xem thêm'}</span>
                  {isBackstoryExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}

            {/* Tags dưới Backstory */}
            <div className="mt-4 pt-3 border-t border-[#BAE6FD]/50">
              <div className="text-xs font-semibold text-[#4B7796] mb-2">Tags</div>
              <div className="flex flex-wrap items-center gap-2">
                {character.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTag(tag);
                      onClose();
                    }}
                    className="glass-btn px-3.5 py-1 text-xs font-bold text-[#0A2A43] hover:text-[#0284C7] cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 5b. Mục Ảnh (mặc định có 1 ảnh chân dung, tự động hiển thị thêm khi cập nhật galleryImages) */}
          <section
            aria-labelledby="section-photos"
            className="pt-4 border-t border-[#BAE6FD]/70 space-y-3"
          >
            <button
              type="button"
              id="section-photos"
              aria-expanded={isPhotosOpen}
              onClick={(e) => {
                e.stopPropagation();
                setIsPhotosOpen((prev) => !prev);
              }}
              className="glass-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#0A2A43] hover:text-[#0284C7] cursor-pointer"
            >
              <Images className="w-4 h-4 text-[#0284C7]" />
              <span>Ảnh ({characterPhotos.length})</span>
              {isPhotosOpen ? (
                <ChevronUp className="w-4 h-4 text-[#4B7796]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#4B7796]" />
              )}
            </button>

            {isPhotosOpen && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {characterPhotos.map((photoUrl, idx) => (
                  <button
                    key={`${photoUrl}-${idx}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(idx);
                    }}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white shadow-[0_10px_24px_rgba(14,116,144,0.14)] bg-[#D6F1FE] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0284C7]"
                  >
                    <PortraitImage
                      src={photoUrl}
                      alt={`${character.name} - Ảnh ${idx + 1}`}
                      name={character.name}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/85 text-[#0A2A43] backdrop-blur-sm">
                      {idx + 1}/{characterPhotos.length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* 6. Link nhân vật (chỉ khóa chỗ Link nhân vật -> Mở khóa 1 🍀 -> Link Mật Khẩu + Khung nhập + nút 🐬 -> Link Nhập Vai) */}
          <section
            aria-labelledby="section-link"
            className="pt-4 border-t border-[#BAE6FD]/70 space-y-3"
          >
            <h3 id="section-link" className="text-sm font-bold text-[#0A2A43]">
              Link nhân vật
            </h3>

            {!isUnlocked ? (() => {
              const unlockCost = character.isRare ? 25 : 1;
              return (
                <div className="rounded-2xl p-5 bg-[#F2FAFF]/95 border border-[#BAE6FD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0A2A43]">
                      <Lock className="w-4 h-4 text-[#0284C7]" />
                      <span>Liên kết nhân vật đang được khóa</span>
                    </div>
                    <p className="text-xs text-[#285270]">
                      Mở khóa bằng <strong className="text-[#0A2A43]">{unlockCost} 🍀</strong>
                      {character.isRare ? ' (hoặc nhận qua Vòng Quay Đại Dương)' : ''} để hiện
                      link lấy mật khẩu và link nhập vai. (Bạn có: {clovers} 🍀)
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={clovers < unlockCost}
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerBurst(e.clientX, e.clientY);
                      onUnlock(character.id);
                    }}
                    className="glass-btn-lucky inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4 text-[#15803D]" />
                    <span>Mở khóa ({unlockCost} 🍀)</span>
                  </button>
                </div>
              );
            })() : !isLinkVerified ? (
              <div className="rounded-2xl p-4 bg-[#F2FAFF]/95 border border-[#BAE6FD] space-y-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0A2A43]">
                      Link Mật Khẩu:{' '}
                      <a
                        href={character.unlockLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVisitUnlockLink(character.id);
                        }}
                        onAuxClick={(e) => {
                          e.stopPropagation();
                          onVisitUnlockLink(character.id);
                        }}
                        className="text-[#0284C7] underline underline-offset-4 hover:text-[#0A2A43]"
                      >
                        Lấy Mật khẩu
                      </a>
                      {hasVisitedUnlockLink && (
                        <span className="ml-2 text-[#15803D]">✓</span>
                      )}
                    </span>
                  </div>
                  {character.passwordHint && (
                    <p className="text-[11px] italic text-[#4B7796]">
                      *Gợi ý: {character.passwordHint}
                    </p>
                  )}
                </div>

                <form
                  onSubmit={handlePasswordSubmit}
                  onClick={(e) => e.stopPropagation()}
                  className="flex flex-wrap items-center gap-2"
                >
                  <div className="relative flex-1 min-w-[180px]">
                    <KeyRound className="w-3.5 h-3.5 text-[#4B7796] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      placeholder="Nhập mật khẩu..."
                      aria-label="Khung nhập mật khẩu"
                      className="w-full pl-9 pr-3.5 py-2 text-xs rounded-full bg-white border border-[#BAE6FD] text-[#0A2A43] placeholder:text-[#4B7796] focus:outline-none focus:border-[#0284C7]"
                    />
                  </div>
                  <button
                    type="submit"
                    aria-label="Xác nhận mật khẩu"
                    title="Xác nhận mật khẩu"
                    className="glass-btn-lucky px-5 py-2 text-base leading-none whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    🐬
                  </button>
                </form>

                {passwordError && (
                  <p className="text-xs font-semibold text-[#B91C1C]">
                    {passwordError}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={character.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-btn-lucky inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold whitespace-nowrap shrink-0"
                >
                  <span>Link Nhập Vai ({character.linkLabel})</span>
                  <ExternalLink className="w-4 h-4 text-[#0A2A43]" />
                </a>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyLink();
                  }}
                  className="glass-btn inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-[#15803D]" />
                      <span>Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#0284C7]" />
                      <span>Sao chép link</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* 7. Thả tim & Bình luận */}
          <section
            aria-labelledby="section-reactions"
            className="pt-5 border-t border-[#BAE6FD]/70 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0A2A43]">
                <MessageCircle className="w-4 h-4 text-[#0284C7]" />
                <h3 id="section-reactions">
                  Cảm nhận &amp; Bình luận ({comments.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerBurst(e.clientX, e.clientY);
                  onToggleLike(character.id);
                }}
                className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                  isLiked ? 'glass-btn-lucky' : 'glass-btn'
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-transform ${
                    isLiked
                      ? 'fill-[#E11D48] text-[#E11D48] scale-110'
                      : 'text-[#285270]'
                  }`}
                />
                <span>{isLiked ? 'Đã thả tim' : 'Thả tim'}</span>
                <span className="tabular-nums text-xs opacity-85">
                  · {likesCount}
                </span>
              </button>
            </div>

            <form
              onSubmit={handleSubmitComment}
              onClick={(e) => e.stopPropagation()}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  placeholder="Tên của bạn (tùy chọn)"
                  aria-label="Tên người bình luận"
                  className="px-4 py-2.5 text-sm rounded-full bg-[#F2FAFF] border border-[#BAE6FD] text-[#0A2A43] placeholder:text-[#4B7796] focus:outline-none focus:border-[#0284C7]"
                />
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Viết bình luận cho hồ sơ nhân vật..."
                    aria-label="Nội dung bình luận"
                    className="flex-1 px-4 py-2.5 text-sm rounded-full bg-[#F2FAFF] border border-[#BAE6FD] text-[#0A2A43] placeholder:text-[#4B7796] focus:outline-none focus:border-[#0284C7]"
                  />
                  <button
                    type="submit"
                    className="glass-btn-lucky inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi</span>
                  </button>
                </div>
              </div>
            </form>

            {comments.length > 0 ? (
              <ul className="space-y-2.5">
                {comments.map((comment) => (
                  <li
                    key={comment.id}
                    className="px-4 py-3 rounded-2xl bg-[#F2FAFF]/95 border border-[#BAE6FD]/80"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs text-[#4B7796]">
                      <span className="font-bold text-[#0A2A43]">
                        {comment.author}
                      </span>
                      <span className="tabular-nums">
                        {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm text-[#1E4460] mt-1 leading-relaxed">
                      {comment.content}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#4B7796]">
                Chưa có bình luận nào. Hãy để lại lời nhắn đầu tiên cho{' '}
                {character.name}.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* Lightbox xem ảnh phóng to */}
      {lightboxIndex !== null && characterPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0A2A43]/75 backdrop-blur-md"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxIndex(null);
          }}
        >
          <div
            className="relative max-w-xl w-full flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-h-[80vh] rounded-3xl overflow-hidden border-2 border-white shadow-2xl bg-[#D6F1FE] flex items-center justify-center">
              <img
                src={characterPhotos[lightboxIndex]}
                alt={`${character.name} - Ảnh ${lightboxIndex + 1}`}
                className="max-h-[80vh] w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label="Đóng ảnh"
                className="glass-btn absolute top-3 right-3 w-9 h-9 inline-flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {characterPhotos.length > 1 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev === null
                        ? 0
                        : prev <= 0
                          ? characterPhotos.length - 1
                          : prev - 1
                    )
                  }
                  aria-label="Ảnh trước"
                  className="glass-btn p-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="glass-btn px-4 py-1 text-xs font-bold tabular-nums">
                  {lightboxIndex + 1} / {characterPhotos.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev === null
                        ? 0
                        : prev >= characterPhotos.length - 1
                          ? 0
                          : prev + 1
                    )
                  }
                  aria-label="Ảnh tiếp theo"
                  className="glass-btn p-2 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
