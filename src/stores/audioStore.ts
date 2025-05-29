import { create } from 'zustand';
import { persist, createJSONStorage, PersistStorage, StateStorage } from 'zustand/middleware';
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
  // Web Audio API related state
  audioContext: AudioContext | null;
  mediaElementSource: MediaElementAudioSourceNode | null;
  fxChainInput: GainNode | null;
  fxChainOutput: GainNode | null;

  seenTrackIds: Set<string>; // To store IDs of tracks that have been played/seen

  setAudioElement: (element: HTMLAudioElement) => void;
  setWaveSurferInstance: (wavesurfer: WaveSurfer | null) => void;
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
  markTrackAsSeen: (trackId: string) => void; // Action to mark a track as seen
}

// Define a type for the persisted part of the state
interface PersistedAudioState {
  seenTrackIds: string[]; // Stored as an array in localStorage
  volume: number;        // Persist volume setting
}

const useAudioStore = create(
  persist<AudioState, [], [], PersistedAudioState>(
    (set, get) => ({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.75,
      audioElement: null,
      waveSurferInstance: null,
      isReady: false,
      playIntentId: null,
      // Initialize Web Audio API state
      audioContext: null,
      mediaElementSource: null,
      fxChainInput: null,
      fxChainOutput: null,

      seenTrackIds: new Set<string>(), // Initialize seenTrackIds

      setAudioElement: (element) => {
        console.log('[AudioStore] setAudioElement called. Element present:', !!element);
        const currentAudioElement = get().audioElement;
        let { audioContext, mediaElementSource, fxChainInput, fxChainOutput } = get();

        if (element && element !== currentAudioElement) {
          if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            console.log('[AudioStore] AudioContext created.');

            fxChainInput = audioContext.createGain();
            fxChainOutput = audioContext.createGain();
            console.log('[AudioStore] FX Chain Input and Output GainNodes created.');

            fxChainInput.connect(fxChainOutput);
            fxChainOutput.connect(audioContext.destination);
            console.log('[AudioStore] FX Chain connected: fxChainInput -> fxChainOutput -> destination.');
          }

          if (mediaElementSource) {
            mediaElementSource.disconnect();
            console.log('[AudioStore] Disconnected previous MediaElementAudioSourceNode.');
          }
          
          if (audioContext && fxChainInput) {
            mediaElementSource = audioContext.createMediaElementSource(element);
            mediaElementSource.connect(fxChainInput);
            console.log('[AudioStore] Created and connected new MediaElementAudioSourceNode to fxChainInput.');
          } else {
            console.warn('[AudioStore] AudioContext or fxChainInput not available when trying to connect media element source.')
          }

          set({
            audioElement: element,
            audioContext,
            mediaElementSource,
            fxChainInput,
            fxChainOutput,
          });
        } else if (!element && mediaElementSource) {
          mediaElementSource.disconnect();
          console.log('[AudioStore] Audio element removed, disconnected MediaElementAudioSourceNode.');
          set({ 
            audioElement: null, 
            mediaElementSource: null 
            // Keep context and FX chain nodes for potential reuse or decide on cleanup strategy
          });
        } else if (element === currentAudioElement) {
          console.log('[AudioStore] setAudioElement called with the same element, no audio graph changes.');
        } else {
            set({ audioElement: element }); // Handles case where element is null and was already null
        }
      },
      setWaveSurferInstance: (wavesurfer) => set({ waveSurferInstance: wavesurfer }),
      setPlayIntent: (intentId) => set({ playIntentId: intentId }),

      loadTrack: (track) => {
        console.log('[AudioStore] Setting current track:', track);
        console.log('[AudioStore] Previous track was:', get().currentTrack?.id || 'none');
        const playIntent = get().playIntentId; // Check if there was a play intent before resetting
        set({ 
          currentTrack: track, 
          isPlaying: false, 
          currentTime: 0, 
          duration: 0, 
          isReady: false,
          playIntentId: null, // Clear any existing play intent
        });
        if (playIntent) { // If there was a play intent, mark as seen
          get().markTrackAsSeen(track.id);
        }
        console.log('[AudioStore] Track loaded. State reset.');
      },

      togglePlayPause: () => {
        const { isPlaying, currentTrack } = get();
        console.log('[AudioStore] togglePlayPause called. Current track:', currentTrack?.id, 'isPlaying:', isPlaying);
        if (isPlaying) {
          get().pause();
        } else {
          get().play();
        }
      },

      play: () => {
        console.log('[AudioStore] play() called.');
        const { audioElement, waveSurferInstance, currentTrack, isReady } = get();

        if (!currentTrack) {
          console.log('[AudioStore] play() aborted: no currentTrack.');
          return;
        }
        
        if (!isReady) {
          console.log('[AudioStore] play() aborted: not ready.');
          return;
        }
        
        if (waveSurferInstance) {
          console.log('[AudioStore] Playing via WaveSurfer instance.');
          waveSurferInstance.play();
          set({ isPlaying: true }); 
          if (currentTrack) get().markTrackAsSeen(currentTrack.id); // Mark as seen
        } else if (audioElement) {
          console.log('[AudioStore] Playing via HTMLAudioElement directly (WaveSurfer not present).');
          audioElement.play().then(() => {
            set({ isPlaying: true });
            if (currentTrack) get().markTrackAsSeen(currentTrack.id); // Mark as seen
          }).catch(error => {
            console.error("[AudioStore] Error playing HTMLAudioElement directly:", error);
            set({ isPlaying: false }); 
          });
        } else {
          console.warn('[AudioStore] play() called, but no WaveSurfer or HTMLAudioElement found.');
        }
      },

      pause: () => {
        console.log('[AudioStore] pause() called.');
        const { audioElement, waveSurferInstance } = get();
        
        if (waveSurferInstance) {
          console.log('[AudioStore] Pausing via WaveSurfer instance.');
          waveSurferInstance.pause();
          set({ isPlaying: false });
        } else if (audioElement) {
          console.log('[AudioStore] Pausing via HTMLAudioElement directly.');
          audioElement.pause();
          set({ isPlaying: false });
        } else {
          console.warn('[AudioStore] pause() called, but no WaveSurfer or HTMLAudioElement found.');
          set({ isPlaying: false });
        }
      },

      seekTo: (time) => {
        const { audioElement, waveSurferInstance, duration } = get();
        const newTime = Math.max(0, Math.min(time, duration || 0)); // Ensure duration is not NaN

        console.log(`[AudioStore] seekTo called. Requested time: ${time}, Clamped newTime: ${newTime}, Duration: ${duration}`);

        if (waveSurferInstance && duration > 0) {
          const progress = newTime / duration;
          console.log(`[AudioStore] Seeking AudioPlayer's WaveSurfer to progress: ${progress} (time: ${newTime})`);
          waveSurferInstance.seekTo(progress);
          // WaveSurfer will update the HTMLAudioElement's currentTime, which should then
          // trigger a timeupdate event, updating the store via _updateCurrentTime.
        } else if (audioElement) {
          // Fallback if no WaveSurfer instance or duration is 0
          console.log(`[AudioStore] Fallback: Setting audioElement.currentTime to: ${newTime}`);
          audioElement.currentTime = newTime;
        }
        // Set the store's current time immediately for responsiveness of UI elements bound to it.
        // The timeupdate event from the audio element/WaveSurfer will provide subsequent updates.
        set({ currentTime: newTime }); 
        console.log(`[AudioStore] currentTime set to: ${newTime} in store.`);
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

      markTrackAsSeen: (trackId) => {
        console.log(`[AudioStore] Marking track ${trackId} as seen.`);
        set((state) => ({
          seenTrackIds: new Set(state.seenTrackIds).add(trackId),
        }));
      },
    }),
    {
      name: 'audio-storage', // Name for the localStorage key
      storage: createJSONStorage(() => localStorage) as PersistStorage<PersistedAudioState>,
      partialize: (state): PersistedAudioState => ({
        // Only persist seenTrackIds (as an array) and volume
        seenTrackIds: Array.from(state.seenTrackIds),
        volume: state.volume,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          // Convert the array from localStorage back to a Set for seenTrackIds
          state.seenTrackIds = new Set(state.seenTrackIds as unknown as string[]);
          // Volume is already in the correct type, no specific rehydration needed for it here,
          // but ensure it is part of the initial state or handled if undefined.
        }
        if (error) {
          console.error("[AudioStore] Failed to rehydrate from localStorage:", error);
        }
      },
    }
  )
);

export default useAudioStore; 