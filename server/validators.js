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

// Swedish mobile number. Accepts 070-123 45 67, 0701234567, +46701234567, 0046701234567.
// Returns the number as +46701234567, or null if it is not valid.
export function cleanPhone(value) {
  if (typeof value !== 'string') return null;
  let digits = value.replace(/[\s\-()]/g, '');
  if (digits.startsWith('0046')) digits = `+${digits.slice(2)}`;
  else if (digits.startsWith('0')) digits = `+46${digits.slice(1)}`;
  return /^\+467\d{8}$/.test(digits) ? digits : null;
}
