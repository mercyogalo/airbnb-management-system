import type { User } from '@/types';

export const AUTH_TOKEN_KEY = 'stayeasy_token';
export const AUTH_USER_KEY = 'stayeasy_user';
export const AUTH_ROLE_COOKIE = 'stayeasy_role';
export const AUTH_TOKEN_COOKIE = 'stayeasy_token';

type AuthUserInput = Partial<User> & Pick<User, 'name' | 'email' | 'role'>;

function isBrowser() {
  return typeof window !== 'undefined';
}

function writeCookie(name: string, value: string, days = 7) {
  if (!isBrowser()) return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (!isBrowser()) return;
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`;
}

export function normalizeAuthUser(user: AuthUserInput): User {
  const id = user.id ?? user._id;
  if (!id) {
    throw new Error('Invalid user payload: missing id');
  }

  // Legacy sessions used `owner`; host is now a single `admin` account.
  const rawRole = user.role as string;
  const role: User['role'] = rawRole === 'owner' ? 'admin' : (user.role as User['role']);

  return {
    id,
    _id: user._id ?? id,
    name: user.name,
    email: user.email,
    role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function setAuthSession(user: User, token: string) {
  if (!isBrowser()) return;
  const normalizedUser = normalizeAuthUser(user);
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser));
  writeCookie(AUTH_TOKEN_COOKIE, token);
  writeCookie(AUTH_ROLE_COOKIE, normalizedUser.role);
}

export function clearAuthSession() {
  if (!isBrowser()) return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  clearCookie(AUTH_TOKEN_COOKIE);
  clearCookie(AUTH_ROLE_COOKIE);
}

export function getStoredToken() {
  if (!isBrowser()) return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredAuth() {
  if (!isBrowser()) {
    return { user: null as User | null, token: null as string | null };
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const rawUser = localStorage.getItem(AUTH_USER_KEY);
  if (!token || !rawUser) {
    clearAuthSession();
    return { user: null as User | null, token: null as string | null };
  }

  try {
    const user = normalizeAuthUser(JSON.parse(rawUser) as AuthUserInput);

    // Keep middleware cookies aligned with client-side session state.
    writeCookie(AUTH_TOKEN_COOKIE, token);
    writeCookie(AUTH_ROLE_COOKIE, user.role);

    return { user, token };
  } catch {
    clearAuthSession();
    return { user: null as User | null, token: null as string | null };
  }
}
