-- Run after applying migrations (psql or: pnpm exec prisma db execute --file scripts/verifyQueryIndexes.sql)
-- Expect index scans on large tables, not sequential scans.

EXPLAIN ANALYZE
SELECT "id", "clerkUserId", "name"
FROM "User"
WHERE "name" ILIKE '%ken%'
LIMIT 20;

EXPLAIN ANALYZE
SELECT "id", "characterName"
FROM "Character"
WHERE "heraldName" ILIKE '%ken%'
LIMIT 20;

EXPLAIN ANALYZE
SELECT "id", "clerkUserId", "provider", "status", "createdAt"
FROM "UserIdentityClaim"
WHERE "status" = 'pending'
ORDER BY "createdAt" DESC;

EXPLAIN ANALYZE
SELECT "id", "providerUserId", "clerkUserId"
FROM "UserIdentityLink"
WHERE "provider" = 'discord' AND "status" = 'linked';

EXPLAIN ANALYZE
SELECT "id", "characterName"
FROM "Character"
WHERE LOWER("characterName") = LOWER('SomeName')
LIMIT 1;
