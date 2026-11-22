import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Check, Search, Square, SquareCheck, X } from 'lucide-react';
import { ALL_CHARACTERS, CHARACTERS, RARE_CHARACTERS } from './data/characters';
import {
  CharacterComment,
  CharacterProfile,
  MainTab,
  SpinWheelResult,
} from './types/character';
import { Navbar } from './components/Navbar';
import { CharacterCard } from './components/CharacterCard';
import { CharacterDetailModal } from './components/CharacterDetailModal';
import { LuckyWheelSection, WheelSegmentType } from './components/LuckyWheelSection';
import { GallerySection } from './components/GallerySection';
import { FiishSection } from './components/FiishSection';
import { OceanLuckyAtmosphere } from './components/OceanLuckyAtmosphere';
import { MusicPlayerWidget } from './components/MusicPlayerWidget';

const LIKES_STORAGE_KEY = 'luckyfiish_likes_v2';
const COMMENTS_STORAGE_KEY = 'luckyfiish_comments_v2';
const CLOVER_STORAGE_KEY = 'luckyfiish_clovers_v2';
const CHECKIN_TS_STORAGE_KEY = 'luckyfiish_last_checkin_ts_v1';
const UNLOCKED_STORAGE_KEY = 'luckyfiish_unlocked_v2';
const OWNED_IMAGES_KEY = 'luckyfiish_owned_images_v2';
const VISITED_UNLOCK_LINK_KEY = 'luckyfiish_visited_unlock_links_v2';
const LINK_VERIFIED_KEY = 'luckyfiish_link_verified_v2';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface LikesState {
  counts: Record<string, number>;
  likedByMe: Record<string, boolean>;
}

const DEFAULT_LIKES: LikesState = {
  counts: {},
  likedByMe: {},
};

const DEFAULT_COMMENTS: Record<string, CharacterComment[]> = {};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('nhan-vat');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAllRoster, setShowAllRoster] = useState(false);

  const [clovers, setClovers] = useState<number>(() =>
    loadJson<number>(CLOVER_STORAGE_KEY, 10)
  );
  const [lastCheckInAt, setLastCheckInAt] = useState<number>(() =>
    loadJson<number>(CHECKIN_TS_STORAGE_KEY, 0)
  );
  const [toastDismissed, setToastDismissed] = useState(false);

  const [unlockedIds, setUnlockedIds] = useState<string[]>(() =>
    loadJson<string[]>(UNLOCKED_STORAGE_KEY, [])
  );
  const [ownedImageIds, setOwnedImageIds] = useState<string[]>(() =>
    loadJson<string[]>(OWNED_IMAGES_KEY, [])
  );
  const [visitedUnlockLinkIds, setVisitedUnlockLinkIds] = useState<string[]>(() =>
    loadJson<string[]>(VISITED_UNLOCK_LINK_KEY, [])
  );
  const [linkVerifiedIds, setLinkVerifiedIds] = useState<string[]>(() =>
    loadJson<string[]>(LINK_VERIFIED_KEY, [])
  );
  const [likes, setLikes] = useState<LikesState>(() =>
    loadJson<LikesState>(LIKES_STORAGE_KEY, DEFAULT_LIKES)
  );
  const [commentsByChar, setCommentsByChar] = useState<
    Record<string, CharacterComment[]>
  >(() =>
    loadJson<Record<string, CharacterComment[]>>(
      COMMENTS_STORAGE_KEY,
      DEFAULT_COMMENTS
    )
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(CLOVER_STORAGE_KEY, JSON.stringify(clovers));
      window.localStorage.setItem(
        CHECKIN_TS_STORAGE_KEY,
        JSON.stringify(lastCheckInAt)
      );
      window.localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(unlockedIds));
      window.localStorage.setItem(OWNED_IMAGES_KEY, JSON.stringify(ownedImageIds));
      window.localStorage.setItem(
        VISITED_UNLOCK_LINK_KEY,
        JSON.stringify(visitedUnlockLinkIds)
      );
      window.localStorage.setItem(LINK_VERIFIED_KEY, JSON.stringify(linkVerifiedIds));
      window.localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likes));
      window.localStorage.setItem(
        COMMENTS_STORAGE_KEY,
        JSON.stringify(commentsByChar)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [
    clovers,
    lastCheckInAt,
    unlockedIds,
    ownedImageIds,
    visitedUnlockLinkIds,
    linkVerifiedIds,
    likes,
    commentsByChar,
  ]);

  const now = Date.now();
  const isOver24Hours =
    lastCheckInAt > 0 && now - lastCheckInAt >= TWENTY_FOUR_HOURS_MS;
  const checkedInRecently =
    lastCheckInAt > 0 && now - lastCheckInAt < TWENTY_FOUR_HOURS_MS;

  // Hiện toast nhắc nhở nếu truy cập lại sau 24 giờ kể từ lần điểm danh trước
  const showCheckInToast = isOver24Hours && !toastDismissed;

  const visibleRosterPool = useMemo(() => {
    const unlockedRares = RARE_CHARACTERS.filter((r) => unlockedIds.includes(r.id));
    return [...CHARACTERS, ...unlockedRares];
  }, [unlockedIds]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    visibleRosterPool.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [visibleRosterPool]);

  const isFiltering = Boolean(searchQuery.trim() || selectedTags.length > 0);

  const filteredCharacters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = visibleRosterPool.filter((c) => {
      if (
        selectedTags.length > 0 &&
        !selectedTags.some((tag) => c.tags.includes(tag))
      ) {
        return false;
      }
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });

    if (selectedTags.length <= 1) return matched;

    return [...matched].sort((a, b) => {
      const scoreA = selectedTags.filter((t) => a.tags.includes(t)).length;
      const scoreB = selectedTags.filter((t) => b.tags.includes(t)).length;
      return scoreB - scoreA;
    });
  }, [visibleRosterPool, searchQuery, selectedTags]);

  const newestCharacter: CharacterProfile | null = CHARACTERS[0] ?? null;

  const recentCharacters = useMemo(() => {
    return showAllRoster ? visibleRosterPool : CHARACTERS.slice(0, 3);
  }, [showAllRoster, visibleRosterPool]);

  const selectedCharacter = useMemo(
    () => ALL_CHARACTERS.find((c) => c.id === selectedId) ?? null,
    [selectedId]
  );

  const selectedIndex = useMemo(() => {
    if (!selectedCharacter) return -1;
    return visibleRosterPool.findIndex((c) => c.id === selectedCharacter.id);
  }, [visibleRosterPool, selectedCharacter]);

  const totalLikes = useMemo(
    () => Object.values(likes.counts).reduce((sum, n) => sum + n, 0),
    [likes]
  );

  const totalComments = useMemo(
    () => Object.values(commentsByChar).reduce((sum, arr) => sum + arr.length, 0),
    [commentsByChar]
  );

  const handleSelectTab = (tab: MainTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckIn = () => {
    if (checkedInRecently) return;
    setLastCheckInAt(Date.now());
    setClovers((prev) => prev + 2);
    setToastDismissed(true);
  };

  const handleUnlockCharacter = (id: string) => {
    const target = ALL_CHARACTERS.find((c) => c.id === id);
    if (!target) return;
    const cost = target.isRare ? 25 : 1;
    if (unlockedIds.includes(id) || clovers < cost) return;
    setClovers((prev) => Math.max(0, prev - cost));
    setUnlockedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setOwnedImageIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleVisitUnlockLink = (id: string) => {
    setVisitedUnlockLinkIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleVerifyPassword = (
    id: string,
    password: string
  ): { ok: boolean; message?: string } => {
    const target = ALL_CHARACTERS.find((c) => c.id === id);
    if (!target) return { ok: false, message: 'Không tìm thấy hồ sơ.' };

    const trimmed = password.trim();
    if (!trimmed || trimmed !== target.linkPassword) {
      return {
        ok: false,
        message: 'Sai mật khẩu! Nhập đúng mật khẩu mới hiện link dẫn nhân vật.',
      };
    }

    if (!visitedUnlockLinkIds.includes(id)) {
      return {
        ok: false,
        message: 'Bạn cần bấm vào Lấy Mật khẩu trước rồi mới nhập mật khẩu.',
      };
    }

    setLinkVerifiedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    return { ok: true };
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setActiveTab('nhan-vat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExecuteSpin = (
    segmentType: WheelSegmentType
  ): SpinWheelResult | null => {
    if (clovers < 5) return null;

    const pickRandomChar = (pool: CharacterProfile[]): CharacterProfile | null =>
      pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;

    if (segmentType === 'rare-character-pack') {
      const unownedRares = RARE_CHARACTERS.filter((r) => !unlockedIds.includes(r.id));
      const rareChar = pickRandomChar(
        unownedRares.length > 0 ? unownedRares : RARE_CHARACTERS
      );

      setClovers((prev) => Math.max(0, prev - 5));

      if (!rareChar) {
        return {
          segmentLabel: 'Gói Nhân Vật Hiếm',
          rewardKind: 'rare-character-pack',
          items: [],
        };
      }

      setUnlockedIds((prev) => Array.from(new Set([...prev, rareChar.id])));
      setOwnedImageIds((prev) => Array.from(new Set([...prev, rareChar.id])));

      return {
        segmentLabel: 'Gói Nhân Vật Hiếm',
        rewardKind: 'rare-character-pack',
        items: [
          {
            id: `spin-${Date.now()}-rare`,
            character: rareChar,
            isRare: true,
            label: 'Mở khóa Nhân vật hiếm',
          },
        ],
      };
    }

    if (segmentType === 'character-pack') {
      const unlockedList: string[] = [];
      const items: SpinWheelResult['items'] = [];

      const firstChar = pickRandomChar(CHARACTERS);
      if (firstChar) {
        unlockedList.push(firstChar.id);
        items.push({
          id: `spin-${Date.now()}-1`,
          character: firstChar,
          isRare: false,
          label: 'Mở khóa Nhân vật',
        });

        const secondPool = CHARACTERS.filter((c) => c.id !== firstChar.id);
        const secondChar = pickRandomChar(secondPool.length > 0 ? secondPool : CHARACTERS);
        if (secondChar) {
          unlockedList.push(secondChar.id);
          items.push({
            id: `spin-${Date.now()}-2`,
            character: secondChar,
            isRare: false,
            label: 'Mở khóa Nhân vật',
          });
        }
      }

      setClovers((prev) => Math.max(0, prev - 5));
      if (unlockedList.length > 0) {
        setUnlockedIds((prev) => Array.from(new Set([...prev, ...unlockedList])));
        setOwnedImageIds((prev) => Array.from(new Set([...prev, ...unlockedList])));
      }

      return {
        segmentLabel: 'Gói Nhân Vật',
        rewardKind: 'character-pack',
        items,
      };
    }

    if (segmentType === 'image-pack') {
      const imgIds: string[] = [];
      const items: SpinWheelResult['items'] = [];

      for (let i = 0; i < 3; i++) {
        const char = pickRandomChar(CHARACTERS);
        if (!char) continue;
        imgIds.push(char.id);
        items.push({
          id: `spin-${Date.now()}-${i}`,
          character: char,
          isRare: false,
          label: 'Ảnh nhân vật',
        });
      }

      setClovers((prev) => Math.max(0, prev - 5));
      if (imgIds.length > 0) {
        setOwnedImageIds((prev) => Array.from(new Set([...prev, ...imgIds])));
      }

      return {
        segmentLabel: 'Gói Ảnh',
        rewardKind: 'image-pack',
        items,
      };
    }

    const cloverBonusMap = {
      'clover-2': 2,
      'clover-1': 1,
      'clover-5': 5,
    } as const;
    const gain = cloverBonusMap[segmentType];
    setClovers((prev) => Math.max(0, prev - 5 + gain));

    return {
      segmentLabel: `+${gain} 🍀`,
      rewardKind: 'clover',
      cloverGain: gain,
      items: [],
    };
  };

  const handleToggleLike = (id: string) => {
    setLikes((prev) => {
      const currentlyLiked = Boolean(prev.likedByMe[id]);
      const currentCount = prev.counts[id] ?? 0;
      return {
        counts: {
          ...prev.counts,
          [id]: Math.max(0, currentCount + (currentlyLiked ? -1 : 1)),
        },
        likedByMe: {
          ...prev.likedByMe,
          [id]: !currentlyLiked,
        },
      };
    });
  };

  const handleAddComment = (id: string, author: string, content: string) => {
    const newComment: CharacterComment = {
      id: `cmt-${Date.now()}`,
      author,
      content,
      createdAt: Date.now(),
    };
    setCommentsByChar((prev) => ({
      ...prev,
      [id]: [newComment, ...(prev[id] || [])],
    }));
  };

  const handlePrevCharacter = () => {
    if (visibleRosterPool.length <= 1) return;
    const prevIdx =
      selectedIndex <= 0 ? visibleRosterPool.length - 1 : selectedIndex - 1;
    setSelectedId(visibleRosterPool[prevIdx].id);
  };

  const handleNextCharacter = () => {
    if (visibleRosterPool.length <= 1) return;
    const nextIdx =
      selectedIndex >= visibleRosterPool.length - 1 ? 0 : selectedIndex + 1;
    setSelectedId(visibleRosterPool[nextIdx].id);
  };

  return (
    <div id="top" className="relative min-h-screen flex flex-col text-[#0A2A43]">
      <OceanLuckyAtmosphere />

      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        clovers={clovers}
        checkedInToday={checkedInRecently}
        onCheckIn={handleCheckIn}
      />

      {/* Toast nhắc nhở điểm danh sau 24 giờ kể từ lần cuối điểm danh */}
      {showCheckInToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 max-w-sm glass-panel rounded-2xl p-4 bg-white/90 border-2 border-white shadow-[0_16px_40px_rgba(14,116,144,0.22)] flex items-start gap-3"
        >
          <CalendarCheck2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-xs sm:text-sm font-bold text-[#0A2A43]">
              Đã qua 24 giờ kể từ lần điểm danh trước!
            </p>
            <p className="text-xs text-[#285270]">
              Hãy điểm danh ngay để nhận thêm <strong>+2 🍀</strong> nhé.
            </p>
            <button
              type="button"
              onClick={handleCheckIn}
              className="glass-btn-lucky px-4 py-1.5 text-xs font-bold cursor-pointer"
            >
              Điểm danh ngay (+2 🍀)
            </button>
          </div>
          <button
            type="button"
            onClick={() => setToastDismissed(true)}
            aria-label="Đóng thông báo"
            className="glass-btn p-1.5 shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main className="relative z-10 flex-1">
        {activeTab === 'nhan-vat' && (
          <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10 space-y-8">
            <section
              aria-label="Điểm danh và tìm kiếm nhân vật"
              className="glass-panel rounded-3xl p-4 sm:p-5 space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={checkedInRecently}
                    className={`inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 ${
                      checkedInRecently
                        ? 'glass-btn opacity-80 cursor-default'
                        : 'glass-btn-lucky cursor-pointer'
                    }`}
                  >
                    {checkedInRecently ? (
                      <>
                        <Check className="w-4 h-4 text-[#15803D]" />
                        <span>Đã điểm danh (24h)</span>
                      </>
                    ) : (
                      <>
                        <CalendarCheck2 className="w-4 h-4 text-[#15803D]" />
                        <span>Điểm danh hôm nay (+2 🍀)</span>
                      </>
                    )}
                  </button>
                  <span className="text-xs sm:text-sm font-semibold text-[#285270] tabular-nums">
                    Đang có <strong className="text-[#0A2A43]">{clovers} 🍀</strong> ·
                    Mở link: 1 🍀 · Vòng quay: 5 🍀
                  </span>
                </div>

                <div className="relative w-full lg:w-80">
                  <Search className="w-4 h-4 text-[#4B7796] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên hoặc tag..."
                    aria-label="Tìm kiếm theo tên hoặc tags"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-full bg-white/80 border border-white text-[#0A2A43] placeholder:text-[#4B7796] focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#0E7490]/10">
                <span className="text-xs font-semibold text-[#4B7796] mr-1">
                  Tags{selectedTags.length > 0 ? ` (${selectedTags.length})` : ''}:
                </span>
                {allTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleSelectTag(tag)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                        active ? 'glass-btn-lucky text-[#073049]' : 'glass-btn text-[#285270]'
                      }`}
                    >
                      {active ? (
                        <SquareCheck className="w-3.5 h-3.5 text-[#15803D]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-[#4B7796]/70" />
                      )}
                      <span>{tag}</span>
                    </button>
                  );
                })}
                {isFiltering && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTags([]);
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Xóa lọc</span>
                  </button>
                )}
              </div>
            </section>

            {isFiltering ? (
              <section aria-labelledby="heading-search-results">
                <div className="mb-5">
                  <h1
                    id="heading-search-results"
                    className="font-display text-2xl sm:text-3xl font-bold text-[#0A2A43]"
                  >
                    Kết quả tìm kiếm ({filteredCharacters.length})
                  </h1>
                </div>

                {filteredCharacters.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                    {filteredCharacters.map((character) => (
                      <CharacterCard
                        key={character.id}
                        character={character}
                        isUnlocked={unlockedIds.includes(character.id)}
                        likesCount={likes.counts[character.id] ?? 0}
                        isLiked={Boolean(likes.likedByMe[character.id])}
                        onSelect={(c) => setSelectedId(c.id)}
                        onSelectTag={handleSelectTag}
                        onUnlock={handleUnlockCharacter}
                        clovers={clovers}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel rounded-3xl p-10 text-center">
                    <p className="font-display text-2xl font-bold text-[#0A2A43]">
                      Không tìm thấy nhân vật phù hợp
                    </p>
                    <p className="text-sm text-[#285270] mt-2">
                      Thử tìm với tên khác hoặc bấm vào một tag có sẵn.
                    </p>
                  </div>
                )}
              </section>
            ) : visibleRosterPool.length === 0 ? (
              <section className="glass-panel rounded-3xl p-10 text-center">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0A2A43]">
                  Hiện chưa có nhân vật nào
                </h1>
                <p className="text-sm text-[#285270] mt-2">
                  Danh sách nhân vật hiện đang trống.
                </p>
              </section>
            ) : (
              <>
                {newestCharacter && (
                  <section aria-labelledby="heading-new-character">
                    <div className="mb-5">
                      <h1
                        id="heading-new-character"
                        className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0A2A43]"
                      >
                        Nhân Vật Mới
                      </h1>
                    </div>

                    <CharacterCard
                      variant="featured"
                      character={newestCharacter}
                      isUnlocked={unlockedIds.includes(newestCharacter.id)}
                      likesCount={likes.counts[newestCharacter.id] ?? 0}
                      isLiked={Boolean(likes.likedByMe[newestCharacter.id])}
                      onSelect={(c) => setSelectedId(c.id)}
                      onSelectTag={handleSelectTag}
                      onUnlock={handleUnlockCharacter}
                      clovers={clovers}
                    />
                  </section>
                )}

                <hr className="border-0 border-t border-[#0E7490]/25" />

                <section aria-labelledby="heading-recent-characters">
                  <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
                    <h2
                      id="heading-recent-characters"
                      className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0A2A43]"
                    >
                      Nhân Vật Gần Đây
                    </h2>

                    {visibleRosterPool.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllRoster((prev) => !prev)}
                        className="glass-btn px-4 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {showAllRoster
                          ? 'Thu gọn (3 gần đây)'
                          : `Xem tất cả (${visibleRosterPool.length})`}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                    {recentCharacters.map((character) => (
                      <CharacterCard
                        key={character.id}
                        character={character}
                        isUnlocked={unlockedIds.includes(character.id)}
                        likesCount={likes.counts[character.id] ?? 0}
                        isLiked={Boolean(likes.likedByMe[character.id])}
                        onSelect={(c) => setSelectedId(c.id)}
                        onSelectTag={handleSelectTag}
                        onUnlock={handleUnlockCharacter}
                        clovers={clovers}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {activeTab === 'vong-quay' && (
          <LuckyWheelSection
            rareCharacters={RARE_CHARACTERS}
            unlockedIds={unlockedIds}
            clovers={clovers}
            onExecuteSpin={handleExecuteSpin}
            onUnlockRare={handleUnlockCharacter}
            onSelectCharacter={(c) => setSelectedId(c.id)}
          />
        )}

        {activeTab === 'thu-vien' && (
          <GallerySection
            characters={CHARACTERS}
            unlockedIds={unlockedIds}
            ownedImageIds={ownedImageIds}
            visitedUnlockLinkIds={visitedUnlockLinkIds}
            linkVerifiedIds={linkVerifiedIds}
            clovers={clovers}
            onUnlock={handleUnlockCharacter}
            onVisitUnlockLink={handleVisitUnlockLink}
            onVerifyPassword={handleVerifyPassword}
            onSelectCharacter={(c) => setSelectedId(c.id)}
            onSelectTag={handleSelectTag}
          />
        )}

        {activeTab === 'fiish' && (
          <FiishSection
            characters={ALL_CHARACTERS}
            unlockedCount={unlockedIds.length}
            ownedImagesCount={ownedImageIds.length}
            totalLikes={totalLikes}
            totalComments={totalComments}
            clovers={clovers}
          />
        )}
      </main>

      <footer className="relative z-10 border-t border-white/80 bg-white/45 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-6 py-7 flex flex-col items-center justify-center text-center gap-1">
          <span className="font-display text-2xl font-bold tracking-tight text-[#0A2A43]">
            Cá May Mắn
          </span>
          <span className="text-xs font-semibold text-[#4B7796] tracking-wide">
            luckyfiish
          </span>
        </div>
      </footer>

      <CharacterDetailModal
        character={selectedCharacter}
        isUnlocked={
          selectedCharacter ? unlockedIds.includes(selectedCharacter.id) : false
        }
        hasVisitedUnlockLink={
          selectedCharacter
            ? visitedUnlockLinkIds.includes(selectedCharacter.id)
            : false
        }
        isLinkVerified={
          selectedCharacter ? linkVerifiedIds.includes(selectedCharacter.id) : false
        }
        clovers={clovers}
        totalCount={visibleRosterPool.length}
        currentIndex={selectedIndex}
        likesCount={selectedCharacter ? (likes.counts[selectedCharacter.id] ?? 0) : 0}
        isLiked={
          selectedCharacter ? Boolean(likes.likedByMe[selectedCharacter.id]) : false
        }
        comments={selectedCharacter ? (commentsByChar[selectedCharacter.id] ?? []) : []}
        onUnlock={handleUnlockCharacter}
        onVisitUnlockLink={handleVisitUnlockLink}
        onVerifyPassword={handleVerifyPassword}
        onSelectTag={handleSelectTag}
        onToggleLike={handleToggleLike}
        onAddComment={handleAddComment}
        onClose={() => setSelectedId(null)}
        onPrev={handlePrevCharacter}
        onNext={handleNextCharacter}
      />

      <MusicPlayerWidget />
    </div>
  );
}

export default App;
