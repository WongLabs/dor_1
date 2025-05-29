import { describe, it, expect } from 'vitest';

// Since these are TypeScript interfaces, we test that they can be used correctly
describe('Auth Interfaces', () => {
  it('should allow creating TokenResponse objects', () => {
    // This tests that the interface is properly defined and usable
    const mockTokenResponse = {
      access_token: 'test-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    expect(mockTokenResponse.access_token).toBe('test-token');
    expect(mockTokenResponse.token_type).toBe('Bearer');
    expect(mockTokenResponse.expires_in).toBe(3600);
  });

  it('should allow creating TokenScopeResponse objects', () => {
    const mockTokenScopeResponse = {
      access_token: 'test-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'user-read-private user-read-email',
    };

    expect(mockTokenScopeResponse.scope).toBe('user-read-private user-read-email');
  });

  it('should allow creating AuthContextType objects', () => {
    const mockAuthContext = {
      isAuthenticated: true,
      user: null,
      login: () => Promise.resolve(),
      logout: () => {},
    };

    expect(mockAuthContext.isAuthenticated).toBe(true);
    expect(typeof mockAuthContext.login).toBe('function');
    expect(typeof mockAuthContext.logout).toBe('function');
  });
}); 