import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './AuthContext';

// Mock the auth service
vi.mock('../api/auth/service/auth.service', () => ({
  getToken: vi.fn(),
  getRefreshToken: vi.fn(),
  redirectToSpotifyAuthorize: vi.fn(),
}));

// Mock the user service
vi.mock('../api/user/service/user.service', () => ({
  getProfile: vi.fn(),
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { accessToken, refreshToken, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="access-token">{accessToken || 'no-access-token'}</div>
      <div data-testid="refresh-token">{refreshToken || 'no-refresh-token'}</div>
      <button onClick={login} data-testid="login-btn">Login</button>
      <button onClick={logout} data-testid="logout-btn">Logout</button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset window location
    Object.defineProperty(window, 'location', {
      value: { search: '', href: 'http://localhost:3000' },
      writable: true,
    });
  });

  it('provides initial auth state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('access-token')).toHaveTextContent('no-access-token');
    expect(screen.getByTestId('refresh-token')).toHaveTextContent('no-refresh-token');
  });

  it('provides tokens from localStorage', () => {
    localStorage.setItem('access_token', 'test-access-token');
    localStorage.setItem('refresh_token', 'test-refresh-token');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('access-token')).toHaveTextContent('test-access-token');
    expect(screen.getByTestId('refresh-token')).toHaveTextContent('test-refresh-token');
  });

  it('handles login action', async () => {
    const mockRedirect = vi.fn();
    const authService = await import('../api/auth/service/auth.service');
    vi.mocked(authService.redirectToSpotifyAuthorize).mockImplementation(mockRedirect);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('login-btn');
    loginBtn.click();

    await waitFor(() => {
      expect(mockRedirect).toHaveBeenCalled();
    });
  });

  it('handles logout action', () => {
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('refresh_token', 'test-refresh');
    
    // Mock window.location.href assignment
    const mockLocation = { href: '' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const logoutBtn = screen.getByTestId('logout-btn');
    logoutBtn.click();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(mockLocation.href).toBe('/login');
  });

  it('handles token exchange on mount with code', async () => {
    const mockToken = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 3600
    };
    const mockGetToken = vi.fn().mockResolvedValue(mockToken);
    const authService = await import('../api/auth/service/auth.service');
    vi.mocked(authService.getToken).mockImplementation(mockGetToken);

    // Mock window.history.replaceState
    const mockReplaceState = vi.fn();
    Object.defineProperty(window, 'history', {
      value: { replaceState: mockReplaceState },
      writable: true,
    });

    // Set URL with auth code
    Object.defineProperty(window, 'location', {
      value: { 
        search: '?code=test-code',
        href: 'http://localhost:3000?code=test-code'
      },
      writable: true,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockGetToken).toHaveBeenCalledWith('test-code');
    });

    expect(localStorage.getItem('access_token')).toBe('new-access-token');
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
  });

  it('handles token exchange error gracefully', async () => {
    const mockGetToken = vi.fn().mockRejectedValue(new Error('Token error'));
    const authService = await import('../api/auth/service/auth.service');
    vi.mocked(authService.getToken).mockImplementation(mockGetToken);

    Object.defineProperty(window, 'location', {
      value: { search: '?code=test-code' },
      writable: true,
    });

    // Spy on console.error to suppress the error in tests
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockGetToken).toHaveBeenCalledWith('test-code');
    });

    // Wait for error to be handled
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should not crash and tokens should remain null
    expect(screen.getByTestId('access-token')).toHaveTextContent('no-access-token');
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
}); 