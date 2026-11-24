# Security Specification — Cá May Mắn (`luckyfiish`)

## 1. Data Invariants
1. **Master Gate & Atomicity (`characterStats` <-> `comments` / `likes`)**:
   - Every `likes/{characterId}__{uid}` creation or deletion MUST atomically increment or decrement `/characterStats/{characterId}.likesCount` by exactly `1` in the same Firestore batch.
   - Every `/characterStats/{characterId}/comments/{commentId}` creation or deletion MUST atomically increment or decrement `/characterStats/{characterId}.commentsCount` by exactly `1` and record `lastCommentId == commentId` in the same Firestore batch.
   - Every `/commentLikes/{commentId}__{uid}` creation or deletion MUST atomically increment or decrement `/characterStats/{characterId}/comments/{commentId}.likesCount` by exactly `1` and record `lastLikeId == commentLikeId` in the same Firestore batch.
2. **Identity Integrity & Immutability**:
   - Writes strictly require an authenticated, email-verified user (`request.auth != null && request.auth.token.email_verified == true`).
   - `authorUid` on comments and `uid` on likes/commentLikes MUST equal `request.auth.uid`.
   - Deterministic IDs (`{characterId}__{uid}` and `{commentId}__{uid}`) enforce 1-like-per-user-per-target.
   - Only the original `authorUid` may delete a comment; comment `content`, `authorUid`, `authorName`, `characterId`, and `createdAt` are immutable after creation.
3. **PII Isolation & Bounded Inputs**:
   - No PII (`email`, `phone`, `address`) is ever written to Firestore. Only the visitor's chosen nickname (`authorName`, 1–30 chars) is stored on public comments.
   - All document IDs are validated against `^[a-zA-Z0-9_\-]+$` (max 128 chars).
   - Server timestamps (`request.time`) are strictly enforced for `createdAt` and `updatedAt`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return `PERMISSION_DENIED`)
1. **Unauthenticated Comment Create**: `authorUid: "user-1", authorName: "Hacker", content: "Hi"` with `auth == null`.
2. **Unverified Email Write**: Same valid comment payload with `auth.token.email_verified == false`.
3. **Author UID Spoofing**: Signed-in as `user-A`, create comment with `authorUid: "user-B"`.
4. **Ghost / Shadow Field Injection**: Signed-in as `user-A`, create comment with extra field `isAdmin: true` or `verified: true`.
5. **Oversized Content DoS**: Create comment with `content` of 501+ characters (or empty `""`).
6. **Oversized Display Name**: Create comment with `authorName` of 31+ characters (or empty `""`).
7. **Forged Client Timestamp**: Create comment with `createdAt` set to a past/future client timestamp instead of `request.time`.
8. **Orphan Counter Tampering**: Update `/characterStats/giang-du-than` setting `likesCount: 999999` without creating a matching `likes/{characterId}__{uid}` doc in the same atomic batch.
9. **Double Like / Foreign Like ID**: Create `/likes/giang-du-than__user-B` while authenticated as `user-A`.
10. **Unauthorized Comment Deletion**: Signed-in as `user-B`, attempt to delete a comment owned by `user-A`.
11. **Content Tampering via Like Action**: Signed-in as `user-B`, update `user-A`'s comment changing both `likesCount` and `content`.
12. **Blanket Private Likes Scraping**: Signed-in as `user-B`, query `/likes` where `uid == "user-A"` or without a `uid == request.auth.uid` filter.
