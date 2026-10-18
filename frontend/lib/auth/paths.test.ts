import { describe, it, expect } from 'vitest';
import { isAuthRoute, isCreatorRoute, isProtectedRoute, isSponsorRoute } from './paths';

describe('isCreatorRoute', () => {
  it('matches creator prefixes exactly and as path segments', () => {
    expect(isCreatorRoute('/dashboard')).toBe(true);
    expect(isCreatorRoute('/dashboard/settings')).toBe(true);
    expect(isCreatorRoute('/sponsorships')).toBe(true);
    expect(isCreatorRoute('/wallet')).toBe(true);
    expect(isCreatorRoute('/platforms')).toBe(true);
    expect(isCreatorRoute('/settings')).toBe(true);
  });

  it('does not treat sponsor or public routes as creator routes', () => {
    expect(isCreatorRoute('/sponsor')).toBe(false);
    expect(isCreatorRoute('/sponsor/dashboard')).toBe(false);
    expect(isCreatorRoute('/login')).toBe(false);
    expect(isCreatorRoute('/')).toBe(false);
  });

  it('does not match a prefix that is only a partial segment', () => {
    // "/dashboardx" should not be considered the "/dashboard" route.
    expect(isCreatorRoute('/dashboardx')).toBe(false);
  });
});

describe('isSponsorRoute', () => {
  it('matches the sponsor root and its children', () => {
    expect(isSponsorRoute('/sponsor')).toBe(true);
    expect(isSponsorRoute('/sponsor/dashboard')).toBe(true);
    expect(isSponsorRoute('/sponsor/campaigns/123')).toBe(true);
  });

  it('does not match creator or public routes', () => {
    expect(isSponsorRoute('/dashboard')).toBe(false);
    expect(isSponsorRoute('/sponsorships')).toBe(false); // creator route, not sponsor
    expect(isSponsorRoute('/login')).toBe(false);
  });
});

describe('isProtectedRoute', () => {
  it('is true for both creator and sponsor routes', () => {
    expect(isProtectedRoute('/wallet')).toBe(true);
    expect(isProtectedRoute('/sponsor/dashboard')).toBe(true);
  });

  it('is false for public routes', () => {
    expect(isProtectedRoute('/')).toBe(false);
    expect(isProtectedRoute('/login')).toBe(false);
    expect(isProtectedRoute('/docs')).toBe(false);
  });
});

describe('isAuthRoute', () => {
  it('matches login and signup pages', () => {
    expect(isAuthRoute('/login')).toBe(true);
    expect(isAuthRoute('/login/creator')).toBe(true);
    expect(isAuthRoute('/signup/sponsor')).toBe(true);
  });

  it('ignores app and lookalike routes', () => {
    expect(isAuthRoute('/dashboard')).toBe(false);
    expect(isAuthRoute('/loginx')).toBe(false);
  });
});
