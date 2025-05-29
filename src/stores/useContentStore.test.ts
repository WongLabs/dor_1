import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContentStore } from './useContentStore';
import { MainContent } from '../data-objects/enum';

describe('useContentStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useContentStore.setState({ currentContent: MainContent.BROWSE });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useContentStore());

      expect(result.current.currentContent).toBe(MainContent.BROWSE);
    });
  });

  describe('Content Management', () => {
    it('should set current content to PROFILE', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setCurrentContent(MainContent.PROFILE);
      });

      expect(result.current.currentContent).toBe(MainContent.PROFILE);
    });

    it('should set current content to SETTINGS', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setCurrentContent(MainContent.SETTINGS);
      });

      expect(result.current.currentContent).toBe(MainContent.SETTINGS);
    });

    it('should set current content to ALBUMS', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setCurrentContent(MainContent.ALBUMS);
      });

      expect(result.current.currentContent).toBe(MainContent.ALBUMS);
    });

    it('should set current content to PLAYLISTS', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setCurrentContent(MainContent.PLAYLISTS);
      });

      expect(result.current.currentContent).toBe(MainContent.PLAYLISTS);
    });

    it('should set current content to TRACKS', () => {
      const { result } = renderHook(() => useContentStore());

      act(() => {
        result.current.setCurrentContent(MainContent.TRACKS);
      });

      expect(result.current.currentContent).toBe(MainContent.TRACKS);
    });

    it('should set current content to BROWSE', () => {
      const { result } = renderHook(() => useContentStore());

      // Start with different content
      act(() => {
        result.current.setCurrentContent(MainContent.PROFILE);
      });

      expect(result.current.currentContent).toBe(MainContent.PROFILE);

      // Change back to BROWSE
      act(() => {
        result.current.setCurrentContent(MainContent.BROWSE);
      });

      expect(result.current.currentContent).toBe(MainContent.BROWSE);
    });

    it('should update content multiple times correctly', () => {
      const { result } = renderHook(() => useContentStore());

      // Change content multiple times
      act(() => {
        result.current.setCurrentContent(MainContent.PROFILE);
      });
      expect(result.current.currentContent).toBe(MainContent.PROFILE);

      act(() => {
        result.current.setCurrentContent(MainContent.SETTINGS);
      });
      expect(result.current.currentContent).toBe(MainContent.SETTINGS);

      act(() => {
        result.current.setCurrentContent(MainContent.TRACKS);
      });
      expect(result.current.currentContent).toBe(MainContent.TRACKS);

      act(() => {
        result.current.setCurrentContent(MainContent.BROWSE);
      });
      expect(result.current.currentContent).toBe(MainContent.BROWSE);
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should synchronize state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useContentStore());
      const { result: result2 } = renderHook(() => useContentStore());

      expect(result1.current.currentContent).toBe(MainContent.BROWSE);
      expect(result2.current.currentContent).toBe(MainContent.BROWSE);

      act(() => {
        result1.current.setCurrentContent(MainContent.PROFILE);
      });

      expect(result1.current.currentContent).toBe(MainContent.PROFILE);
      expect(result2.current.currentContent).toBe(MainContent.PROFILE);

      act(() => {
        result2.current.setCurrentContent(MainContent.SETTINGS);
      });

      expect(result1.current.currentContent).toBe(MainContent.SETTINGS);
      expect(result2.current.currentContent).toBe(MainContent.SETTINGS);
    });
  });

  describe('Enum Values', () => {
    it('should work with all MainContent enum values', () => {
      const { result } = renderHook(() => useContentStore());

      const allContentTypes = [
        MainContent.PROFILE,
        MainContent.SETTINGS,
        MainContent.ALBUMS,
        MainContent.PLAYLISTS,
        MainContent.TRACKS,
        MainContent.BROWSE,
      ];

      allContentTypes.forEach((contentType) => {
        act(() => {
          result.current.setCurrentContent(contentType);
        });

        expect(result.current.currentContent).toBe(contentType);
      });
    });
  });
}); 