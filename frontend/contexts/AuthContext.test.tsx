import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';

const push = vi.fn();
const refresh = vi.fn();
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh, replace }),
}));

vi.mock('@/lib/api/client', () => ({
  refreshAccessToken: vi.fn(),
  getMe: vi.fn(),
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getAccessToken: vi.fn(),
  setUserTypeCookie: vi.fn(),
  clearSessionCookies: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  clearSupabaseBrowserSession: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/auth/navigation', () => ({
  getNextPathFromWindow: () => null,
}));

vi.mock('@/lib/auth/routes', () => ({
  homePathForUserType: (t: string) => (t === 'sponsor' ? '/sponsor/dashboard' : '/dashboard'),
}));

import { AuthProvider, useAuth } from './AuthContext';
import * as api from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/session';

const creator = { id: 'u1', email: 'a@b.co', name: 'Ann', username: 'ann', userType: 'creator' as const };

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

const mocked = {
  getAccessToken: getAccessToken as ReturnType<typeof vi.fn>,
  refreshAccessToken: api.refreshAccessToken as ReturnType<typeof vi.fn>,
  getMe: api.getMe as ReturnType<typeof vi.fn>,
  login: api.login as ReturnType<typeof vi.fn>,
  logout: api.logout as ReturnType<typeof vi.fn>,
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the current user on mount when a token is present', async () => {
    mocked.getAccessToken.mockReturnValue('token');
    mocked.getMe.mockResolvedValue({ user: creator });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(creator);
  });

  it('ends with a null user when there is no token and refresh fails', async () => {
    mocked.getAccessToken.mockReturnValue(null);
    mocked.refreshAccessToken.mockResolvedValue(false);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('restores the session on a login page from the refresh cookie and moves on', async () => {
    window.history.pushState({}, '', '/login/creator');
    mocked.getAccessToken.mockReturnValueOnce(null).mockReturnValue('token');
    mocked.refreshAccessToken.mockResolvedValue(true);
    mocked.getMe.mockResolvedValue({ user: creator });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).toEqual(creator));
    expect(replace).toHaveBeenCalledWith('/dashboard');
    window.history.pushState({}, '', '/');
  });

  it('does not redirect when the session is restored outside auth pages', async () => {
    mocked.getAccessToken.mockReturnValue('token');
    mocked.getMe.mockResolvedValue({ user: creator });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(replace).not.toHaveBeenCalled();
  });

  it('navigates to the role home after a successful login', async () => {
    mocked.getAccessToken.mockReturnValue(null);
    mocked.refreshAccessToken.mockResolvedValue(false);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Now a login succeeds and the profile resolves.
    mocked.login.mockResolvedValue(undefined);
    mocked.getAccessToken.mockReturnValue('token');
    mocked.getMe.mockResolvedValue({ user: creator });

    await act(async () => {
      await result.current.login({ email: 'a@b.co', password: 'pw' });
    });

    expect(mocked.login).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/dashboard');
    expect(result.current.user).toEqual(creator);
  });

  it('clears the user and navigates home on logout', async () => {
    mocked.getAccessToken.mockReturnValue('token');
    mocked.getMe.mockResolvedValue({ user: creator });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(creator));

    mocked.logout.mockResolvedValue(undefined);
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(push).toHaveBeenCalledWith('/');
  });
});
