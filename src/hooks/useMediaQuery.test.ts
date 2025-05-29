import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useMediaQuery from './useMediaQuery';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

describe('useMediaQuery', () => {
  let mockMediaQueryList: any;

  beforeEach(() => {
    mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQueryList);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return false when media query does not match', () => {
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(false);
    expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 768px)');
  });

  it('should return true when media query matches', () => {
    mockMediaQueryList.matches = true;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(true);
  });

  it('should add event listener on mount', () => {
    renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    unmount();

    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('should update when media query changes', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1];
      mockMediaQueryList.matches = true;
      changeHandler(mockMediaQueryList);
    });

    expect(result.current).toBe(true);
  });

  it('should handle different query strings', () => {
    const queries = [
      '(max-width: 600px)',
      '(orientation: portrait)',
      '(prefers-color-scheme: dark)',
    ];

    queries.forEach((query) => {
      renderHook(() => useMediaQuery(query));
      expect(mockMatchMedia).toHaveBeenCalledWith(query);
    });
  });
}); 