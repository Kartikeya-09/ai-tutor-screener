const CANDIDATE_AUTH_KEY = 'candidateAuth';
const ADMIN_AUTH_KEY = 'adminAuth';

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadBase64.padEnd(payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const isCandidateTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
};

export const getCandidateTokenExpiryMs = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
};

const parseValue = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const getCandidateAuth = () => {
  if (typeof window === 'undefined') return null;

  const parsed = parseValue(localStorage.getItem(CANDIDATE_AUTH_KEY));
  if (!parsed?.token) return null;

  if (isCandidateTokenExpired(parsed.token)) {
    clearCandidateAuth();
    return null;
  }

  return parsed;
};

export const setCandidateAuth = (authPayload) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CANDIDATE_AUTH_KEY, JSON.stringify(authPayload));
};

export const clearCandidateAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CANDIDATE_AUTH_KEY);
  localStorage.removeItem('interviewSession');
};

export const startCandidateAutoLogout = (onAutoLogout) => {
  if (typeof window === 'undefined') return null;

  const auth = getCandidateAuth();
  if (!auth?.token) return null;

  const expiryMs = getCandidateTokenExpiryMs(auth.token);
  if (!expiryMs) return null;

  const delay = Math.max(0, expiryMs - Date.now());
  const timeoutId = window.setTimeout(() => {
    clearCandidateAuth();
    if (typeof onAutoLogout === 'function') {
      onAutoLogout();
    }
  }, delay);

  return timeoutId;
};

export const getAdminAuth = () => {
  if (typeof window === 'undefined') return null;
  return parseValue(localStorage.getItem(ADMIN_AUTH_KEY));
};

export const setAdminAuth = (authPayload) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(authPayload));
};

export const clearAdminAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_AUTH_KEY);
};