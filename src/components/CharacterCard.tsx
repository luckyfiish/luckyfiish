import { Heart, Lock, Unlock } from 'lucide-react';
import { CharacterProfile } from '../types/character';
import { PortraitImage } from './PortraitImage';

interface CharacterCardProps {
  character: CharacterProfile;
  isUnlocked: boolean;
  likesCount: number;
  isLiked: boolean;
  onSelect: (character: CharacterProfile) => void;
  onSelectTag: (tag: string) => void;
  onUnlock: (characterId: string) => void;
  clovers: number;
  variant?: 'default' | 'featured';
}

export function CharacterCard({
  character,
  isUnlocked,
  likesCount,
  isLiked,
  onSelect,
  onSelectTag,
  onUnlock,
  clovers,
  variant = 'default',
}: CharacterCardProps) {
  const isFeatured = variant === 'featured';

  return (
    <article
      onClick={() => onSelect(character)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(character);
        }
      }}
      className={`group text-left w-full glass-panel rounded-3xl overflow-hidden transition-all duration-200 hover:border-white hover:-translate-y-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7] ${
        isFeatured
          ? 'grid grid-cols-1 md:grid-cols-12 items-stretch'
          : 'flex flex-col'
      }`}
    >
      {/* 1. Ảnh — luôn giữ màu sắc tự nhiên */}
      <div
        className={`relative overflow-hidden bg-[#D6F1FE] ${
          isFeatured
            ? 'md:col-span-5 aspect-[3/4] md:aspect-auto md:min-h-[380px]'
            : 'aspect-[3/4] w-full'
        }`}
      >
        <PortraitImage
          src={character.portraitUrl}
          alt={`Chân dung nhân vật ${character.name}`}
          name={character.name}
          className="w-full h-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
        />
      </div>

      {/* Nội dung khung nhân vật */}
      <div
        className={`flex flex-col justify-center gap-2 ${
          isFeatured ? 'md:col-span-7 p-6 sm:p-8' : 'p-5 flex-1'
        }`}
      >
        {/* 2. Dòng nhỏ: số thứ tự, tuổi, giới tính */}
        <div className="flex items-center justify-between gap-3 text-[13px] font-semibold text-[#285270] tabular-nums">
          <div className="flex items-center gap-1.5 min-w-0">
            <span>{character.code}</span>
            <span aria-hidden="true">·</span>
            <span>{character.age} tuổi</span>
            <span aria-hidden="true">·</span>
            <span>{character.gender}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[12px] text-[#4B7796] shrink-0">
            <Heart
              className={`w-3.5 h-3.5 ${
                isLiked ? 'fill-[#E11D48] text-[#E11D48]' : 'text-[#4B7796]'
              }`}
            />
            <span>{likesCount}</span>
          </span>
        </div>

        {/* 3. Dòng phía dưới lớn hơn dòng đầu: Tên (in đậm) */}
        <h3
          className={`font-display font-bold tracking-tight text-[#0A2A43] group-hover:text-[#0284C7] transition-colors ${
            isFeatured ? 'text-3xl sm:text-4xl' : 'text-[26px] leading-tight'
          }`}
        >
          {character.name}
        </h3>

        {/* 4. Dòng nhỏ hơn dòng "tên" và nhỏ hơn dòng đầu: mô tả ngoại hình và tags (xuống dòng, không hashtag, bấm được) */}
        <div className="text-[11.5px] leading-relaxed text-[#285270] mt-0.5 space-y-1.5">
          <p>{character.appearance}</p>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {character.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTag(tag);
                }}
                className="font-bold text-[11.5px] text-[#0A2A43] hover:text-[#0284C7] hover:underline underline-offset-2 cursor-pointer transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center gap-2">
          {!isUnlocked ? (() => {
            const unlockCost = character.isRare ? 25 : 1;
            return (
              <button
                type="button"
                disabled={clovers < unlockCost}
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlock(character.id);
                }}
                className="glass-btn-lucky inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Mở khóa link ({unlockCost} 🍀)</span>
              </button>
            );
          })() : (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#15803D]">
              <Unlock className="w-3.5 h-3.5" />
              <span>Đã mở khóa link</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
