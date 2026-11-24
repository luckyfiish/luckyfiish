/**
 * Payload-First Security TDD specification for Cá May Mắn Firestore Rules.
 * Verifies the "Dirty Dozen" adversarial payloads against the Eight Pillars.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  operation: 'create' | 'update' | 'delete' | 'list';
  path: string;
  auth: { uid: string; emailVerified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated comment create',
    operation: 'create',
    path: '/characterStats/giang-du-than/comments/cmt_01',
    auth: null,
    payload: {
      characterId: 'giang-du-than',
      authorUid: 'user-1',
      authorName: 'Khách',
      content: 'Xin chào',
      likesCount: 0,
      lastLikeId: '',
      isPublic: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified email comment create',
    operation: 'create',
    path: '/characterStats/giang-du-than/comments/cmt_02',
    auth: { uid: 'user-1', emailVerified: false },
    payload: {
      characterId: 'giang-du-than',
      authorUid: 'user-1',
      authorName: 'Khách',
      content: 'Xin chào',
      likesCount: 0,
      lastLikeId: '',
      isPublic: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Author UID spoofing',
    operation: 'create',
    path: '/characterStats/giang-du-than/comments/cmt_03',
    auth: { uid: 'user-A', emailVerified: true },
    payload: {
      characterId: 'giang-du-than',
      authorUid: 'user-B',
      authorName: 'Giả mạo',
      content: 'Bình luận giả mạo',
      likesCount: 0,
      lastLikeId: '',
      isPublic: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow field injection (isAdmin)',
    operation: 'create',
    path: '/characterStats/giang-du-than/comments/cmt_04',
    auth: { uid: 'user-A', emailVerified: true },
    payload: {
      characterId: 'giang-du-than',
      authorUid: 'user-A',
      authorName: 'Admin?',
      content: 'Test shadow field',
      likesCount: 0,
      lastLikeId: '',
      isPublic: true,
      isAdmin: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Oversized comment content (> 500 chars)',
    operation: 'create',
    path: '/characterStats/giang-du-than/comments/cmt_05',
    auth: { uid: 'user-A', emailVerified: true },
    payload: {
      characterId: 'giang-du-than',
      authorUid: 'user-A',
      authorName: 'User A',
      content: 'a'.repeat(501),
      likesCount: 0,
      lastLikeId: '',
      isPublic: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Oversized authorName (> 30 chars)',
    operation: 'create',
    path: '/characterStats/giang-du-than/comments/cmt_06',
    auth: { uid: 'user-A', emailVerified: true },
    payload: {
      characterId: 'giang-du-than',
      authorUid: 'user-A',
      authorName: 'N'.repeat(31),
      content: 'Hello',
      likesCount: 0,
      lastLikeId: '',
      isPublic: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Forged non-server timestamp',
    operation: 'create',
    path: '/characterStats/giang-du-than/comments/cmt_07',
    auth: { uid: 'user-A', emailVerified: true },
    payload: {
      characterId: 'giang-du-than',
      authorUid: 'user-A',
      authorName: 'User A',
      content: 'Backdated timestamp',
      likesCount: 0,
      lastLikeId: '',
      isPublic: true,
      createdAt: '2020-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Orphan stats likesCount jump without atomic like doc',
    operation: 'update',
    path: '/characterStats/giang-du-than',
    auth: { uid: 'user-A', emailVerified: true },
    payload: {
      likesCount: 999999,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Foreign deterministic like ID spoofing',
    operation: 'create',
    path: '/likes/giang-du-than__user-B',
    auth: { uid: 'user-A', emailVerified: true },
    payload: {
      characterId: 'giang-du-than',
      uid: 'user-B',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Unauthorized deletion of another user comment',
    operation: 'delete',
    path: '/characterStats/giang-du-than/comments/owned_by_user_A',
    auth: { uid: 'user-B', emailVerified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Content tampering during comment like action',
    operation: 'update',
    path: '/characterStats/giang-du-than/comments/owned_by_user_A',
    auth: { uid: 'user-B', emailVerified: true },
    payload: {
      likesCount: 1,
      lastLikeId: 'owned_by_user_A__user-B',
      content: 'Edited by attacker',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unauthorized list query on another user likes',
    operation: 'list',
    path: '/likes',
    auth: { uid: 'user-B', emailVerified: true },
    expected: 'PERMISSION_DENIED',
  },
];
