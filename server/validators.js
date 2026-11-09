// Returns a clean nickname (trimmed), or null if it is not valid.
export function cleanNickname(value) {
  if (typeof value !== 'string') return null;
  const nickname = value.trim();
  if (nickname.length < 2 || nickname.length > 20) return null;
  return nickname;
}

export const DONATION_METHODS = ['qr', 'swish_link'];
export const DONATION_STATUSES = ['clicked', 'simulated_paid'];

// Whole kronor, 1-10000. Returns the number, or null if it is not valid.
export function cleanAmount(value) {
  if (!Number.isInteger(value) || value < 1 || value > 10000) return null;
  return value;
}
