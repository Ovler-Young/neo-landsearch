export function parseBlacklistedForumIds(value?: string) {
  return (value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function buildForumBlacklistQuery(blacklistedForumIds: string[]) {
  const uniqueForumIds = [...new Set(blacklistedForumIds)];
  if (uniqueForumIds.length === 0) return "";

  if (uniqueForumIds.length === 1) {
    return `(fid != ${uniqueForumIds[0]})`;
  }

  return `(fid NOT IN [${uniqueForumIds.join(", ")}])`;
}

export function appendForumBlacklistQuery(
  query: string,
  blacklistedForumIds: string[]
) {
  const blacklistQuery = buildForumBlacklistQuery(blacklistedForumIds);
  if (!blacklistQuery) return query;

  const trimmedQuery = query.trim();
  return trimmedQuery ? `${trimmedQuery} ${blacklistQuery}` : blacklistQuery;
}
