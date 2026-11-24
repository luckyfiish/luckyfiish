import { useCallback, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../firebase';
import { CharacterComment } from '../types/character';

// Validation constants synchronized verbatim with firebase-blueprint.json
const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const CHARACTER_ID_MAX_LENGTH = 64;
const AUTHOR_NAME_MAX_LENGTH = 30;
const COMMENT_MAX_LENGTH = 500;

export interface CharacterStatRecord {
  likesCount: number;
  commentsCount: number;
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toMillis' in value &&
    typeof (value as { toMillis: unknown }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

function formatAuthFeedback(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request'
    ) {
      return 'Bạn hãy đăng nhập Google để gửi bình luận hoặc thả tim cùng mọi người nhé.';
    }
    if (code === 'auth/popup-blocked') {
      return 'Trình duyệt đang chặn cửa sổ đăng nhập Google. Vui lòng cho phép popup rồi thử lại.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Tên miền hiện tại chưa được thêm vào Authorized Domains trong Firebase Authentication.';
    }
  }
  return 'Không thể đăng nhập Google lúc này. Vui lòng thử lại sau.';
}

export function useCommunityInteractions(selectedCharacterId: string | null) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [statsByChar, setStatsByChar] = useState<
    Record<string, CharacterStatRecord>
  >({});
  const [likedCharIds, setLikedCharIds] = useState<Record<string, boolean>>({});
  const [likedCommentIds, setLikedCommentIds] = useState<
    Record<string, boolean>
  >({});
  const [commentsByChar, setCommentsByChar] = useState<
    Record<string, CharacterComment[]>
  >({});
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [fatalError, setFatalError] = useState<Error | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setIsAuthReady(true);
      if (!user) {
        setLikedCharIds({});
        setLikedCommentIds({});
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to public character counters (1 read per character with interactions)
  useEffect(() => {
    if (!isAuthReady) return;
    const statsPath = 'characterStats';
    const q = query(collection(db, statsPath), where('isPublic', '==', true));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next: Record<string, CharacterStatRecord> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const charId =
            typeof data.characterId === 'string'
              ? data.characterId
              : docSnap.id;
          next[charId] = {
            likesCount:
              typeof data.likesCount === 'number'
                ? Math.max(0, data.likesCount)
                : 0,
            commentsCount:
              typeof data.commentsCount === 'number'
                ? Math.max(0, data.commentsCount)
                : 0,
          };
        });
        setStatsByChar(next);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, statsPath);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      }
    );

    return () => unsubscribe();
  }, [isAuthReady]);

  // Listen to comments only when a character dossier is open
  useEffect(() => {
    if (!isAuthReady || !selectedCharacterId) return;
    if (
      !ID_PATTERN.test(selectedCharacterId) ||
      selectedCharacterId.length > CHARACTER_ID_MAX_LENGTH
    ) {
      return;
    }

    const commentsPath = `characterStats/${selectedCharacterId}/comments`;
    const q = query(
      collection(db, commentsPath),
      where('isPublic', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: CharacterComment[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            characterId:
              typeof data.characterId === 'string'
                ? data.characterId
                : selectedCharacterId,
            authorUid:
              typeof data.authorUid === 'string' ? data.authorUid : undefined,
            author:
              typeof data.authorName === 'string' && data.authorName.trim()
                ? data.authorName
                : 'Khách ghé thăm',
            content: typeof data.content === 'string' ? data.content : '',
            likesCount:
              typeof data.likesCount === 'number'
                ? Math.max(0, data.likesCount)
                : 0,
            createdAt: toMillis(data.createdAt),
          });
        });

        list.sort((a, b) => b.createdAt - a.createdAt);
        setCommentsByChar((prev) => ({
          ...prev,
          [selectedCharacterId]: list,
        }));
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, commentsPath);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, selectedCharacterId]);

  // Listen to the authenticated user's own character likes & comment likes
  useEffect(() => {
    if (!isAuthReady || !authUser) return;

    const likesPath = 'likes';
    const likesQuery = query(
      collection(db, likesPath),
      where('uid', '==', authUser.uid)
    );
    const unsubLikes = onSnapshot(
      likesQuery,
      (snapshot) => {
        const next: Record<string, boolean> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (typeof data.characterId === 'string') {
            next[data.characterId] = true;
          }
        });
        setLikedCharIds(next);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, likesPath);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      }
    );

    const commentLikesPath = 'commentLikes';
    const commentLikesQuery = query(
      collection(db, commentLikesPath),
      where('uid', '==', authUser.uid)
    );
    const unsubCommentLikes = onSnapshot(
      commentLikesQuery,
      (snapshot) => {
        const next: Record<string, boolean> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (typeof data.commentId === 'string') {
            next[data.commentId] = true;
          }
        });
        setLikedCommentIds(next);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, commentLikesPath);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      }
    );

    return () => {
      unsubLikes();
      unsubCommentLikes();
    };
  }, [isAuthReady, authUser]);

  const ensureSignedIn = useCallback(async (): Promise<User | null> => {
    setFeedbackMessage('');
    if (auth.currentUser) {
      if (!auth.currentUser.emailVerified) {
        setFeedbackMessage(
          'Tài khoản Google của bạn chưa xác minh email để tương tác.'
        );
        return null;
      }
      return auth.currentUser;
    }

    setIsSigningIn(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (!cred.user.emailVerified) {
        setFeedbackMessage(
          'Tài khoản Google của bạn chưa xác minh email để tương tác.'
        );
        return null;
      }
      return cred.user;
    } catch (error) {
      const msg = formatAuthFeedback(error);
      if (msg) setFeedbackMessage(msg);
      return null;
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await ensureSignedIn();
  }, [ensureSignedIn]);

  const signOutGoogle = useCallback(async () => {
    setFeedbackMessage('');
    try {
      await signOut(auth);
    } catch {
      setFeedbackMessage('Không thể đăng xuất lúc này.');
    }
  }, []);

  const toggleCharacterLike = useCallback(
    async (characterId: string) => {
      if (
        !ID_PATTERN.test(characterId) ||
        characterId.length > CHARACTER_ID_MAX_LENGTH
      ) {
        return;
      }
      const user = await ensureSignedIn();
      if (!user) return;

      const likeId = `${characterId}__${user.uid}`;
      const likeRef = doc(db, 'likes', likeId);
      const statsRef = doc(db, 'characterStats', characterId);

      setIsMutating(true);
      try {
        await runTransaction(db, async (tx) => {
          const [likeSnap, statsSnap] = await Promise.all([
            tx.get(likeRef),
            tx.get(statsRef),
          ]);

          if (likeSnap.exists()) {
            const currentCount = statsSnap.exists()
              ? Number(statsSnap.data().likesCount ?? 0)
              : 1;
            tx.delete(likeRef);
            if (statsSnap.exists()) {
              tx.update(statsRef, {
                likesCount: Math.max(0, currentCount - 1),
                updatedAt: serverTimestamp(),
              });
            }
          } else {
            if (!statsSnap.exists()) {
              tx.set(statsRef, {
                characterId,
                likesCount: 1,
                commentsCount: 0,
                lastCommentId: '',
                isPublic: true,
                updatedAt: serverTimestamp(),
              });
            } else {
              const currentCount = Number(statsSnap.data().likesCount ?? 0);
              tx.update(statsRef, {
                likesCount: currentCount + 1,
                updatedAt: serverTimestamp(),
              });
            }
            tx.set(likeRef, {
              characterId,
              uid: user.uid,
              createdAt: serverTimestamp(),
            });
          }
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `likes/${likeId}`);
      } finally {
        setIsMutating(false);
      }
    },
    [ensureSignedIn]
  );

  const addComment = useCallback(
    async (
      characterId: string,
      authorName: string,
      content: string
    ): Promise<boolean> => {
      if (
        !ID_PATTERN.test(characterId) ||
        characterId.length > CHARACTER_ID_MAX_LENGTH
      ) {
        return false;
      }

      const cleanContent = content.trim().slice(0, COMMENT_MAX_LENGTH);
      if (!cleanContent) return false;

      const cleanAuthorName = (authorName.trim() || 'Khách ghé thăm').slice(
        0,
        AUTHOR_NAME_MAX_LENGTH
      );

      const user = await ensureSignedIn();
      if (!user) return false;

      const statsRef = doc(db, 'characterStats', characterId);
      const commentRef = doc(
        collection(db, 'characterStats', characterId, 'comments')
      );

      setIsMutating(true);
      try {
        await runTransaction(db, async (tx) => {
          const statsSnap = await tx.get(statsRef);
          if (!statsSnap.exists()) {
            tx.set(statsRef, {
              characterId,
              likesCount: 0,
              commentsCount: 1,
              lastCommentId: commentRef.id,
              isPublic: true,
              updatedAt: serverTimestamp(),
            });
          } else {
            const currentComments = Number(statsSnap.data().commentsCount ?? 0);
            tx.update(statsRef, {
              commentsCount: currentComments + 1,
              lastCommentId: commentRef.id,
              updatedAt: serverTimestamp(),
            });
          }

          tx.set(commentRef, {
            characterId,
            authorUid: user.uid,
            authorName: cleanAuthorName,
            content: cleanContent,
            likesCount: 0,
            lastLikeId: '',
            isPublic: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
        return true;
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.CREATE,
          `characterStats/${characterId}/comments/${commentRef.id}`
        );
      } finally {
        setIsMutating(false);
      }
    },
    [ensureSignedIn]
  );

  const deleteComment = useCallback(
    async (characterId: string, commentId: string) => {
      if (!ID_PATTERN.test(characterId) || !ID_PATTERN.test(commentId)) {
        return;
      }
      const user = auth.currentUser;
      if (!user) return;

      const statsRef = doc(db, 'characterStats', characterId);
      const commentRef = doc(
        db,
        'characterStats',
        characterId,
        'comments',
        commentId
      );

      setIsMutating(true);
      try {
        await runTransaction(db, async (tx) => {
          const [commentSnap, statsSnap] = await Promise.all([
            tx.get(commentRef),
            tx.get(statsRef),
          ]);
          if (!commentSnap.exists() || !statsSnap.exists()) return;
          if (commentSnap.data().authorUid !== user.uid) return;

          const currentComments = Number(statsSnap.data().commentsCount ?? 1);
          tx.delete(commentRef);
          tx.update(statsRef, {
            commentsCount: Math.max(0, currentComments - 1),
            lastCommentId: commentId,
            updatedAt: serverTimestamp(),
          });
        });
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.DELETE,
          `characterStats/${characterId}/comments/${commentId}`
        );
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const toggleCommentLike = useCallback(
    async (characterId: string, commentId: string) => {
      if (!ID_PATTERN.test(characterId) || !ID_PATTERN.test(commentId)) {
        return;
      }
      const user = await ensureSignedIn();
      if (!user) return;

      const commentLikeId = `${commentId}__${user.uid}`;
      const commentLikeRef = doc(db, 'commentLikes', commentLikeId);
      const commentRef = doc(
        db,
        'characterStats',
        characterId,
        'comments',
        commentId
      );

      setIsMutating(true);
      try {
        await runTransaction(db, async (tx) => {
          const [likeSnap, commentSnap] = await Promise.all([
            tx.get(commentLikeRef),
            tx.get(commentRef),
          ]);
          if (!commentSnap.exists()) return;

          const currentLikes = Number(commentSnap.data().likesCount ?? 0);
          if (likeSnap.exists()) {
            tx.delete(commentLikeRef);
            tx.update(commentRef, {
              likesCount: Math.max(0, currentLikes - 1),
              lastLikeId: commentLikeId,
              updatedAt: serverTimestamp(),
            });
          } else {
            tx.set(commentLikeRef, {
              characterId,
              commentId,
              uid: user.uid,
              createdAt: serverTimestamp(),
            });
            tx.update(commentRef, {
              likesCount: currentLikes + 1,
              lastLikeId: commentLikeId,
              updatedAt: serverTimestamp(),
            });
          }
        });
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `commentLikes/${commentLikeId}`
        );
      } finally {
        setIsMutating(false);
      }
    },
    [ensureSignedIn]
  );

  return {
    authUser,
    isAuthReady,
    statsByChar,
    likedCharIds,
    likedCommentIds,
    commentsByChar,
    isSigningIn,
    isMutating,
    feedbackMessage,
    clearFeedback: () => setFeedbackMessage(''),
    signInWithGoogle,
    signOutGoogle,
    toggleCharacterLike,
    addComment,
    deleteComment,
    toggleCommentLike,
  };
}
