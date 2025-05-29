import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserData } from './user.service';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('User Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getUserData', () => {
    it('should successfully fetch user profile', async () => {
      const mockProfile = {
        id: 'user123',
        display_name: 'Test User',
        email: 'test@example.com',
        images: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProfile),
      });

      const result = await getUserData('mock-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me',
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: 'Bearer mock-token',
          },
        })
      );
      expect(result).toEqual(mockProfile);
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(getUserData('mock-token')).rejects.toThrow('Network error');
    });

    it('should handle non-ok responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      // The function should still return the response, not throw
      const result = await getUserData('mock-token');
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('should include correct headers', async () => {
      const token = 'test-access-token';
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await getUserData(token);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    });
  });
}); 