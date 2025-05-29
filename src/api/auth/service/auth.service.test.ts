import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { redirectToSpotifyAuthorize, getToken, getRefreshToken } from './auth.service';

// Mock crypto and window
const mockCrypto = {
  getRandomValues: vi.fn(),
  subtle: {
    digest: vi.fn(),
  },
};

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
};

const mockWindow = {
  location: { href: '' },
  localStorage: mockLocalStorage,
};

// Use Object.defineProperty instead of direct assignment
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Mock btoa
const mockBtoa = vi.fn();
Object.defineProperty(global, 'btoa', {
  value: mockBtoa,
  writable: true,
});

// Mock TextEncoder properly
Object.defineProperty(global, 'TextEncoder', {
  value: class MockTextEncoder {
    encode(input: string) {
      return new Uint8Array(Array.from(input).map(char => char.charCodeAt(0)));
    }
  },
  writable: true,
});

describe('Auth Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup default mocks
    mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([1, 2, 3, 4]));
    mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));
    mockBtoa.mockReturnValue('mocked-base64');
    mockLocalStorage.getItem.mockReturnValue('mock-code-verifier');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('redirectToSpotifyAuthorize', () => {
    it('should generate code verifier and redirect to Spotify', async () => {
      await redirectToSpotifyAuthorize();

      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('code_verifier', expect.any(String));
      expect(mockWindow.location.href).toContain('accounts.spotify.com/authorize');
    });

    it('should include correct parameters in auth URL', async () => {
      await redirectToSpotifyAuthorize();

      expect(mockWindow.location.href).toContain('response_type=code');
      expect(mockWindow.location.href).toContain('scope=user-read-private+user-read-email');
      expect(mockWindow.location.href).toContain('code_challenge_method=S256');
    });
  });

  describe('getToken', () => {
    it('should successfully get token with valid code', async () => {
      const mockResponse = {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'user-read-private user-read-email',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getToken('mock-code');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when code verifier not found', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(getToken('mock-code')).rejects.toThrow(
        'Code verifier not found in localStorage'
      );
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      });

      await expect(getToken('mock-code')).rejects.toThrow('Failed to fetch token');
    });
  });

  describe('getRefreshToken', () => {
    it('should successfully refresh token', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getRefreshToken('mock-refresh-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle null refresh token', async () => {
      const mockResponse = { access_token: 'token' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getRefreshToken(null as any);

      expect(mockFetch).toHaveBeenCalled();
    });
  });
}); 