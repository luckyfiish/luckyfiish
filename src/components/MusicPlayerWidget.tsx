import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Link2,
  ListMusic,
  Music,
  Pause,
  Play,
  Plus,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  kind: 'youtube' | 'url' | 'file';
  src: string;
  youtubeId?: string;
}

type RepeatMode = 'all' | 'one';

interface YTPlayerInstance {
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  getPlayerState: () => number;
  destroy: () => void;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    options: {
      height?: string | number;
      width?: string | number;
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayerInstance }) => void;
        onStateChange?: (e: { data: number; target: YTPlayerInstance }) => void;
        onError?: () => void;
      };
    }
  ) => YTPlayerInstance;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
  };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const DEFAULT_TRACKS: MusicTrack[] = [
  {
    id: 'default-yt-Z0HCqiEjtH4',
    title: 'Before spring ends (Piano ver.)',
    artist: 'Nguyễn Duy Thuận',
    kind: 'youtube',
    src: 'https://m.youtube.com/watch?v=Z0HCqiEjtH4&list=RDZ0HCqiEjtH4&start_radio=1',
    youtubeId: 'Z0HCqiEjtH4',
  },
];

const CUSTOM_URL_TRACKS_KEY = 'luckyfiish_custom_url_tracks_v3';
const MUSIC_PREF_KEY = 'luckyfiish_music_prefs_v1';
const DB_NAME = 'luckyfiish_music_db_v2';
const STORE_NAME = 'audio_files';

interface StoredFileTrack {
  id: string;
  title: string;
  artist: string;
  blob: Blob;
}

function extractYouTubeId(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl.trim());
    const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
    if (host === 'youtu.be') {
      return u.pathname.slice(1).split('/')[0] || null;
    }
    if (host === 'youtube.com' || host === 'music.youtube.com') {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live'].includes(parts[0] || '') && parts[1]) {
        return parts[1];
      }
    }
  } catch {
    // ignore invalid URL
  }
  return null;
}

function loadYouTubeIframeApi(): Promise<YTNamespace> {
  return new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevCallback?.();
      if (window.YT) resolve(window.YT);
    };

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }
  });
}

function openAudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveFileTrackToDb(record: StoredFileTrack): Promise<void> {
  const db = await openAudioDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadFileTracksFromDb(): Promise<StoredFileTrack[]> {
  const db = await openAudioDb();
  const items = await new Promise<StoredFileTrack[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve((req.result as StoredFileTrack[]) || []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return items;
}

async function deleteFileTrackFromDb(id: string): Promise<void> {
  const db = await openAudioDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function MusicPlayerWidget() {
  const [tracks, setTracks] = useState<MusicTrack[]>(() => {
    try {
      const raw = window.localStorage.getItem(CUSTOM_URL_TRACKS_KEY);
      const customUrls = raw ? (JSON.parse(raw) as MusicTrack[]) : [];
      return [...DEFAULT_TRACKS, ...customUrls];
    } catch {
      return DEFAULT_TRACKS;
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [waitingInteraction, setWaitingInteraction] = useState(false);
  const [volume, setVolume] = useState<number>(() => {
    try {
      const raw = window.localStorage.getItem(MUSIC_PREF_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { volume?: number };
        if (typeof parsed.volume === 'number') return parsed.volume;
      }
    } catch {
      // ignore
    }
    return 0.65;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytHostRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const ytReadyRef = useRef(false);
  const ytLoadedVideoIdRef = useRef<string | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const stateRef = useRef({
    isPlaying,
    repeatMode,
    tracksLength: tracks.length,
    effectiveVolume: isMuted ? 0 : volume,
    isMuted,
  });

  const activeTrack = tracks[currentIndex] ?? null;
  const effectiveVolume = isMuted ? 0 : volume;

  stateRef.current = {
    isPlaying,
    repeatMode,
    tracksLength: tracks.length,
    effectiveVolume,
    isMuted,
  };

  useEffect(() => {
    try {
      window.localStorage.removeItem('luckyfiish_custom_url_tracks_v1');
      window.localStorage.removeItem('luckyfiish_custom_url_tracks_v2');
      window.indexedDB.deleteDatabase('luckyfiish_music_db');
    } catch {
      // ignore
    }

    let active = true;
    loadFileTracksFromDb()
      .then((records) => {
        if (!active || records.length === 0) return;
        const fileTracks: MusicTrack[] = records.map((rec) => {
          const url = URL.createObjectURL(rec.blob);
          objectUrlsRef.current.push(url);
          return {
            id: rec.id,
            title: rec.title,
            artist: rec.artist,
            kind: 'file',
            src: url,
          };
        });
        setTracks((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const uniqueNew = fileTracks.filter((t) => !existingIds.has(t.id));
          return [...prev, ...uniqueNew];
        });
      })
      .catch(() => {
        // ignore
      });

    return () => {
      active = false;
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    try {
      const customUrls = tracks.filter(
        (t) => (t.kind === 'url' || t.kind === 'youtube') && !t.id.startsWith('default-')
      );
      window.localStorage.setItem(CUSTOM_URL_TRACKS_KEY, JSON.stringify(customUrls));
    } catch {
      // ignore
    }
  }, [tracks]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MUSIC_PREF_KEY, JSON.stringify({ volume }));
    } catch {
      // ignore
    }
  }, [volume]);

  // Initialize / control YouTube Player when active track is YouTube
  useEffect(() => {
    if (!activeTrack || activeTrack.kind !== 'youtube' || !activeTrack.youtubeId) {
      if (ytPlayerRef.current && ytReadyRef.current) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {
          // ignore
        }
      }
      return;
    }

    const videoId = activeTrack.youtubeId;
    let cancelled = false;
    let verifyTimer: number | null = null;

    const syncYouTubePlayback = (player: YTPlayerInstance) => {
      const { isPlaying: wantPlay, effectiveVolume: vol, isMuted: muted } =
        stateRef.current;
      try {
        player.setVolume(Math.round(vol * 100));
        if (muted || vol === 0) {
          player.mute();
        } else {
          player.unMute();
        }
        if (wantPlay) {
          player.playVideo();
          verifyTimer = window.setTimeout(() => {
            if (cancelled) return;
            try {
              const st = player.getPlayerState();
              // 1 = PLAYING, 3 = BUFFERING
              if (stateRef.current.isPlaying && st !== 1 && st !== 3) {
                setWaitingInteraction(true);
              }
            } catch {
              // ignore
            }
          }, 900);
        } else {
          player.pauseVideo();
          setWaitingInteraction(false);
        }
      } catch {
        // ignore
      }
    };

    if (ytPlayerRef.current && ytReadyRef.current) {
      if (ytLoadedVideoIdRef.current !== videoId) {
        ytLoadedVideoIdRef.current = videoId;
        ytPlayerRef.current.loadVideoById(videoId);
      }
      syncYouTubePlayback(ytPlayerRef.current);
      return () => {
        cancelled = true;
        if (verifyTimer !== null) window.clearTimeout(verifyTimer);
      };
    }

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !ytHostRef.current || ytPlayerRef.current) return;

      ytLoadedVideoIdRef.current = videoId;
      const player = new YT.Player(ytHostRef.current, {
        width: 200,
        height: 200,
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            ytReadyRef.current = true;
            syncYouTubePlayback(e.target);
          },
          onStateChange: (e) => {
            if (cancelled) return;
            if (e.data === YT.PlayerState.PLAYING) {
              setWaitingInteraction(false);
              setErrorMsg('');
            } else if (e.data === YT.PlayerState.ENDED) {
              const { repeatMode: rep, tracksLength: len } = stateRef.current;
              if (rep === 'one' || len <= 1) {
                e.target.seekTo(0, true);
                e.target.playVideo();
              } else {
                setCurrentIndex((prev) => (prev >= len - 1 ? 0 : prev + 1));
                setIsPlaying(true);
              }
            }
          },
          onError: () => {
            if (cancelled) return;
            setErrorMsg('Không thể phát bài YouTube này.');
            setIsPlaying(false);
          },
        },
      });
      ytPlayerRef.current = player;
    });

    return () => {
      cancelled = true;
      if (verifyTimer !== null) window.clearTimeout(verifyTimer);
    };
  }, [activeTrack?.id, activeTrack?.kind, activeTrack?.youtubeId, isPlaying]);

  // Sync volume for YouTube player
  useEffect(() => {
    if (
      activeTrack?.kind === 'youtube' &&
      ytPlayerRef.current &&
      ytReadyRef.current
    ) {
      try {
        ytPlayerRef.current.setVolume(Math.round(effectiveVolume * 100));
        if (isMuted || effectiveVolume === 0) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
        }
      } catch {
        // ignore
      }
    }
  }, [activeTrack?.kind, effectiveVolume, isMuted]);

  // Cleanup YouTube player on unmount
  useEffect(() => {
    return () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
        ytPlayerRef.current = null;
        ytReadyRef.current = false;
      }
    };
  }, []);

  // Control HTMLAudioElement when track is direct URL or local file
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!activeTrack || activeTrack.kind === 'youtube') {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    audio.volume = effectiveVolume;
    if (audio.src !== activeTrack.src) {
      audio.src = activeTrack.src;
    }

    if (isPlaying) {
      audio
        .play()
        .then(() => {
          setWaitingInteraction(false);
          setErrorMsg('');
        })
        .catch((err: unknown) => {
          const isAutoplayBlocked =
            err instanceof DOMException && err.name === 'NotAllowedError';
          if (isAutoplayBlocked) {
            setWaitingInteraction(true);
          } else {
            setErrorMsg(
              'Không thể phát link nhạc này. Kiểm tra lại tệp hoặc URL âm thanh.'
            );
            setIsPlaying(false);
          }
        });
    } else {
      audio.pause();
      setWaitingInteraction(false);
    }
  }, [activeTrack?.id, activeTrack?.kind, activeTrack?.src, isPlaying, effectiveVolume]);

  // Resume playback immediately on user's very first pointer/key interaction if browser blocked autoplay
  useEffect(() => {
    if (!waitingInteraction || !activeTrack || !isPlaying) return;

    const resumeOnFirstInteraction = () => {
      if (activeTrack.kind === 'youtube') {
        if (ytPlayerRef.current && ytReadyRef.current) {
          try {
            if (!stateRef.current.isMuted && stateRef.current.effectiveVolume > 0) {
              ytPlayerRef.current.unMute();
            }
            ytPlayerRef.current.setVolume(
              Math.round(stateRef.current.effectiveVolume * 100)
            );
            ytPlayerRef.current.playVideo();
            setWaitingInteraction(false);
            setErrorMsg('');
          } catch {
            // ignore
          }
        }
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;
      audio
        .play()
        .then(() => {
          setWaitingInteraction(false);
          setErrorMsg('');
        })
        .catch(() => {
          // ignore
        });
    };

    window.addEventListener('pointerdown', resumeOnFirstInteraction, { once: true });
    window.addEventListener('keydown', resumeOnFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', resumeOnFirstInteraction);
      window.removeEventListener('keydown', resumeOnFirstInteraction);
    };
  }, [waitingInteraction, activeTrack, isPlaying]);

  const handleTogglePlay = () => {
    if (!activeTrack) {
      setIsExpanded(true);
      setShowAddForm(true);
      return;
    }
    setErrorMsg('');

    if (activeTrack.kind === 'youtube') {
      if (waitingInteraction && ytPlayerRef.current && ytReadyRef.current) {
        try {
          if (!isMuted && effectiveVolume > 0) ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(Math.round(effectiveVolume * 100));
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          setWaitingInteraction(false);
          return;
        } catch {
          // fallback below
        }
      }
      setIsPlaying((prev) => !prev);
      return;
    }

    if (waitingInteraction && audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setWaitingInteraction(false);
        })
        .catch(() => {
          setIsPlaying((prev) => !prev);
        });
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const handlePrev = () => {
    if (tracks.length === 0) return;
    setErrorMsg('');
    if (tracks.length === 1 && activeTrack?.kind === 'youtube' && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(0, true);
      ytPlayerRef.current.playVideo();
      setIsPlaying(true);
      return;
    }
    setCurrentIndex((prev) => (prev <= 0 ? tracks.length - 1 : prev - 1));
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    setErrorMsg('');
    if (tracks.length === 1 && activeTrack?.kind === 'youtube' && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(0, true);
      ytPlayerRef.current.playVideo();
      setIsPlaying(true);
      return;
    }
    setCurrentIndex((prev) => (prev >= tracks.length - 1 ? 0 : prev + 1));
    setIsPlaying(true);
  };

  const handleTrackEnded = () => {
    const audio = audioRef.current;
    if (tracks.length === 0) return;

    if (repeatMode === 'one' || tracks.length === 1) {
      if (audio) {
        audio.currentTime = 0;
        void audio.play();
      }
      return;
    }

    setCurrentIndex((prev) => (prev >= tracks.length - 1 ? 0 : prev + 1));
    setIsPlaying(true);
  };

  const handleSelectTrack = (index: number) => {
    setErrorMsg('');
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const handleAddUrlTrack = (e: FormEvent) => {
    e.preventDefault();
    const trimmedUrl = newUrl.trim();
    if (!trimmedUrl) return;

    const ytId = extractYouTubeId(trimmedUrl);
    const track: MusicTrack = ytId
      ? {
          id: `yt-${Date.now()}`,
          title: newTitle.trim() || 'Nhạc YouTube của bạn',
          artist: 'YouTube',
          kind: 'youtube',
          src: trimmedUrl,
          youtubeId: ytId,
        }
      : {
          id: `url-${Date.now()}`,
          title: newTitle.trim() || 'Bài hát của bạn',
          artist: 'Liên kết nhạc',
          kind: 'url',
          src: trimmedUrl,
        };

    setTracks((prev) => {
      const next = [...prev, track];
      setCurrentIndex(next.length - 1);
      return next;
    });
    setNewTitle('');
    setNewUrl('');
    setShowAddForm(false);
    setIsPlaying(true);
    setErrorMsg('');
  };

  const handleUploadAudioFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = `file-${Date.now()}`;
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
    const objUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(objUrl);

    const track: MusicTrack = {
      id,
      title: cleanTitle || 'Nhạc tải lên',
      artist: 'Từ thiết bị',
      kind: 'file',
      src: objUrl,
    };

    try {
      await saveFileTrackToDb({
        id,
        title: track.title,
        artist: track.artist,
        blob: file,
      });
    } catch {
      // Fall back to session-only ObjectURL
    }

    setTracks((prev) => {
      const next = [...prev, track];
      setCurrentIndex(next.length - 1);
      return next;
    });
    setShowAddForm(false);
    setIsPlaying(true);
    setErrorMsg('');
    e.target.value = '';
  };

  const handleDeleteTrack = async (id: string, index: number) => {
    if (id.startsWith('default-')) return;
    if (id.startsWith('file-')) {
      try {
        await deleteFileTrackFromDb(id);
      } catch {
        // ignore
      }
    }
    setTracks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        setCurrentIndex(0);
      } else if (currentIndex >= next.length) {
        setCurrentIndex(Math.max(0, next.length - 1));
      } else if (index < currentIndex) {
        setCurrentIndex((c) => Math.max(0, c - 1));
      }
      return next;
    });
  };

  const actuallyPlaying = Boolean(activeTrack && isPlaying && !waitingInteraction);

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2.5 max-w-[calc(100vw-2rem)]">
      <audio
        ref={audioRef}
        autoPlay
        loop={repeatMode === 'one' || tracks.length === 1}
        onEnded={handleTrackEnded}
        preload="metadata"
      />

      {/* Trình phát YouTube ẩn ngoài khung nhìn để giữ âm thanh phát nền */}
      <div
        aria-hidden="true"
        className="fixed -left-[9999px] -top-[9999px] w-[200px] h-[200px] opacity-0 pointer-events-none overflow-hidden"
      >
        <div ref={ytHostRef} />
      </div>

      {/* Expandable Playlist & Attach Song Panel */}
      {isExpanded && (
        <div className="w-[310px] sm:w-[330px] glass-panel rounded-3xl p-4 bg-white/90 border-2 border-white shadow-[0_18px_44px_rgba(14,116,144,0.2)] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-[#0284C7]" />
              <span className="font-display text-sm font-bold text-[#0A2A43]">
                Góc Nhạc ({tracks.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="glass-btn-lucky inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Gắn nhạc</span>
            </button>
          </div>

          {showAddForm && (
            <div className="rounded-2xl p-3 bg-[#F2FAFF]/95 border border-[#BAE6FD] space-y-2.5">
              <label className="glass-btn-lucky w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Chọn bài hát từ máy (.mp3, .m4a...)</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleUploadAudioFile}
                  className="hidden"
                />
              </label>

              <form onSubmit={handleAddUrlTrack} className="space-y-1.5 pt-1 border-t border-[#BAE6FD]/60">
                <div className="text-[11px] font-semibold text-[#4B7796] flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  <span>Hoặc dán link YouTube / file âm thanh:</span>
                </div>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Tên bài hát (tùy chọn)"
                  className="w-full px-3 py-1.5 text-xs rounded-full bg-white border border-[#BAE6FD] text-[#0A2A43] placeholder:text-[#4B7796] focus:outline-none focus:border-[#0284C7]"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    required
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://youtube.com/... hoặc .mp3"
                    className="flex-1 min-w-0 px-3 py-1.5 text-xs rounded-full bg-white border border-[#BAE6FD] text-[#0A2A43] placeholder:text-[#4B7796] focus:outline-none focus:border-[#0284C7]"
                  />
                  <button
                    type="submit"
                    className="glass-btn px-3 py-1.5 text-xs font-bold shrink-0 cursor-pointer"
                  >
                    Thêm
                  </button>
                </div>
              </form>
            </div>
          )}

          {errorMsg && (
            <p className="text-[11px] font-semibold text-[#B91C1C] px-1">
              {errorMsg}
            </p>
          )}

          {tracks.length > 0 ? (
            <ul className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
              {tracks.map((track, idx) => {
                const isCurrent = idx === currentIndex;
                const isDefault = track.id.startsWith('default-');
                return (
                  <li
                    key={track.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-colors ${
                      isCurrent
                        ? 'bg-[#E0F2FE]/90 border-[#38BDF8]'
                        : 'bg-white/75 border-white hover:bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectTrack(idx)}
                      className="flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <div className="text-xs font-bold text-[#0A2A43] truncate">
                        {track.title}
                      </div>
                      <div className="text-[10px] font-semibold text-[#4B7796] truncate">
                        {track.artist}
                      </div>
                    </button>
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTrack(track.id, idx)}
                        aria-label={`Xóa ${track.title}`}
                        className="p-1 text-[#4B7796] hover:text-[#B91C1C] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-[#4B7796] text-center py-3">
              Chưa có bài hát nào. Bấm <strong>Gắn nhạc</strong> để thêm bài hát của bạn.
            </p>
          )}

          <div className="flex items-center gap-2 pt-1 border-t border-[#BAE6FD]/60">
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              aria-label={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
              className="p-1.5 text-[#0284C7] hover:text-[#0A2A43] cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setIsMuted(false);
                setVolume(Number(e.target.value));
              }}
              aria-label="Âm lượng nhạc"
              className="flex-1 accent-[#0284C7] h-1.5 cursor-pointer"
            />
            <button
              type="button"
              onClick={() =>
                setRepeatMode((prev) => (prev === 'all' ? 'one' : 'all'))
              }
              title={
                repeatMode === 'one'
                  ? 'Đang lặp lại 1 bài'
                  : 'Đang lặp lại toàn bộ danh sách'
              }
              aria-label="Chế độ lặp lại"
              className="glass-btn inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#0284C7] cursor-pointer shrink-0"
            >
              {repeatMode === 'one' ? (
                <>
                  <Repeat1 className="w-3.5 h-3.5" />
                  <span>1 bài</span>
                </>
              ) : (
                <>
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Lặp lại</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Compact Corner Music Pill */}
      <div className="relative flex items-center gap-2 px-3 py-2 rounded-full bg-white/75 backdrop-blur-xl border border-white/95 shadow-[0_12px_32px_rgba(14,116,144,0.18)]">
        {actuallyPlaying && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-3 left-4 flex gap-2 text-[#0284C7]"
          >
            <span
              className="text-xs font-bold animate-note-float"
              style={{ ['--note-delay' as string]: '0s' }}
            >
              ♪
            </span>
            <span
              className="text-[11px] font-bold text-[#15803D] animate-note-float"
              style={{ ['--note-delay' as string]: '1.1s' }}
            >
              ♫
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label="Mở danh sách nhạc"
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BAE6FD] to-[#A7F3D0] border border-white flex items-center justify-center shrink-0 cursor-pointer"
        >
          {actuallyPlaying ? (
            <span className="flex items-end gap-[2px] h-3.5" aria-hidden="true">
              <span
                className="w-[2.5px] h-full rounded-full bg-[#0284C7] animate-eq-bar"
                style={{ ['--eq-dur' as string]: '0.68s', ['--eq-delay' as string]: '0s' }}
              />
              <span
                className="w-[2.5px] h-full rounded-full bg-[#15803D] animate-eq-bar"
                style={{ ['--eq-dur' as string]: '0.88s', ['--eq-delay' as string]: '0.18s' }}
              />
              <span
                className="w-[2.5px] h-full rounded-full bg-[#0284C7] animate-eq-bar"
                style={{ ['--eq-dur' as string]: '0.74s', ['--eq-delay' as string]: '0.32s' }}
              />
            </span>
          ) : (
            <Music className="w-3.5 h-3.5 text-[#0A2A43]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-left min-w-0 max-w-[115px] sm:max-w-[150px] cursor-pointer"
          title={activeTrack?.title ?? 'Chưa có bài hát'}
        >
          <div className="text-[11px] font-bold text-[#0A2A43] truncate leading-tight">
            {activeTrack ? activeTrack.title : 'Chưa có nhạc'}
          </div>
          <div className="text-[10px] font-semibold text-[#4B7796] truncate leading-tight">
            {activeTrack
              ? waitingInteraction
                ? 'Chạm web để phát'
                : isPlaying
                  ? 'Đang phát · Lặp'
                  : 'Tạm dừng'
              : 'Bấm để gắn nhạc'}
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={tracks.length === 0}
            onClick={handlePrev}
            aria-label="Bài trước"
            className="p-1.5 rounded-full hover:bg-white/90 text-[#0A2A43] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={actuallyPlaying ? 'Dừng nhạc' : 'Phát nhạc'}
            className="glass-btn-lucky w-7 h-7 inline-flex items-center justify-center cursor-pointer"
          >
            {actuallyPlaying ? (
              <Pause className="w-3.5 h-3.5 text-[#0A2A43]" />
            ) : (
              <Play className="w-3.5 h-3.5 text-[#0A2A43] ml-0.5" />
            )}
          </button>
          <button
            type="button"
            disabled={tracks.length === 0}
            onClick={handleNext}
            aria-label="Bài tiếp theo"
            className="p-1.5 rounded-full hover:bg-white/90 text-[#0A2A43] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={isExpanded ? 'Thu gọn trình phát nhạc' : 'Mở rộng trình phát nhạc'}
            className="p-1 rounded-full hover:bg-white/90 text-[#4B7796] cursor-pointer transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
