// Player token + nickname are saved in localStorage.
// localStorage can throw (private mode, blocked data), so we wrap it in try/catch.
const TOKEN_KEY = 'arrowpuzzle.token';
const NICKNAME_KEY = 'arrowpuzzle.nickname';

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore: the game still works, the player just has to log in again.
  }
}

export const getToken = () => read(TOKEN_KEY);
export const getNickname = () => read(NICKNAME_KEY);

export function savePlayer(token, nickname) {
  write(TOKEN_KEY, token);
  write(NICKNAME_KEY, nickname);
}

// The invite code from a friend's link (/?ref=ABC234). sessionStorage: only for this visit.
const REF_KEY = 'arrowpuzzle.ref';

export function saveInviteRef(code) {
  try {
    sessionStorage.setItem(REF_KEY, code);
  } catch {
    // Ignore: the game works without it.
  }
}

export function getInviteRef() {
  try {
    return sessionStorage.getItem(REF_KEY);
  } catch {
    return null;
  }
}

export function clearInviteRef() {
  try {
    sessionStorage.removeItem(REF_KEY);
  } catch {
    // Ignore.
  }
}
