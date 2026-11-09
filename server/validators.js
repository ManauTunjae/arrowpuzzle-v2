// Returns a clean nickname (trimmed), or null if it is not valid.
export function cleanNickname(value) {
  if (typeof value !== 'string') return null;
  const nickname = value.trim();
  if (nickname.length < 2 || nickname.length > 20) return null;
  return nickname;
}
