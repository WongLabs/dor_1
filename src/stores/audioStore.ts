import { create } from 'zustand';
import WaveSurfer from 'wavesurfer.js';

export interface Track {
  id: string;
  title: string;
  artist: string;
  audioSrc: string; // URL to the audio file
  imageUrl?: string; // Optional image for the track
  // Add other relevant track properties if needed, e.g., duration from metadata
}

interface AudioState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  audioElement: HTMLAudioElement | null;
  waveSurferInstance: WaveSurfer | null;
  isReady: boolean;
  playIntentId: string | null;

  setAudioElement: (element: HTMLAudioElement) => void;
  setWaveSurferInstance: (wavesurfer: WaveSurfer) => void;
  loadTrack: (track: Track) => void;
  togglePlayPause: () => void;
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlayIntent: (intentId: string | null) => void;
  _updateCurrentTime: (time: number) => void;
  _updateDuration: (duration: number) => void;
  _setPlaying: (playing: boolean) => void;
  _setIsReady: (ready: boolean) => void;
}

const useAudioStore = create<AudioState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.75,
  audioElement: null,
  waveSurferInstance: null,
  isReady: false,
  playIntentId: null,

  setAudioElement: (element) => {
    console.log('[AudioStore] setAudioElement called. Element present:', !!element);
    set({ audioElement: element });
  },
  setWaveSurferInstance: (wavesurfer) => set({ waveSurferInstance: wavesurfer }),
  setPlayIntent: (intentId) => set({ playIntentId: intentId }),

  loadTrack: (track) => {
    console.log('[AudioStore] Setting current track:', track);
    set({ 
      currentTrack: track, 
      isPlaying: false, 
      currentTime: 0, 
      duration: 0, 
      isReady: false,
    });
  },

  togglePlayPause: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  play: () => {
    console.log('[AudioStore] play() called.');
    const { audioElement, waveSurferInstance, currentTrack, isReady } = get();

    if (!currentTrack || !isReady) {
      console.log('[AudioStore] play() aborted: no currentTrack or not ready.');
      return;
    }
    
    if (waveSurferInstance) {
      console.log('[AudioStore] Playing via WaveSurfer instance.');
      waveSurferInstance.play();
      set({ isPlaying: true }); 
    } else if (audioElement) {
      console.log('[AudioStore] Playing via HTMLAudioElement directly (WaveSurfer not present).');
      audioElement.play().then(() => {
        set({ isPlaying: true });
      }).catch(error => {
        console.error("[AudioStore] Error playing HTMLAudioElement directly:", error);
        set({ isPlaying: false }); 
      });
    } else {
      console.warn('[AudioStore] play() called, but no WaveSurfer or HTMLAudioElement found.');
    }
  },

  pause: () => {
    const { audioElement, waveSurferInstance } = get();
    if (waveSurferInstance) {
      waveSurferInstance.pause();
    } else if (audioElement) {
      audioElement.pause();
    }
    set({ isPlaying: false });
  },

  seekTo: (time) => {
    const { audioElement, waveSurferInstance, duration } = get();
    const newTime = Math.max(0, Math.min(time, duration));
    if (waveSurferInstance) {
      waveSurferInstance.seekTo(newTime / duration);
    }
    if (audioElement) {
      audioElement.currentTime = newTime;
    }
    set({ currentTime: newTime });
  },

  setVolume: (volume) => {
    const { audioElement, waveSurferInstance } = get();
    const newVolume = Math.max(0, Math.min(volume, 1));
    if (audioElement) {
      audioElement.volume = newVolume;
    }
    if (waveSurferInstance) {
      waveSurferInstance.setVolume(newVolume);
    }
    set({ volume: newVolume });
  },
  
  _updateCurrentTime: (time) => set({ currentTime: time }),
  _updateDuration: (duration) => set({ duration: duration }),
  _setPlaying: (playing) => set({ isPlaying: playing }),
  _setIsReady: (ready) => set({ isReady: ready }),
}));

export default useAudioStore; 