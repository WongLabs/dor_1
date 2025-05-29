import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAudioStore, { Track } from './audioStore';

// Mock WaveSurfer
const mockWaveSurfer = {
  play: vi.fn(),
  pause: vi.fn(),
  seekTo: vi.fn(),
  setVolume: vi.fn(),
  destroy: vi.fn(),
};

// Mock Web Audio API
const mockAudioContext = {
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createMediaElementSource: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  destination: {},
};

const mockAudioElement = {
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  volume: 0.75,
  currentTime: 0,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  src: '',
  load: vi.fn(),
  paused: false,
  ended: false,
  readyState: 4,
};

// Mock global audio context
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn(() => mockAudioContext),
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: vi.fn(() => mockAudioContext),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AudioStore', () => {
  const mockTrack: Track = {
    id: '1',
    title: 'Test Track',
    artist: 'Test Artist',
    audioSrc: '/audio/test.mp3',
    imageUrl: '/images/test.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Explicitly re-attach/re-define mock implementations after clearAllMocks
    // as clearAllMocks might affect the vi.fn() instances themselves.
    mockAudioElement.play = vi.fn().mockResolvedValue(undefined);
    mockAudioElement.pause = vi.fn();
    mockAudioElement.load = vi.fn();
    // Ensure other methods on mockAudioElement that are spies are also reset if necessary,
    // though their core behavior (like returning values) should ideally persist 
    // unless explicitly changed by mockImplementationOnce etc.

    localStorageMock.getItem.mockReturnValue(null);
    act(() => {
        useAudioStore.setState({
            currentTrack: null,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            volume: 0.75,
            audioElement: null,
            waveSurferInstance: null,
            isReady: false,
            playIntentId: null,
            seenTrackIds: new Set(),
            // Ensure any other relevant state is reset
            audioContext: null, 
            mediaElementSource: null,
            fxChainInput: null,
            fxChainOutput: null,
        });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAudioStore());

      expect(result.current.currentTrack).toBeNull();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentTime).toBe(0);
      expect(result.current.duration).toBe(0);
      expect(result.current.volume).toBe(0.75);
      expect(result.current.audioElement).toBeNull();
      expect(result.current.waveSurferInstance).toBeNull();
      expect(result.current.isReady).toBe(false);
      expect(result.current.playIntentId).toBeNull();
      expect(result.current.seenTrackIds).toEqual(new Set());
    });
  });

  describe('Track Management', () => {
    it('should load a track correctly', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.loadTrack(mockTrack);
      });

      expect(result.current.currentTrack).toEqual(mockTrack);
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentTime).toBe(0);
      expect(result.current.duration).toBe(0);
      expect(result.current.isReady).toBe(false);
      expect(result.current.playIntentId).toBeNull();
    });

    it('should mark track as seen when loading with play intent', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setPlayIntent('test-intent');
        result.current.loadTrack(mockTrack);
      });

      expect(result.current.seenTrackIds.has(mockTrack.id)).toBe(true);
    });

    it('should mark track as seen when playing', async () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.loadTrack(mockTrack);
        result.current._setIsReady(true);
        result.current.setAudioElement(mockAudioElement as any);
        result.current.play();
      });

      await vi.waitFor(() => {
        expect(result.current.seenTrackIds.has(mockTrack.id)).toBe(true);
      });
    });
  });

  describe('Playback Controls', () => {
    it('should play track with audio element', async () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.loadTrack(mockTrack);
        result.current._setIsReady(true);
        result.current.setAudioElement(mockAudioElement as any);
      });

      // play() is async due to audioElement.play().then()
      await act(async () => {
        result.current.play();
      });

      expect(mockAudioElement.play).toHaveBeenCalled();
      // isPlaying should be true after the promise resolves
      await vi.waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      });
    });

    it('should play track with WaveSurfer instance', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.loadTrack(mockTrack);
        result.current._setIsReady(true);
        result.current.setWaveSurferInstance(mockWaveSurfer as any);
        result.current.play();
      });

      expect(mockWaveSurfer.play).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(true);
    });

    it('should not play when not ready', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.loadTrack(mockTrack);
        result.current.setAudioElement(mockAudioElement as any);
        result.current.play();
      });

      expect(mockAudioElement.play).not.toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(false);
    });

    it('should not play when no current track', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current._setIsReady(true);
        result.current.setAudioElement(mockAudioElement as any);
        result.current.play();
      });

      expect(mockAudioElement.play).not.toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(false);
    });

    it('should pause track with audio element', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setAudioElement(mockAudioElement as any);
        result.current.pause();
      });

      expect(mockAudioElement.pause).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(false);
    });

    it('should pause track with WaveSurfer instance', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setWaveSurferInstance(mockWaveSurfer as any);
        result.current.pause();
      });

      expect(mockWaveSurfer.pause).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(false);
    });

    it('should toggle play/pause correctly', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.loadTrack(mockTrack);
        result.current._setIsReady(true);
        result.current.setWaveSurferInstance(mockWaveSurfer as any);
      });

      act(() => {
        result.current.togglePlayPause();
      });

      expect(mockWaveSurfer.play).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.togglePlayPause();
      });

      expect(mockWaveSurfer.pause).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('Seeking and Volume', () => {
    it('should seek to time with WaveSurfer', () => {
      const { result } = renderHook(() => useAudioStore());
      act(() => {
        result.current.setWaveSurferInstance(mockWaveSurfer as any);
        (mockWaveSurfer as any).getDuration = vi.fn().mockReturnValue(100);
        result.current._updateDuration(100);
        result.current._setIsReady(true);
      });
      act(() => {
        result.current.seekTo(50);
      });
      expect(mockWaveSurfer.seekTo).toHaveBeenCalledWith(0.5);
      expect(result.current.currentTime).toBe(50);
    });

    it('should seek to time with audio element fallback', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.loadTrack(mockTrack); 
        (mockAudioElement as any).duration = 100;
        (mockAudioElement as any).currentTime = 0; 
        result.current.setAudioElement(mockAudioElement as any);
        result.current._updateDuration(100);
        result.current._setIsReady(true);
      });

      act(() => {
        result.current.seekTo(30);
      });

      expect(mockAudioElement.currentTime).toBe(30);
      expect(result.current.currentTime).toBe(30);
    });

    it('should clamp seek time to valid range', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setAudioElement(mockAudioElement as any);
        result.current._updateDuration(100);
        result.current.seekTo(-10);
      });

      expect(result.current.currentTime).toBe(0);

      act(() => {
        result.current.seekTo(150);
      });

      expect(result.current.currentTime).toBe(100);
    });

    it('should set volume correctly', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setAudioElement(mockAudioElement as any);
        result.current.setWaveSurferInstance(mockWaveSurfer as any);
        result.current.setVolume(0.5);
      });

      expect(mockAudioElement.volume).toBe(0.5);
      expect(mockWaveSurfer.setVolume).toHaveBeenCalledWith(0.5);
      expect(result.current.volume).toBe(0.5);
    });

    it('should clamp volume to valid range', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setAudioElement(mockAudioElement as any);
        result.current.setVolume(1.5);
      });

      expect(result.current.volume).toBe(1);

      act(() => {
        result.current.setVolume(-0.5);
      });

      expect(result.current.volume).toBe(0);
    });
  });

  describe('Audio Element Management', () => {
    it('should set audio element and create audio context', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setAudioElement(mockAudioElement as any);
      });

      expect(result.current.audioElement).toBe(mockAudioElement);
      expect(window.AudioContext).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(2);
      expect(mockAudioContext.createMediaElementSource).toHaveBeenCalledWith(mockAudioElement);
    });

    it('should handle removing audio element', () => {
      const { result } = renderHook(() => useAudioStore());
      const mockMediaElementSource = { disconnect: vi.fn() };
      
      // Set initial state
      act(() => {
        result.current.setAudioElement(mockAudioElement as any);
      });

      // Mock the media element source
      useAudioStore.setState({ mediaElementSource: mockMediaElementSource as any });

      act(() => {
        result.current.setAudioElement(null as any);
      });

      expect(result.current.audioElement).toBeNull();
      expect(mockMediaElementSource.disconnect).toHaveBeenCalled();
    });

    it('should handle setting same audio element', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setAudioElement(mockAudioElement as any);
      });

      const callCount = (window.AudioContext as any).mock.calls.length;

      act(() => {
        result.current.setAudioElement(mockAudioElement as any);
      });

      // Should not create new audio context
      expect((window.AudioContext as any).mock.calls.length).toBe(callCount);
    });
  });

  describe('State Updates', () => {
    it('should update current time', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current._updateCurrentTime(45);
      });

      expect(result.current.currentTime).toBe(45);
    });

    it('should update duration', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current._updateDuration(120);
      });

      expect(result.current.duration).toBe(120);
    });

    it('should update playing state', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current._setPlaying(true);
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('should update ready state', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current._setIsReady(true);
      });

      expect(result.current.isReady).toBe(true);
    });

    it('should set play intent', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setPlayIntent('test-intent');
      });

      expect(result.current.playIntentId).toBe('test-intent');
    });

    it('should set WaveSurfer instance', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setWaveSurferInstance(mockWaveSurfer as any);
      });

      expect(result.current.waveSurferInstance).toBe(mockWaveSurfer);
    });
  });

  describe('Seen Tracks Management', () => {
    it('should mark track as seen', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.markTrackAsSeen('track-1');
        result.current.markTrackAsSeen('track-2');
      });

      expect(result.current.seenTrackIds.has('track-1')).toBe(true);
      expect(result.current.seenTrackIds.has('track-2')).toBe(true);
      expect(result.current.seenTrackIds.size).toBe(2);
    });

    it('should not duplicate seen tracks', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.markTrackAsSeen('track-1');
        result.current.markTrackAsSeen('track-1');
      });

      expect(result.current.seenTrackIds.size).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle audio element play error', async () => {
      const mockErrorAudioElement = {
        ...mockAudioElement,
        play: vi.fn().mockRejectedValue(new Error('Play failed')),
      };

      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.loadTrack(mockTrack);
        result.current._setIsReady(true);
        result.current.setAudioElement(mockErrorAudioElement as any);
      });

      await act(async () => {
        result.current.play();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should handle pause when no audio element or wavesurfer', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });
}); 