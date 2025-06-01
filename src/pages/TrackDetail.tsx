import { useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import WaveformVisualizer from '../components/WaveformVisualizer';
import { CurrentTrackContext } from '../contexts/CurrentTrackContext';
import { hotCueService } from '../services/hotCueService';
import { type PackTrack } from './FilteredMood';
import useAudioStore, { type Track as AudioStoreTrack } from '../stores/audioStore';
import { getTracksData } from '../utils/trackUtils';
import { generateWaveformData, drawWaveform } from '../utils/audioUtils';

// Define Icons directly in the file if not using a central Icon component file
const PlayIcon = ({ size = 24, fill = "currentColor" }: { size?: number, fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = ({ size = 24, fill = "currentColor" }: { size?: number, fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
);

const MinusIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 12h14" />
  </svg>
);

const PlusIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

const AddIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

const ChevronDownIcon = ({ size = 20, fill = "currentColor" }: { size?: number, fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const ChevronUpIcon = ({ size = 20, fill = "currentColor" }: { size?: number, fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

// Types
interface StemTrack {
  name: string;
  waveform: string;
  color: string;
  audioUrl: string;
  iconType: 'bass' | 'drums' | 'synth' | 'vocals'; // To determine which icon to show
}

interface MoodCluster {
  name: string;
  moods: string[];
}

interface MoodProbability {
  label: string;
  value: number;
  color: string;
}

interface HotCue {
  label: string;
  time: number; // Time in seconds
  color?: string; // Optional color from hotCueData
}

export interface TrackDetail {
  id: string;
  title: string;
  artist: string;
  remixer?: string;
  bpm: number;
  key: string;
  genre: string;
  subgenre?: string;
  releaseDate: string;
  trackLength: string;
  recordLabel?: string;
  waveform: string;
  audioUrl: string;
  stems: StemTrack[];
  moodClusters: MoodCluster[];
  moodProbabilities: MoodProbability[];
  danceability: number;
  voiceInstrumentalRatio: number;
  energyLevel?: number;
  fileType?: string;
  imageUrl?: string; // From PackTrack
  hotCues?: HotCue[];
}

interface RelatedTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  genre: string;
  mood: string;
  releaseDate: string;
}

// Utility function to convert standard key to Camelot Key
const convertToCamelot = (key: string): string => {
  const mapping: { [standardKey: string]: string } = {
    'A': '11B', 'Am': '8A',
    'A#': '6B', 'A#m': '3A', 'Bb': '6B', 'Bbm': '3A',
    'B': '1B', 'Bm': '10A',
    'C': '8B', 'Cm': '5A',
    'C#': '3B', 'C#m': '12A', 'Db': '3B', 'Dbm': '12A',
    'D': '10B', 'Dm': '7A',
    'D#': '5B', 'D#m': '2A', 'Eb': '5B', 'Ebm': '2A',
    'E': '12B', 'Em': '9A',
    'F': '7B', 'Fm': '4A',
    'F#': '2B', 'F#m': '11A', 'Gb': '2B', 'Gbm': '11A',
    'G': '9B', 'Gm': '6A',
    'G#': '4B', 'G#m': '1A', 'Ab': '4B', 'Abm': '1A',
  };
  return mapping[key] || key; // Return original if not found
};

// Utility function to parse track length (e.g., "3:45") to seconds
const parseTrackLengthToSeconds = (trackLength: string | undefined): number => {
  if (!trackLength || typeof trackLength !== 'string') return 0;
  const parts = trackLength.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      return minutes * 60 + seconds;
    }
  }
  console.warn(`Could not parse trackLength: ${trackLength}`);
  return 0;
};

const CUE_LABEL_COLORS: { [label: string]: string } = {
  'A': '#9254DE', // Purple
  'B': '#52C41A', // Green
  'C': '#FA8C16', // Orange
  'D': '#1890FF', // Blue
  'E': '#FF4D4F', // Red
  'F': '#722ED1', // Dark Purple
  'G': '#A0D911', // Lime Green
  'H': '#08979C'  // Teal
};

// Add this helper function at the top of the file, before the TrackDetail component
const getVocalStemPath = (trackTitle: string): string => {
  const baseName = trackTitle.replace(/\.(mp3|wav)$/i, '');
  const vocalPath = `/audio/vocals/${baseName}_vocals_compressed.wav`; // Added _compressed
  console.log('[Vocals] Constructed vocal path:', vocalPath);
  return vocalPath;
};

// Helper function to map PackTrack to TrackDetail (can be moved to a utils file)
const mapPackTrackToTrackDetail = (packTrack: PackTrack): TrackDetail => {
  const trackFilename = packTrack.audioSrc?.split('/').pop() || packTrack.title;
  const vocalsPath = getVocalStemPath(trackFilename);
  console.log('[TrackDetail] Mapping vocals path:', vocalsPath);

  const stems: StemTrack[] = [
    {
      name: 'Vocals',
      waveform: '', // This will be generated dynamically
      color: '#FF69B4', // Pink color for vocals
      audioUrl: vocalsPath,
      iconType: 'vocals'
    }
  ];

  let cuesForTrack: HotCue[] = [];
  if (trackFilename) {
    const rawCues = hotCueService.getHotCues(trackFilename);
    if (rawCues && rawCues.length > 0) {
      console.log(`[TrackDetail] Found cues for ${trackFilename}:`, JSON.parse(JSON.stringify(rawCues)));
      cuesForTrack = rawCues.map((cue: any) => ({ ...cue }));
    } else {
      console.log(`[TrackDetail] No cues found for filename: ${trackFilename}`);
    }
  }

  return {
    id: packTrack.id,
    title: packTrack.title,
    artist: packTrack.artist,
    bpm: packTrack.bpm,
    key: packTrack.key,
    genre: packTrack.genre,
    releaseDate: packTrack.releaseDate,
    trackLength: packTrack.duration,
    audioUrl: packTrack.audioSrc,
    waveform: `/waveforms/${packTrack.id}.json`,
    imageUrl: packTrack.imageUrl,
    remixer: undefined,
    subgenre: undefined,
    recordLabel: undefined,
    stems,
    moodClusters: [],
    moodProbabilities: [],
    danceability: 0.7,
    voiceInstrumentalRatio: 0.5,
    energyLevel: 3,
    fileType: packTrack.downloadUrls?.wav ? 'WAV' : 'MP3',
    hotCues: cuesForTrack,
  };
};

// Add this function near the other utility functions
const checkVocalFileExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('[Vocals] Error checking vocal file:', error);
    return false;
  }
};

const TrackDetail = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const context = useContext(CurrentTrackContext);

  // Audio Store integration
  const {
    loadTrack: loadTrackInPlayer,
    currentTrack: playerTrack,
    isPlaying: isPlayerPlaying,
    togglePlayPause: togglePlayerPlayPause,
    setPlayIntent,
    currentTime: playerCurrentTime,
    duration: playerDuration,
    seekTo: seekPlayerTo,
    // --- Destructure actual Web Audio API nodes from the store ---
    audioContext, 
    fxChainInput, 
    fxChainOutput,
  } = useAudioStore();

  if (!context) {
    throw new Error('TrackDetail must be used within a CurrentTrackProvider');
  }

  const { currentTrack: contextTrack, setCurrentTrack } = context;
  
  const [track, setTrack] = useState<TrackDetail | null>(null);
  const [relatedTracks, /* setRelatedTracks */] = useState<RelatedTrack[]>([]); // TS6133: 'setRelatedTracks' is declared but its value is never read.
  const [localSeekTime, setLocalSeekTime] = useState<number | null>(null); // For local seeking before play
  const [draggedCue, setDraggedCue] = useState<string | null>(null); // For drag-and-drop functionality

  // Beat FX State
  const [activeBeatFX, setActiveBeatFX] = useState<string | null>(null); // e.g., 'FILTER', 'FLANGER', etc.
  const [activeFXFrequencyBand, setActiveFXFrequencyBand] = useState<('LOW' | 'MID' | 'HI' | null)>(null);
  const [isBeatFxMinimized, setIsBeatFxMinimized] = useState(true); // State for minimizing FX section

  // BEAT Section State Management
  const [isAutoBpmEnabled, setIsAutoBpmEnabled] = useState<boolean>(true);
  const [isQuantizeEnabled, setIsQuantizeEnabled] = useState<boolean>(false);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [manualBpm, setManualBpm] = useState<number | null>(null);
  const [trackBpmOverrides, setTrackBpmOverrides] = useState<Record<string, number>>({}); // Ensure this line is present and not commented

  // X-PAD Beat Division State
  const [selectedBeatDivision, setSelectedBeatDivision] = useState<'1/16' | '1/8' | '1/4' | '1/2' | '3/4' | '1' | '2' | '4'>('1');
  const beatDivisions = ['1/16', '1/8', '1/4', '1/2', '3/4', '1', '2', '4'] as const;

  const biquadFilterNodeRef = useRef<BiquadFilterNode | null>(null);

  // Refs for Flanger FX
  const flangerDelayNodeRef = useRef<DelayNode | null>(null);
  const flangerLFORef = useRef<OscillatorNode | null>(null);
  const flangerLFOModGainRef = useRef<GainNode | null>(null);
  const flangerFeedbackRef = useRef<GainNode | null>(null);
  const flangerWetGainRef = useRef<GainNode | null>(null);
  const flangerDryGainRef = useRef<GainNode | null>(null);

  // Refs for Phaser FX
  const PHASER_STAGES = 6; // Number of all-pass filter stages
  const phaserAllPassFilterRefs = useRef<(BiquadFilterNode | null)[]>(new Array(PHASER_STAGES).fill(null));
  const phaserLFORef = useRef<OscillatorNode | null>(null);
  const phaserLFOModGainRef = useRef<GainNode | null>(null);
  const phaserFeedbackGainRef = useRef<GainNode | null>(null);
  const phaserDryGainRef = useRef<GainNode | null>(null);
  const phaserWetGainRef = useRef<GainNode | null>(null);

  // Refs for Algorithmic Reverb FX
  const reverbDelayNodesRef = useRef<(DelayNode | null)[]>([]);
  const reverbFeedbackGainsRef = useRef<(GainNode | null)[]>([]);
  const reverbWetGainRef = useRef<GainNode | null>(null);
  const reverbDryGainRef = useRef<GainNode | null>(null);
  const NUM_REVERB_DELAYS = 4; // Number of delay lines

  // Refs for Ping Pong Delay FX
  const pingPongDelayLRef = useRef<DelayNode | null>(null);
  const pingPongDelayRRef = useRef<DelayNode | null>(null);
  const pingPongFeedbackLRef = useRef<GainNode | null>(null);
  const pingPongFeedbackRRef = useRef<GainNode | null>(null);
  const pingPongPannerLRef = useRef<StereoPannerNode | null>(null);
  const pingPongPannerRRef = useRef<StereoPannerNode | null>(null);
  const pingPongWetGainRef = useRef<GainNode | null>(null);
  const pingPongDryGainRef = useRef<GainNode | null>(null);

  // Refs for Echo FX
  const echoDelayNodeRef = useRef<DelayNode | null>(null);
  const echoFeedbackGainRef = useRef<GainNode | null>(null);
  const echoWetGainRef = useRef<GainNode | null>(null);
  const echoDryGainRef = useRef<GainNode | null>(null);

  // Refs for Roll FX
  const rollDelayNodeRef = useRef<DelayNode | null>(null);
  const rollFeedbackGainRef = useRef<GainNode | null>(null);
  const rollFilterNodeRef = useRef<BiquadFilterNode | null>(null);
  const rollWetGainRef = useRef<GainNode | null>(null);
  const rollDryGainRef = useRef<GainNode | null>(null);

  // Refs for Vinyl Brake FX
  const originalPlaybackRateRef = useRef<number>(1.0);
  const vinylBrakeRampIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for Helix FX (added in previous step, ensure this is present)
  const helixDelayNodeRef = useRef<DelayNode | null>(null);
  const helixFeedbackGainRef = useRef<GainNode | null>(null);
  const helixLFORef = useRef<OscillatorNode | null>(null);
  const helixLFODepthGainRef = useRef<GainNode | null>(null);
  const helixWetGainRef = useRef<GainNode | null>(null);
  const helixDryGainRef = useRef<GainNode | null>(null);

  // Refs for Bubble FX
  const bubbleDelayNodeRef = useRef<DelayNode | null>(null);
  const bubbleFeedbackGainRef = useRef<GainNode | null>(null);
  const bubblePitchLFORef = useRef<OscillatorNode | null>(null);
  const bubblePitchLFODepthGainRef = useRef<GainNode | null>(null);
  const bubblePanLFORef = useRef<OscillatorNode | null>(null);
  const bubblePanLFODepthGainRef = useRef<GainNode | null>(null);
  const bubblePannerNodeRef = useRef<StereoPannerNode | null>(null);
  const bubbleWetGainRef = useRef<GainNode | null>(null);
  const bubbleDryGainRef = useRef<GainNode | null>(null);

  // Refs for Delay FX
  const delayDelayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackGainRef = useRef<GainNode | null>(null);
  const delayWetGainRef = useRef<GainNode | null>(null);
  const delayDryGainRef = useRef<GainNode | null>(null);

  // Calculate current BPM to use
  const currentBpm = useMemo(() => {
    if (!track) return 120;
    
    // If we have a per-track override, use that
    if (trackBpmOverrides[track.id]) {
      return trackBpmOverrides[track.id];
    }
    
    // If manual mode and we have a tapped BPM, use that
    if (!isAutoBpmEnabled && manualBpm) {
      return manualBpm;
    }
    
    // Otherwise use the track's original BPM
    return track.bpm;
  }, [track, trackBpmOverrides, isAutoBpmEnabled, manualBpm]);

  // Tap Tempo Function
  const handleTapTempo = useCallback(() => {
    const now = performance.now();
    
    setTapTimes(prevTapTimes => {
      const newTapTimes = [...prevTapTimes, now];
      
      // Remove taps older than 2 seconds
      const recentTaps = newTapTimes.filter(tapTime => now - tapTime <= 2000);
      
      if (recentTaps.length >= 3) {
        // Calculate intervals between consecutive taps
        const intervals = [];
        for (let i = 1; i < recentTaps.length; i++) {
          intervals.push(recentTaps[i] - recentTaps[i - 1]);
        }
        
        // Calculate average interval and convert to BPM
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / avgInterval); // 60000ms = 1 minute
        
        setManualBpm(calculatedBpm);
      }
      
      return recentTaps;
    });
  }, []);

  // Calculate beat duration based on selected division and current BPM
  const calculateBeatDuration = useCallback((division: typeof selectedBeatDivision, bpm: number) => {
    const secondsPerBeat = 60 / bpm;
    
    switch (division) {
      case '1/16': return secondsPerBeat / 4;
      case '1/8': return secondsPerBeat / 2;
      case '1/4': return secondsPerBeat;      // 1/4 note = 1 beat
      case '1/2': return secondsPerBeat * 2;  // 1/2 note = 2 beats
      case '3/4': return secondsPerBeat * 3;  // 3/4 (e.g. dotted half) = 3 beats
      case '1': return secondsPerBeat * 1;    // X-PAD '1' = 1 beat
      case '2': return secondsPerBeat * 2;    // X-PAD '2' = 2 beats
      case '4': return secondsPerBeat * 4;    // X-PAD '4' = 4 beats
      default:
        // Fallback for any unexpected division, though typed state should prevent this.
        console.warn(`[X-PAD] Unexpected beat division: ${division}, defaulting to 1 beat.`);
        return secondsPerBeat; 
    }
  }, []);

  // Beat division navigation functions
  const shiftBeatDivision = useCallback((direction: 'left' | 'right') => {
    const currentIndex = beatDivisions.indexOf(selectedBeatDivision);
    let newIndex;
    
    if (direction === 'left') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : beatDivisions.length - 1; // Wrap to end
    } else {
      newIndex = currentIndex < beatDivisions.length - 1 ? currentIndex + 1 : 0; // Wrap to start
    }
    
    const newDivision = beatDivisions[newIndex];
    setSelectedBeatDivision(newDivision);
    console.log(`[X-PAD] Beat division changed to: ${newDivision} (duration: ${calculateBeatDuration(newDivision, currentBpm).toFixed(3)}s at ${currentBpm} BPM)`);
  }, [selectedBeatDivision, calculateBeatDuration, currentBpm]);

  // BPM adjustment function
  const adjustBpm = useCallback((delta: number) => {
    if (!track) return;
    
    const newBpm = Math.max(60, Math.min(200, currentBpm + delta));
    setTrackBpmOverrides(prev => ({
      ...prev,
      [track.id]: newBpm
    }));
    console.log(`[BPM ADJUST] Set BPM for track ${track.id} to ${newBpm}`);
  }, [track, currentBpm]);

  // Toggle AUTO/TAP mode
  const toggleAutoBpm = useCallback(() => {
    setIsAutoBpmEnabled(prev => {
      const newMode = !prev;
      if (newMode) {
        // Reset tap data when switching to AUTO
        setTapTimes([]);
        setManualBpm(null);
      }
      return newMode;
    });
  }, []);

  // Toggle Quantize
  const toggleQuantize = useCallback(() => {
    setIsQuantizeEnabled(prev => {
      const newState = !prev;
      console.log(`[QUANTIZE] ${newState ? 'Enabled' : 'Disabled'} quantization`);
      return newState;
    });
  }, []);

  // Effect to find and set the current track based on trackId or context
  useEffect(() => {
    let definitivePackTrack: PackTrack | undefined = undefined;
    let sourceOfTruthId: string | undefined = trackId;

    if (!sourceOfTruthId && contextTrack?.id) {
      sourceOfTruthId = contextTrack.id;
    }

    const actualTracksArray = getTracksData(); // Use the new utility function

    if (actualTracksArray && Array.isArray(actualTracksArray) && sourceOfTruthId) {
      const foundTrack = actualTracksArray.find((t: PackTrack) => t && t.id === sourceOfTruthId);
      if (foundTrack) {
        definitivePackTrack = foundTrack as PackTrack;
      }
    } else {
    }

    if (definitivePackTrack) {
      const detailedTrack = mapPackTrackToTrackDetail(definitivePackTrack);
      setTrack(detailedTrack);
      if (contextTrack?.id !== detailedTrack.id) {
        setCurrentTrack(detailedTrack as any); 
      }
      if (!playerTrack || playerTrack?.id !== detailedTrack.id) {
        // Create proper track object for audio store with audioSrc instead of audioUrl
        const trackForAudioStore: AudioStoreTrack = {
          id: detailedTrack.id,
          title: detailedTrack.title,
          artist: detailedTrack.artist,
          audioSrc: detailedTrack.audioUrl, // Convert audioUrl to audioSrc
          imageUrl: detailedTrack.imageUrl || undefined,
        };
        console.log(`[TrackDetail] Loading track into player:`, trackForAudioStore);
        console.log(`[TrackDetail] trackForAudioStore.audioSrc:`, trackForAudioStore.audioSrc);
        loadTrackInPlayer(trackForAudioStore);
      }
    } else {
      console.error(`Track with ID ${sourceOfTruthId} not found.`); // Corrected message
      setTrack(null);
    }
  }, [trackId, contextTrack?.id]); // Removed playerTrack from dependencies

  // Effect to update document title
  useEffect(() => {
    document.title = `Track Detail - ${track?.title || 'Loading...'}`;
  }, [track]);


  // Effect to manage Beat FX
  useEffect(() => {
    const audioElement = useAudioStore.getState().audioElement; // Get current audioElement

    // --- Universal Teardown/Restoration for VINYL BRAKE --- 
    // This should run before any new effect is set up, or if dependencies change triggering cleanup.
    if (vinylBrakeRampIntervalRef.current) {
      clearInterval(vinylBrakeRampIntervalRef.current);
      vinylBrakeRampIntervalRef.current = null;
      console.log('[BeatFX] Cleared active Vinyl Brake ramp interval.');
    }
    // Restore playback rate if it was altered by vinyl brake and the effect is no longer active
    // or if the component is cleaning up.
    if (audioElement && audioElement.playbackRate !== originalPlaybackRateRef.current && activeBeatFX !== 'VINYL BRAKE') {
      console.log(`[BeatFX] VINYL BRAKE Teardown: Restoring playbackRate to ${originalPlaybackRateRef.current} from ${audioElement.playbackRate}`);
      audioElement.playbackRate = originalPlaybackRateRef.current;
    }

    if (!audioContext || !playerTrack || !fxChainInput || !fxChainOutput) {
      // Ensure previous effects are disconnected if context/nodes disappear
      // Filter
      if (biquadFilterNodeRef.current) try { biquadFilterNodeRef.current.disconnect(); } catch(e) {/*-*/}
      // Flanger
      if (flangerLFORef.current) try { flangerLFORef.current.stop(); flangerLFORef.current.disconnect(); } catch(e) {/*-*/}
      if (flangerLFOModGainRef.current) try { flangerLFOModGainRef.current.disconnect(); } catch(e) {/*-*/}
      if (flangerDelayNodeRef.current) try { flangerDelayNodeRef.current.disconnect(); } catch(e) {/*-*/}
      if (flangerFeedbackRef.current) try { flangerFeedbackRef.current.disconnect(); } catch(e) {/*-*/}
      if (flangerWetGainRef.current) try { flangerWetGainRef.current.disconnect(); } catch(e) {/*-*/}
      if (flangerDryGainRef.current) try { flangerDryGainRef.current.disconnect(); } catch(e) {/*-*/}
      // Phaser
      if (phaserLFORef.current) try { phaserLFORef.current.stop(); phaserLFORef.current.disconnect(); } catch(e) {/*-*/}
      if (phaserLFOModGainRef.current) try { phaserLFOModGainRef.current.disconnect(); } catch(e) {/*-*/}
      phaserAllPassFilterRefs.current.forEach(filterNode => { if (filterNode) try { filterNode.disconnect(); } catch (e) {/*-*/}
      });
      if (phaserFeedbackGainRef.current) try { phaserFeedbackGainRef.current.disconnect(); } catch (e) {/*-*/}
      if (phaserDryGainRef.current) try { phaserDryGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Phaser DryGain.'); } catch (e) {/*-*/}
      if (phaserWetGainRef.current) try { phaserWetGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Phaser WetGain.'); } catch (e) {/*-*/}
      // Algorithmic Reverb (New)
      reverbDelayNodesRef.current.forEach(node => { if (node) try { node.disconnect(); } catch(e){/*-*/}}); 
      reverbFeedbackGainsRef.current.forEach(node => { if (node) try { node.disconnect(); } catch(e){/*-*/}}); 
      if (reverbWetGainRef.current) try { reverbWetGainRef.current.disconnect(); } catch(e) {/*-*/}
      if (reverbDryGainRef.current) try { reverbDryGainRef.current.disconnect(); } catch(e) {/*-*/}
      
      if (fxChainInput && fxChainOutput) {
        try {
          fxChainInput.disconnect(); 
          fxChainInput.connect(fxChainOutput);
          console.log('[BeatFX] Ensured bypass due to missing audio components.');
        } catch (e) { console.warn('[BeatFX] Error ensuring bypass (audio components missing):', e); }
      }
      return;
    }

    // 1. --- Teardown previous effect --- 
    console.log('[BeatFX] Cleaning up previous effect before setting new one or bypass.');
    try { fxChainInput.disconnect(); } catch (e) { /*Ignore if not connected*/ }
    // Filter
    if (biquadFilterNodeRef.current) { 
        try { biquadFilterNodeRef.current.disconnect(); console.log('[BeatFX] Disconnected FilterNode.'); } catch (e) {/*-*/}
    }
    // Flanger
    if (flangerLFORef.current) { 
        try { flangerLFORef.current.stop(); console.log('[BeatFX] Stopped Flanger LFO.'); } catch (e) {/*-*/}
        try { flangerLFORef.current.disconnect(); } catch (e) {/*-*/}
        flangerLFORef.current = null; 
    }
    if (flangerLFOModGainRef.current) try { flangerLFOModGainRef.current.disconnect(); } catch (e) {/*-*/}
    if (flangerDelayNodeRef.current) try { flangerDelayNodeRef.current.disconnect(); } catch (e) {/*-*/}
    if (flangerFeedbackRef.current) try { flangerFeedbackRef.current.disconnect(); } catch (e) {/*-*/}
    if (flangerWetGainRef.current) try { flangerWetGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Flanger WetGain.');} catch (e) {/*-*/}
    if (flangerDryGainRef.current) try { flangerDryGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Flanger DryGain.');} catch (e) {/*-*/}
    // Phaser
    if (phaserLFORef.current) {
        try { phaserLFORef.current.stop(); console.log('[BeatFX] Stopped Phaser LFO.'); } catch (e) {/*-*/}
        try { phaserLFORef.current.disconnect(); } catch (e) {/*-*/}
        phaserLFORef.current = null; 
    }
    if (phaserLFOModGainRef.current) try { phaserLFOModGainRef.current.disconnect(); } catch (e) {/*-*/}
    phaserAllPassFilterRefs.current.forEach(filterNode => {
        if (filterNode) try { filterNode.disconnect(); } catch (e) {/*-*/}
    });
    if (phaserFeedbackGainRef.current) try { phaserFeedbackGainRef.current.disconnect(); } catch (e) {/*-*/}
    if (phaserDryGainRef.current) try { phaserDryGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Phaser DryGain.'); } catch (e) {/*-*/}
    if (phaserWetGainRef.current) try { phaserWetGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Phaser WetGain.'); } catch (e) {/*-*/}
    // Algorithmic Reverb (New)
    reverbDelayNodesRef.current.forEach(node => { if (node) try { node.disconnect(); } catch(e){/*-*/}}); 
    reverbFeedbackGainsRef.current.forEach(node => { if (node) try { node.disconnect(); } catch(e){/*-*/}}); 
    if (reverbWetGainRef.current) try { reverbWetGainRef.current.disconnect(); console.log('[BeatFX] Disconnected AlgoReverb WetGain.'); } catch (e) {/*-*/}
    if (reverbDryGainRef.current) try { reverbDryGainRef.current.disconnect(); console.log('[BeatFX] Disconnected AlgoReverb DryGain.'); } catch (e) {/*-*/}
    
    // Ping Pong Teardown
    if (pingPongDelayLRef.current) try { pingPongDelayLRef.current.disconnect(); } catch(e){/*-*/}
    if (pingPongDelayRRef.current) try { pingPongDelayRRef.current.disconnect(); } catch(e){/*-*/}
    if (pingPongFeedbackLRef.current) try { pingPongFeedbackLRef.current.disconnect(); } catch(e){/*-*/}
    if (pingPongFeedbackRRef.current) try { pingPongFeedbackRRef.current.disconnect(); } catch(e){/*-*/}
    if (pingPongPannerLRef.current) try { pingPongPannerLRef.current.disconnect(); } catch(e){/*-*/}
    if (pingPongPannerRRef.current) try { pingPongPannerRRef.current.disconnect(); } catch(e){/*-*/}
    if (pingPongWetGainRef.current) try { pingPongWetGainRef.current.disconnect(); console.log('[BeatFX] Disconnected PingPong WetGain.'); } catch(e){/*-*/}
    if (pingPongDryGainRef.current) try { pingPongDryGainRef.current.disconnect(); console.log('[BeatFX] Disconnected PingPong DryGain.'); } catch(e){/*-*/}

    // Echo Teardown
    if (echoDelayNodeRef.current) try { echoDelayNodeRef.current.disconnect(); } catch(e){/*-*/}
    if (echoFeedbackGainRef.current) try { echoFeedbackGainRef.current.disconnect(); } catch(e){/*-*/}
    if (echoWetGainRef.current) try { echoWetGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Echo WetGain.'); } catch(e){/*-*/}
    if (echoDryGainRef.current) try { echoDryGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Echo DryGain.'); } catch(e){/*-*/}

    // Roll Teardown
    if (rollDelayNodeRef.current) try { rollDelayNodeRef.current.disconnect(); } catch(e){/*-*/}
    if (rollFeedbackGainRef.current) try { rollFeedbackGainRef.current.disconnect(); } catch(e){/*-*/}
    if (rollFilterNodeRef.current) try { rollFilterNodeRef.current.disconnect(); } catch(e){/*-*/}
    if (rollWetGainRef.current) try { rollWetGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Roll WetGain.'); } catch(e){/*-*/}
    if (rollDryGainRef.current) try { rollDryGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Roll DryGain.'); } catch(e){/*-*/}

    // Helix Teardown
    if (helixLFORef.current) { try { helixLFORef.current.stop(); console.log('[BeatFX] Stopped Helix LFO.'); } catch (e) {/*-*/ } try { helixLFORef.current.disconnect(); } catch (e) {/*-*/ } helixLFORef.current = null; }
    if (helixLFODepthGainRef.current) try { helixLFODepthGainRef.current.disconnect(); } catch (e) {/*-*/}
    if (helixDelayNodeRef.current) try { helixDelayNodeRef.current.disconnect(); } catch (e) {/*-*/}
    if (helixFeedbackGainRef.current) try { helixFeedbackGainRef.current.disconnect(); } catch (e) {/*-*/}
    if (helixWetGainRef.current) try { helixWetGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Helix WetGain.');} catch (e) {/*-*/}
    if (helixDryGainRef.current) try { helixDryGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Helix DryGain.');} catch (e) {/*-*/}
    
    // Bubble Teardown
    if (bubblePitchLFORef.current) { try { bubblePitchLFORef.current.stop(); console.log('[BeatFX] Stopped Bubble Pitch LFO.'); } catch (e) {/*-*/ } try { bubblePitchLFORef.current.disconnect(); } catch (e) {/*-*/ } bubblePitchLFORef.current = null; }
    if (bubblePanLFORef.current) { try { bubblePanLFORef.current.stop(); console.log('[BeatFX] Stopped Bubble Pan LFO.'); } catch (e) {/*-*/ } try { bubblePanLFORef.current.disconnect(); } catch (e) {/*-*/ } bubblePanLFORef.current = null; }
    if (bubblePitchLFODepthGainRef.current) try { bubblePitchLFODepthGainRef.current.disconnect(); } catch (e) {/*-*/}
    if (bubblePanLFODepthGainRef.current) try { bubblePanLFODepthGainRef.current.disconnect(); } catch (e) {/*-*/}
    if (bubbleDelayNodeRef.current) try { bubbleDelayNodeRef.current.disconnect(); } catch (e) {/*-*/}
    if (bubbleFeedbackGainRef.current) try { bubbleFeedbackGainRef.current.disconnect(); } catch (e) {/*-*/}
    if (bubblePannerNodeRef.current) try { bubblePannerNodeRef.current.disconnect(); } catch (e) {/*-*/}
    if (bubbleWetGainRef.current) try { bubbleWetGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Bubble WetGain.'); } catch (e) {/*-*/}
    if (bubbleDryGainRef.current) try { bubbleDryGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Bubble DryGain.'); } catch (e) {/*-*/}

    // Delay Teardown
    if (delayDelayNodeRef.current) try { delayDelayNodeRef.current.disconnect(); } catch(e){/*-*/}
    if (delayFeedbackGainRef.current) try { delayFeedbackGainRef.current.disconnect(); } catch(e){/*-*/}
    if (delayWetGainRef.current) try { delayWetGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Delay WetGain.'); } catch(e){/*-*/}
    if (delayDryGainRef.current) try { delayDryGainRef.current.disconnect(); console.log('[BeatFX] Disconnected Delay DryGain.'); } catch(e){/*-*/}

    // 2. --- Setup new effect or bypass --- 
    if (activeBeatFX === 'FILTER') {
      if (!activeFXFrequencyBand) { // FILTER selected but no band -> BYPASS
        console.log('[BeatFX] FILTER selected but no band. Setting bypass.');
        try { fxChainInput.connect(fxChainOutput); } catch (e) { console.error('[BeatFX] Error connecting bypass for FILTER no band:', e);}
      } else {
        let filterNode = biquadFilterNodeRef.current;
        if (!filterNode) {
          filterNode = audioContext.createBiquadFilter();
          biquadFilterNodeRef.current = filterNode;
          console.log('[BeatFX] Created BiquadFilterNode for FILTER');
        }
        switch (activeFXFrequencyBand) {
          case 'LOW': filterNode.type = 'lowpass'; filterNode.frequency.setValueAtTime(300, audioContext.currentTime); filterNode.Q.setValueAtTime(1, audioContext.currentTime); console.log('[BeatFX] FILTER config: LOW'); break;
          case 'MID': filterNode.type = 'bandpass'; filterNode.frequency.setValueAtTime(1000, audioContext.currentTime); filterNode.Q.setValueAtTime(1.5, audioContext.currentTime); console.log('[BeatFX] FILTER config: MID'); break;
          case 'HI':  filterNode.type = 'highpass'; filterNode.frequency.setValueAtTime(3000, audioContext.currentTime); filterNode.Q.setValueAtTime(1, audioContext.currentTime); console.log('[BeatFX] FILTER config: HI'); break;
        }
        try {
          fxChainInput.connect(filterNode);
          filterNode.connect(fxChainOutput);
          console.log(`[BeatFX] FILTER active & connected via ${activeFXFrequencyBand} band.`);
        } catch (e) { 
          console.error('[BeatFX] Error connecting FILTER for band:', activeFXFrequencyBand, e);
          try { fxChainInput.connect(fxChainOutput); } catch (e2) { /* Fallback bypass failed */ }
        }
      }
    } else if (activeBeatFX === 'FLANGER') {
      if (!activeFXFrequencyBand) { // FLANGER selected but no band -> BYPASS
        console.log('[BeatFX] FLANGER selected but no band. Setting bypass.');
        try { fxChainInput.connect(fxChainOutput); } catch (e) { console.error('[BeatFX] Error connecting bypass for FLANGER no band:', e);}
      } else {
        flangerLFORef.current = audioContext.createOscillator();
        if (!flangerDelayNodeRef.current) flangerDelayNodeRef.current = audioContext.createDelay();
        if (!flangerLFOModGainRef.current) flangerLFOModGainRef.current = audioContext.createGain();
        if (!flangerFeedbackRef.current) flangerFeedbackRef.current = audioContext.createGain();
        if (!flangerWetGainRef.current) flangerWetGainRef.current = audioContext.createGain();
        if (!flangerDryGainRef.current) flangerDryGainRef.current = audioContext.createGain();

        const lfo = flangerLFORef.current;
        const delay = flangerDelayNodeRef.current!;
        const lfoModGain = flangerLFOModGainRef.current!;
        const feedback = flangerFeedbackRef.current!;
        const wetGain = flangerWetGainRef.current!;
        const dryGain = flangerDryGainRef.current!;

        lfo.type = 'sine';
        let baseDelay = 0.005, lfoFreq = 0.5, lfoDepth = 0.002, feedbackGain = 0.3, dryLevel = 0.6, wetLevel = 0.4;
        switch (activeFXFrequencyBand) {
          case 'LOW': baseDelay = 0.01; lfoFreq = 0.2; lfoDepth = 0.004; feedbackGain = 0.2; dryLevel = 0.65; wetLevel = 0.35; console.log('[BeatFX] FLANGER config: LOW'); break;
          case 'MID': baseDelay = 0.007; lfoFreq = 0.7; lfoDepth = 0.003; feedbackGain = 0.35; dryLevel = 0.6; wetLevel = 0.4; console.log('[BeatFX] FLANGER config: MID'); break;
          case 'HI':  baseDelay = 0.004; lfoFreq = 2.0; lfoDepth = 0.002; feedbackGain = 0.5; dryLevel = 0.5; wetLevel = 0.5; console.log('[BeatFX] FLANGER config: HI'); break;
        }
        delay.delayTime.setValueAtTime(baseDelay, audioContext.currentTime);
        lfo.frequency.setValueAtTime(lfoFreq, audioContext.currentTime);
        lfoModGain.gain.setValueAtTime(lfoDepth, audioContext.currentTime);
        feedback.gain.setValueAtTime(feedbackGain, audioContext.currentTime);
        dryGain.gain.setValueAtTime(dryLevel, audioContext.currentTime);
        wetGain.gain.setValueAtTime(wetLevel, audioContext.currentTime);
        try {
            fxChainInput.connect(dryGain);
            dryGain.connect(fxChainOutput);
            fxChainInput.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay); 
            delay.connect(wetGain);
            wetGain.connect(fxChainOutput);
            lfo.connect(lfoModGain);
            lfoModGain.connect(delay.delayTime); 
            lfo.start();
            console.log(`[BeatFX] FLANGER active & connected via ${activeFXFrequencyBand} band.`);
        } catch (e) {
            console.error('[BeatFX] Error connecting FLANGER for band:', activeFXFrequencyBand, e);
            try { fxChainInput.connect(fxChainOutput); } catch (e2) { /* Fallback bypass failed */ }
        }
      }
    } else if (activeBeatFX === 'PHASER') {
      if (!activeFXFrequencyBand) { // PHASER selected but no band -> BYPASS
        console.log('[BeatFX] PHASER selected but no band. Setting bypass.');
        try { fxChainInput.connect(fxChainOutput); } catch (e) { console.error('[BeatFX] Error connecting bypass for PHASER no band:', e);}
      } else {
        phaserLFORef.current = audioContext.createOscillator();
        if (!phaserLFOModGainRef.current) phaserLFOModGainRef.current = audioContext.createGain();
        if (!phaserFeedbackGainRef.current) phaserFeedbackGainRef.current = audioContext.createGain();
        if (!phaserDryGainRef.current) phaserDryGainRef.current = audioContext.createGain();
        if (!phaserWetGainRef.current) phaserWetGainRef.current = audioContext.createGain();
        for (let i = 0; i < PHASER_STAGES; i++) {
          if (!phaserAllPassFilterRefs.current[i]) {
            phaserAllPassFilterRefs.current[i] = audioContext.createBiquadFilter();
            phaserAllPassFilterRefs.current[i]!.type = 'allpass';
          }
        }
        const lfo = phaserLFORef.current;
        const lfoModGain = phaserLFOModGainRef.current!;
        const feedbackGainNode = phaserFeedbackGainRef.current!;
        const dryGain = phaserDryGainRef.current!;
        const wetGain = phaserWetGainRef.current!;
        const filters = phaserAllPassFilterRefs.current as BiquadFilterNode[];
        lfo.type = 'sine';
        let baseFreq = 800, lfoFreqPhaser = 0.5, lfoModDepth = 400, feedbackVal = 0.3, qVal = 1, dryLevelPhaser=0.5, wetLevelPhaser=0.5;
        switch (activeFXFrequencyBand) {
          case 'LOW': baseFreq = 350; lfoFreqPhaser = 0.3; lfoModDepth = 150; feedbackVal = 0.1; qVal = 0.7; dryLevelPhaser=0.6; wetLevelPhaser=0.4; console.log('[BeatFX] PHASER config: LOW'); break;
          case 'MID': baseFreq = 700; lfoFreqPhaser = 0.8; lfoModDepth = 350; feedbackVal = 0.35; qVal = 1; dryLevelPhaser=0.5; wetLevelPhaser=0.5; console.log('[BeatFX] PHASER config: MID'); break;
          case 'HI':  baseFreq = 1200; lfoFreqPhaser = 1.5; lfoModDepth = 500; feedbackVal = 0.45; qVal = 1.2; dryLevelPhaser=0.4; wetLevelPhaser=0.6; console.log('[BeatFX] PHASER config: HI'); break;
        }
        lfo.frequency.setValueAtTime(lfoFreqPhaser, audioContext.currentTime);
        lfoModGain.gain.setValueAtTime(lfoModDepth, audioContext.currentTime);
        feedbackGainNode.gain.setValueAtTime(feedbackVal, audioContext.currentTime);
        dryGain.gain.setValueAtTime(dryLevelPhaser, audioContext.currentTime);
        wetGain.gain.setValueAtTime(wetLevelPhaser, audioContext.currentTime);
        filters.forEach(filter => { if (filter) { filter.frequency.setValueAtTime(baseFreq, audioContext.currentTime); filter.Q.setValueAtTime(qVal, audioContext.currentTime); } });
        try {
            fxChainInput.connect(dryGain);
            dryGain.connect(fxChainOutput);
            fxChainInput.connect(filters[0]);
            for (let i = 0; i < PHASER_STAGES - 1; i++) { filters[i].connect(filters[i+1]); }
            lfo.connect(lfoModGain);
            filters.forEach(filter => { if (filter) lfoModGain.connect(filter.frequency); });
            filters[PHASER_STAGES - 1].connect(wetGain);
            wetGain.connect(fxChainOutput);
            filters[PHASER_STAGES - 1].connect(feedbackGainNode);
            feedbackGainNode.connect(filters[0]);
            lfo.start();
            console.log(`[BeatFX] PHASER active & connected via ${activeFXFrequencyBand} band.`);
        } catch (e) {
            console.error('[BeatFX] Error connecting PHASER for band:', activeFXFrequencyBand, e);
            try { fxChainInput.connect(fxChainOutput); } catch (e2) { /* Fallback bypass failed */ }
        }
      }
    } else if (activeBeatFX === 'REVERB') {
      if (!activeFXFrequencyBand) { // REVERB selected but no band -> BYPASS
        console.log('[BeatFX] REVERB selected but no band (Algo). Setting bypass.');
        try { fxChainInput.connect(fxChainOutput); } catch (e) { console.error('[BeatFX] Error connecting bypass for REVERB no band (Algo):', e);}
      } else {
        // Ensure main wet/dry gains for reverb exist
        if (!reverbWetGainRef.current) reverbWetGainRef.current = audioContext.createGain();
        if (!reverbDryGainRef.current) reverbDryGainRef.current = audioContext.createGain();
        
        // Ensure delay lines and feedback gains arrays are initialized
        if (reverbDelayNodesRef.current.length !== NUM_REVERB_DELAYS || !reverbDelayNodesRef.current[0]) {
            reverbDelayNodesRef.current = [];
            reverbFeedbackGainsRef.current = [];
            for (let i = 0; i < NUM_REVERB_DELAYS; i++) {
                reverbDelayNodesRef.current.push(audioContext.createDelay(2.0)); // Max delay 2s for reverb
                reverbFeedbackGainsRef.current.push(audioContext.createGain());
            }
            console.log('[BeatFX] Initialized Algorithmic Reverb delay lines & feedback gains.');
        }

        const wetGain = reverbWetGainRef.current!;
        const dryGain = reverbDryGainRef.current!;
        const delays = reverbDelayNodesRef.current as DelayNode[];
        const feedbacks = reverbFeedbackGainsRef.current as GainNode[];

        let delayTimes = [0.023, 0.037, 0.051, 0.067]; 
        let feedbackLevels = [0.6, 0.55, 0.5, 0.45];
        let overallDryLevel = 0.6, overallWetLevel = 0.4;

        switch (activeFXFrequencyBand) {
          case 'LOW': 
            delayTimes = [0.071, 0.083, 0.097, 0.113];
            feedbackLevels = [0.7, 0.65, 0.6, 0.55];
            overallWetLevel = 0.5; overallDryLevel = 0.5;
            console.log('[BeatFX] REVERB config: LOW (Algorithmic)'); break;
          case 'MID': 
            delayTimes = [0.047, 0.059, 0.073, 0.089];
            feedbackLevels = [0.65, 0.6, 0.55, 0.5];
            overallWetLevel = 0.4; overallDryLevel = 0.6;
            console.log('[BeatFX] REVERB config: MID (Algorithmic)'); break;
          case 'HI':  
            delayTimes = [0.023, 0.029, 0.037, 0.043];
            feedbackLevels = [0.55, 0.5, 0.45, 0.4];
            overallWetLevel = 0.35; overallDryLevel = 0.65;
            console.log('[BeatFX] REVERB config: HI (Algorithmic)'); break;
        }
        dryGain.gain.setValueAtTime(overallDryLevel, audioContext.currentTime);
        wetGain.gain.setValueAtTime(overallWetLevel, audioContext.currentTime);

        for (let i = 0; i < NUM_REVERB_DELAYS; i++) {
            if(delays[i] && feedbacks[i]) { // Check if nodes exist
              delays[i].delayTime.setValueAtTime(delayTimes[i], audioContext.currentTime);
              feedbacks[i].gain.setValueAtTime(feedbackLevels[i], audioContext.currentTime);
            }
        }

        try {
            fxChainInput.connect(dryGain);
            dryGain.connect(fxChainOutput);

            for (let i = 0; i < NUM_REVERB_DELAYS; i++) {
                if(delays[i] && feedbacks[i]) { // Check if nodes exist
                  fxChainInput.connect(delays[i]);
                  delays[i].connect(feedbacks[i]);
                  feedbacks[i].connect(delays[i]); 
                  delays[i].connect(wetGain);      
                }
            }
            wetGain.connect(fxChainOutput);
            console.log(`[BeatFX] Algorithmic REVERB active & connected via ${activeFXFrequencyBand} band.`);
        } catch (e) {
            console.error('[BeatFX] Error connecting Algorithmic REVERB for band:', activeFXFrequencyBand, e);
            try { fxChainInput.connect(fxChainOutput); } catch (e2) { /* Fallback bypass failed */ }
        }
      }
    } else if (activeBeatFX === 'ECHO') {
      if (!activeFXFrequencyBand) { // ECHO selected but no band -> BYPASS
        console.log('[BeatFX] ECHO selected but no band. Setting bypass.');
        try { fxChainInput.connect(fxChainOutput); } catch (e) { console.error('[BeatFX] Error connecting bypass for ECHO no band:', e);}
      } else {
        // Create/get nodes
        if (!echoDelayNodeRef.current) echoDelayNodeRef.current = audioContext.createDelay(5.0); // Max 5s delay for echo
        if (!echoFeedbackGainRef.current) echoFeedbackGainRef.current = audioContext.createGain();
        if (!echoWetGainRef.current) echoWetGainRef.current = audioContext.createGain();
        if (!echoDryGainRef.current) echoDryGainRef.current = audioContext.createGain();

        const delay = echoDelayNodeRef.current!;
        const feedback = echoFeedbackGainRef.current!;
        const wetGain = echoWetGainRef.current!;
        const dryGain = echoDryGainRef.current!;

        // Use selected beat division from X-PAD for primary timing
        let delayTimeVal = calculateBeatDuration(selectedBeatDivision, currentBpm);
        let feedbackGainVal = 0.5;
        let dryLevel = 0.7, wetLevel = 0.3;

        // Configure feedback and mix levels based on activeFXFrequencyBand
        switch (activeFXFrequencyBand) {
          case 'LOW': // Lower feedback to avoid muddying
            feedbackGainVal = 0.35;
            wetLevel = 0.25; dryLevel = 0.75;
            console.log(`[BeatFX] ECHO config: LOW with ${selectedBeatDivision} timing`); break;
          case 'MID': // Balanced for leads/synths
            feedbackGainVal = 0.5;
            wetLevel = 0.35; dryLevel = 0.65;
            console.log(`[BeatFX] ECHO config: MID with ${selectedBeatDivision} timing`); break;
          case 'HI':  // Higher feedback for crisp taps
            feedbackGainVal = 0.55;
            wetLevel = 0.4; dryLevel = 0.6;
            console.log(`[BeatFX] ECHO config: HI with ${selectedBeatDivision} timing`); break;
        }

        delay.delayTime.setValueAtTime(delayTimeVal, audioContext.currentTime);
        feedback.gain.setValueAtTime(feedbackGainVal, audioContext.currentTime);
        dryGain.gain.setValueAtTime(dryLevel, audioContext.currentTime);
        wetGain.gain.setValueAtTime(wetLevel, audioContext.currentTime);

        try {
            // Dry Path
            fxChainInput.connect(dryGain);
            dryGain.connect(fxChainOutput);

            // Wet Path
            fxChainInput.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay); // Feedback loop
            delay.connect(wetGain);
            wetGain.connect(fxChainOutput);
            
            console.log(`[BeatFX] ECHO active & connected via ${activeFXFrequencyBand} band, Delay: ${delayTimeVal.toFixed(4)}s`);
        } catch (e) {
            console.error('[BeatFX] Error connecting ECHO for band:', activeFXFrequencyBand, e);
            try { fxChainInput.connect(fxChainOutput); } catch (e2) { /* Fallback bypass failed */ }
        }
      }
    } else if (activeBeatFX === 'ROLL') {
      if (!track || typeof currentBpm !== 'number' || currentBpm <= 0) {
        console.warn('[BeatFX] Invalid track or BPM for ROLL effect.');
        try { fxChainInput.connect(fxChainOutput); } catch (e) { console.error('[BeatFX] Error connecting bypass for ROLL (invalid BPM):', e); }
      } else if (!activeFXFrequencyBand) {
        console.log('[BeatFX] ROLL selected but no band. Setting bypass.');
        try { fxChainInput.connect(fxChainOutput); } catch (e) { console.error('[BeatFX] Error connecting bypass for ROLL no band:', e);}
      } else {
        // Valid track, BPM, and frequency band - proceed with ROLL effect
        if (!rollDelayNodeRef.current || !rollFeedbackGainRef.current || !rollFilterNodeRef.current || !rollWetGainRef.current || !rollDryGainRef.current) {
          // Create nodes if they don't exist
          rollDelayNodeRef.current = audioContext.createDelay(1.0);
          rollFeedbackGainRef.current = audioContext.createGain();
          rollFilterNodeRef.current = audioContext.createBiquadFilter();
          rollWetGainRef.current = audioContext.createGain();
          rollDryGainRef.current = audioContext.createGain();
        }

        const delay = rollDelayNodeRef.current;
        const feedback = rollFeedbackGainRef.current;
        const filter = rollFilterNodeRef.current;
        const wetGain = rollWetGainRef.current;
        const dryGain = rollDryGainRef.current;

        // Use selected beat division from X-PAD for timing
        let delayTimeVal = calculateBeatDuration(selectedBeatDivision, currentBpm);
        let feedbackGainVal = 0.9;
        let wetLevel = 0.7;
        let dryLevel = 0.3;

        switch (activeFXFrequencyBand) {
          case 'LOW': // Tight and powerful
            // Keep the selected beat division timing but adjust other parameters
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, audioContext.currentTime);
            filter.Q.setValueAtTime(1, audioContext.currentTime);
            console.log(`[BeatFX] ROLL config: LOW with ${selectedBeatDivision} timing`); break;
          case 'MID': // Groove-focused rolls
            // Keep the selected beat division timing
            // No filter for MID, or filter.type = 'allpass';
            console.log(`[BeatFX] ROLL config: MID with ${selectedBeatDivision} timing`); break;
          case 'HI':  // Snappy rhythm cuts
            // Keep the selected beat division timing but adjust filter
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(2500, audioContext.currentTime);
            filter.Q.setValueAtTime(1, audioContext.currentTime);
            console.log(`[BeatFX] ROLL config: HI with ${selectedBeatDivision} timing`); break;
        }

        delay.delayTime.setValueAtTime(delayTimeVal, audioContext.currentTime);
        feedback.gain.setValueAtTime(feedbackGainVal, audioContext.currentTime);
        dryGain.gain.setValueAtTime(dryLevel, audioContext.currentTime);
        wetGain.gain.setValueAtTime(wetLevel, audioContext.currentTime);

        try {
            fxChainInput.connect(dryGain);
            dryGain.connect(fxChainOutput);

            fxChainInput.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(filter);
            filter.connect(wetGain);
            wetGain.connect(fxChainOutput);
            
            console.log(`[BeatFX] ROLL active & connected via ${activeFXFrequencyBand} band, BPM: ${currentBpm}, Delay: ${delayTimeVal.toFixed(4)}s`);
        } catch (e) {
            console.error('[BeatFX] Error connecting ROLL for band:', activeFXFrequencyBand, e);
            try { fxChainInput.connect(fxChainOutput); } catch (e2) { /* Fallback bypass failed */ }
        }
      }
    } else if (activeBeatFX === 'BUBBLE') {
      if (!activeFXFrequencyBand) {
        console.log('[BeatFX] BUBBLE selected but no band. Setting bypass.');
        try { fxChainInput.connect(fxChainOutput); } catch (e) { console.error('[BeatFX] Error connecting bypass for BUBBLE no band:', e);}
      } else {
        bubblePitchLFORef.current = audioContext.createOscillator();
        bubblePanLFORef.current = audioContext.createOscillator();
        if (!bubbleDelayNodeRef.current) bubbleDelayNodeRef.current = audioContext.createDelay(5.0);
        if (!bubbleFeedbackGainRef.current) bubbleFeedbackGainRef.current = audioContext.createGain();
        if (!bubblePitchLFODepthGainRef.current) bubblePitchLFODepthGainRef.current = audioContext.createGain();
        if (!bubblePanLFODepthGainRef.current) bubblePanLFODepthGainRef.current = audioContext.createGain();
        if (!bubblePannerNodeRef.current) bubblePannerNodeRef.current = audioContext.createStereoPanner();
        if (!bubbleWetGainRef.current) bubbleWetGainRef.current = audioContext.createGain();
        if (!bubbleDryGainRef.current) bubbleDryGainRef.current = audioContext.createGain();

        const delay = bubbleDelayNodeRef.current!;
        const feedback = bubbleFeedbackGainRef.current!;
        const pitchLFO = bubblePitchLFORef.current!;
        const pitchLFODepth = bubblePitchLFODepthGainRef.current!;
        const panLFO = bubblePanLFORef.current!;
        const panLFODepth = bubblePanLFODepthGainRef.current!;
        const panner = bubblePannerNodeRef.current!;
        const wetGain = bubbleWetGainRef.current!;
        const dryGain = bubbleDryGainRef.current!;

        pitchLFO.type = 'sawtooth';
        panLFO.type = 'sine';

        // Use selected beat division from X-PAD for primary timing
        let baseDelay = calculateBeatDuration(selectedBeatDivision, currentBpm);
        let feedbackGain = 0.6, pLFOFreq = 1.5, pLFODepth = 0.008, panLFOFreq = 0.7, panLFODVal = 0.8, dryVal = 0.4, wetVal = 0.6;

        // Configure LFO and effect parameters based on activeFXFrequencyBand
        switch (activeFXFrequencyBand) {
          case 'LOW': 
            feedbackGain = 0.4; pLFOFreq = 0.3; pLFODepth = 0.002; panLFOFreq = 0.2; panLFODVal = 0.4; dryVal = 0.7; wetVal = 0.3; 
            console.log(`[BeatFX] BUBBLE config: LOW with ${selectedBeatDivision} timing`); break;
          case 'MID': 
            feedbackGain = 0.6; pLFOFreq = 1.5; pLFODepth = 0.008; panLFOFreq = 0.7; panLFODVal = 0.8; dryVal = 0.4; wetVal = 0.6; 
            console.log(`[BeatFX] BUBBLE config: MID with ${selectedBeatDivision} timing`); break;
          case 'HI':  
            feedbackGain = 0.75; pLFOFreq = 4; pLFODepth = 0.015; panLFOFreq = 2; panLFODVal = 1.0; dryVal = 0.2; wetVal = 0.8; 
            console.log(`[BeatFX] BUBBLE config: HI with ${selectedBeatDivision} timing`); break;
        }

        delay.delayTime.setValueAtTime(baseDelay, audioContext.currentTime);
        feedback.gain.setValueAtTime(feedbackGain, audioContext.currentTime);
        pitchLFO.frequency.setValueAtTime(pLFOFreq, audioContext.currentTime);
        pitchLFODepth.gain.setValueAtTime(pLFODepth, audioContext.currentTime);
        panLFO.frequency.setValueAtTime(panLFOFreq, audioContext.currentTime);
        panLFODepth.gain.setValueAtTime(panLFODVal, audioContext.currentTime);
        dryGain.gain.setValueAtTime(dryVal, audioContext.currentTime);
        wetGain.gain.setValueAtTime(wetVal, audioContext.currentTime);
        
        try {
            fxChainInput.connect(dryGain);
            dryGain.connect(fxChainOutput);

            fxChainInput.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(panner);
            panner.connect(wetGain);
            wetGain.connect(fxChainOutput);

            pitchLFO.connect(pitchLFODepth);
            pitchLFODepth.connect(delay.delayTime);

            panLFO.connect(panLFODepth);
            panLFODepth.connect(panner.pan);

            pitchLFO.start();
            panLFO.start();
            console.log(`[BeatFX] BUBBLE active & connected via ${activeFXFrequencyBand} band, Delay: ${baseDelay.toFixed(4)}s`);
        } catch (e) {
            console.error('[BeatFX] Error connecting BUBBLE for band:', activeFXFrequencyBand, e);
            try { fxChainInput.connect(fxChainOutput); } catch (e2) { /* Fallback bypass failed */ }
        }
      }
    } else if (activeBeatFX === 'DELAY') {
      if (!activeFXFrequencyBand) {
        console.log('[BeatFX] DELAY selected but no band. Setting bypass.');
        try { fxChainInput.connect(fxChainOutput); } catch (e) { console.error('[BeatFX] Error connecting bypass for DELAY no band:', e);}
      } else {
        if (!delayDelayNodeRef.current) delayDelayNodeRef.current = audioContext.createDelay(5.0); // Max 5s delay
        if (!delayFeedbackGainRef.current) delayFeedbackGainRef.current = audioContext.createGain();
        if (!delayWetGainRef.current) delayWetGainRef.current = audioContext.createGain();
        if (!delayDryGainRef.current) delayDryGainRef.current = audioContext.createGain();

        const delayNode = delayDelayNodeRef.current!;
        const feedbackGain = delayFeedbackGainRef.current!;
        const wetGain = delayWetGainRef.current!;
        const dryGain = delayDryGainRef.current!;

        // Use selected beat division from X-PAD for primary timing
        let delayTimeVal = calculateBeatDuration(selectedBeatDivision, currentBpm);
        let feedbackVal = 0.4, dryMix = 0.5, wetMix = 0.5;

        // Configure feedback and mix levels based on activeFXFrequencyBand
        switch (activeFXFrequencyBand) {
          case 'LOW': 
            feedbackVal = 0.25; dryMix = 0.6; wetMix = 0.4; 
            console.log(`[BeatFX] DELAY config: LOW with ${selectedBeatDivision} timing`); break;
          case 'MID': 
            feedbackVal = 0.4; dryMix = 0.5; wetMix = 0.5; 
            console.log(`[BeatFX] DELAY config: MID with ${selectedBeatDivision} timing`); break;
          case 'HI':  
            feedbackVal = 0.55; dryMix = 0.4; wetMix = 0.6; 
            console.log(`[BeatFX] DELAY config: HI with ${selectedBeatDivision} timing`); break;
        }

        delayNode.delayTime.setValueAtTime(delayTimeVal, audioContext.currentTime);
        feedbackGain.gain.setValueAtTime(feedbackVal, audioContext.currentTime);
        dryGain.gain.setValueAtTime(dryMix, audioContext.currentTime);
        wetGain.gain.setValueAtTime(wetMix, audioContext.currentTime);

        try {
            fxChainInput.connect(dryGain);
            dryGain.connect(fxChainOutput);

            fxChainInput.connect(delayNode);
            delayNode.connect(feedbackGain);
            feedbackGain.connect(delayNode); // Feedback loop
            delayNode.connect(wetGain);
            wetGain.connect(fxChainOutput);
            console.log(`[BeatFX] DELAY active & connected via ${activeFXFrequencyBand} band, Delay: ${delayTimeVal.toFixed(4)}s`);
        } catch (e) {
            console.error('[BeatFX] Error connecting DELAY for band:', activeFXFrequencyBand, e);
            try { fxChainInput.connect(fxChainOutput); } catch (e2) { /* Fallback bypass failed */ }
        }
      }
    } else {
      console.log(`[BeatFX] No effect active or unknown effect (${activeBeatFX}). Ensuring bypass.`);
      // This is the final `else` in the chain, ensure fxChainInput is connected to fxChainOutput
      try {
        fxChainInput.connect(fxChainOutput);
      } catch (e) {
        console.error('[BeatFX] Error ensuring bypass (final else):', e);
      }
    }

    return () => {
      console.log('[BeatFX] Cleanup function for BeatFX useEffect (main).');
      try { fxChainInput.disconnect(); } catch(e) {/*-*/}
      // Filter
      if (biquadFilterNodeRef.current) try {biquadFilterNodeRef.current.disconnect();} catch(e) {/*-*/}
      // Flanger
      if (flangerLFORef.current) { try { flangerLFORef.current.stop(); } catch (e) {/*-*/ } try { flangerLFORef.current.disconnect(); } catch (e) {/*-*/ } flangerLFORef.current = null; }
      if (flangerLFOModGainRef.current) try {flangerLFOModGainRef.current.disconnect();} catch(e) {/*-*/}
      if (flangerDelayNodeRef.current) try {flangerDelayNodeRef.current.disconnect();} catch(e) {/*-*/}
      if (flangerFeedbackRef.current) try {flangerFeedbackRef.current.disconnect();} catch(e) {/*-*/}
      if (flangerWetGainRef.current) try {flangerWetGainRef.current.disconnect();} catch(e) {/*-*/}
      if (flangerDryGainRef.current) try {flangerDryGainRef.current.disconnect();} catch(e) {/*-*/}
      // Phaser
      if (phaserLFORef.current) { try { phaserLFORef.current.stop(); } catch (e) {/*-*/ } try { phaserLFORef.current.disconnect(); } catch (e) {/*-*/ } phaserLFORef.current = null; }
      if (phaserLFOModGainRef.current) try {phaserLFOModGainRef.current.disconnect();} catch(e) {/*-*/}
      phaserAllPassFilterRefs.current.forEach(filterNode => { if (filterNode) try { filterNode.disconnect(); } catch (e) {/*-*/} });
      if (phaserFeedbackGainRef.current) try {phaserFeedbackGainRef.current.disconnect();} catch(e) {/*-*/}
      if (phaserDryGainRef.current) try {phaserDryGainRef.current.disconnect();} catch(e) {/*-*/}
      if (phaserWetGainRef.current) try {phaserWetGainRef.current.disconnect();} catch(e) {/*-*/}
      // Algorithmic Reverb (New)
      reverbDelayNodesRef.current.forEach(node => { if (node) try { node.disconnect(); } catch(e){/*-*/}}); 
      reverbFeedbackGainsRef.current.forEach(node => { if (node) try { node.disconnect(); } catch(e){/*-*/}}); 
      if (reverbWetGainRef.current) try { reverbWetGainRef.current.disconnect(); } catch(e) {/*-*/}
      if (reverbDryGainRef.current) try { reverbDryGainRef.current.disconnect(); } catch(e) {/*-*/}
      // Ping Pong
      if (pingPongDelayLRef.current) try { pingPongDelayLRef.current.disconnect(); } catch(e){/*-*/}
      if (pingPongDelayRRef.current) try { pingPongDelayRRef.current.disconnect(); } catch(e){/*-*/}
      if (pingPongFeedbackLRef.current) try { pingPongFeedbackLRef.current.disconnect(); } catch(e){/*-*/}
      if (pingPongFeedbackRRef.current) try { pingPongFeedbackRRef.current.disconnect(); } catch(e){/*-*/}
      if (pingPongPannerLRef.current) try { pingPongPannerLRef.current.disconnect(); } catch(e){/*-*/}
      if (pingPongPannerRRef.current) try { pingPongPannerRRef.current.disconnect(); } catch(e){/*-*/}
      if (pingPongWetGainRef.current) try { pingPongWetGainRef.current.disconnect(); } catch(e){/*-*/}
      if (pingPongDryGainRef.current) try { pingPongDryGainRef.current.disconnect(); } catch(e){/*-*/}
      // Echo
      if (echoDelayNodeRef.current) try { echoDelayNodeRef.current.disconnect(); } catch(e){/*-*/}
      if (echoFeedbackGainRef.current) try { echoFeedbackGainRef.current.disconnect(); } catch(e){/*-*/}
      if (echoWetGainRef.current) try { echoWetGainRef.current.disconnect(); } catch(e){/*-*/}
      if (echoDryGainRef.current) try { echoDryGainRef.current.disconnect(); } catch(e){/*-*/}
      // Vinyl Brake specific cleanup is handled by the universal teardown at the start of the effect logic.
      // Roll
      if (rollDelayNodeRef.current) try { rollDelayNodeRef.current.disconnect(); } catch(e){/*-*/}
      if (rollFeedbackGainRef.current) try { rollFeedbackGainRef.current.disconnect(); } catch(e){/*-*/}
      if (rollFilterNodeRef.current) try { rollFilterNodeRef.current.disconnect(); } catch(e){/*-*/}
      if (rollWetGainRef.current) try { rollWetGainRef.current.disconnect(); } catch(e){/*-*/}
      if (rollDryGainRef.current) try { rollDryGainRef.current.disconnect(); } catch(e){/*-*/}
      // Helix
      if (helixLFORef.current) { try { helixLFORef.current.stop(); } catch (e) {/*-*/ } try { helixLFORef.current.disconnect(); } catch (e) {/*-*/ } helixLFORef.current = null; }
      if (helixLFODepthGainRef.current) try {helixLFODepthGainRef.current.disconnect();} catch(e) {/*-*/}
      if (helixDelayNodeRef.current) try {helixDelayNodeRef.current.disconnect();} catch(e) {/*-*/}
      if (helixFeedbackGainRef.current) try {helixFeedbackGainRef.current.disconnect();} catch(e) {/*-*/}
      if (helixWetGainRef.current) try {helixWetGainRef.current.disconnect();} catch(e) {/*-*/}
      if (helixDryGainRef.current) try {helixDryGainRef.current.disconnect();} catch(e) {/*-*/}
      // Bubble
      if (bubblePitchLFORef.current) { try { bubblePitchLFORef.current.stop(); } catch (e) {/*-*/ } try { bubblePitchLFORef.current.disconnect(); } catch (e) {/*-*/ } bubblePitchLFORef.current = null; }
      if (bubblePanLFORef.current) { try { bubblePanLFORef.current.stop(); } catch (e) {/*-*/ } try { bubblePanLFORef.current.disconnect(); } catch (e) {/*-*/ } bubblePanLFORef.current = null; }
      if (bubblePitchLFODepthGainRef.current) try {bubblePitchLFODepthGainRef.current.disconnect();} catch(e) {/*-*/}
      if (bubblePanLFODepthGainRef.current) try {bubblePanLFODepthGainRef.current.disconnect();} catch(e) {/*-*/}
      if (bubbleDelayNodeRef.current) try {bubbleDelayNodeRef.current.disconnect();} catch(e) {/*-*/}
      if (bubbleFeedbackGainRef.current) try {bubbleFeedbackGainRef.current.disconnect();} catch(e) {/*-*/}
      if (bubblePannerNodeRef.current) try {bubblePannerNodeRef.current.disconnect();} catch(e) {/*-*/}
      if (bubbleWetGainRef.current) try {bubbleWetGainRef.current.disconnect();} catch(e) {/*-*/}
      if (bubbleDryGainRef.current) try {bubbleDryGainRef.current.disconnect();} catch(e) {/*-*/}
      // Delay cleanup in main return
      if (delayDelayNodeRef.current) try { delayDelayNodeRef.current.disconnect(); } catch(e){/*-*/}
      if (delayFeedbackGainRef.current) try { delayFeedbackGainRef.current.disconnect(); } catch(e){/*-*/}
      if (delayWetGainRef.current) try { delayWetGainRef.current.disconnect(); } catch(e){/*-*/}
      if (delayDryGainRef.current) try { delayDryGainRef.current.disconnect(); } catch(e){/*-*/}

      if (audioContext && fxChainInput && fxChainOutput) {
        try {
          fxChainInput.connect(fxChainOutput);
          console.log('[BeatFX] Main Cleanup: Ensured bypass connection.');
        } catch (e) {
          console.warn('[BeatFX] Error during main cleanup bypass:', e);
        }
      }
    };
  }, [
    audioContext, 
    fxChainInput, 
    fxChainOutput, 
    activeBeatFX, 
    activeFXFrequencyBand,
    currentBpm, // Add currentBpm to dependencies for ROLL effect
    selectedBeatDivision // Add selectedBeatDivision for X-PAD timing
  ]);

  // Effect to adjust audio playback rate when BPM changes
  useEffect(() => {
    const audioElement = useAudioStore.getState().audioElement;
    
    if (!audioElement || !track || !playerTrack || playerTrack.id !== track.id) {
      return; // Only adjust playback rate for the currently playing track
    }

    // Calculate the playback rate based on BPM ratio
    const originalBpm = track.bpm;
    const playbackRate = currentBpm / originalBpm;
    
    // Limit playback rate to reasonable bounds (0.5x to 2.0x)
    const clampedPlaybackRate = Math.max(0.5, Math.min(2.0, playbackRate));
    
    if (Math.abs(audioElement.playbackRate - clampedPlaybackRate) > 0.01) {
      console.log(`[AUDIO TEMPO] Adjusting playback rate from ${audioElement.playbackRate.toFixed(3)} to ${clampedPlaybackRate.toFixed(3)} (BPM: ${originalBpm} → ${currentBpm})`);
      audioElement.playbackRate = clampedPlaybackRate;
    }
  }, [currentBpm, track, playerTrack]);

  const handleSetCue = useCallback((cueLabel: string, timeToSet?: number) => {
    if (!track) return;

    let currentTimeToSet = 0; // Correctly initialized
    
    if (timeToSet === undefined) {
      // Use existing logic if no time specified
      if (playerTrack?.id === track.id) {
        currentTimeToSet = playerCurrentTime; // Use global player's current time
      } else {
        if (localSeekTime !== null && playerTrack?.id !== track.id) {
          currentTimeToSet = localSeekTime;
        } else if (localSeekTime !== null && playerTrack?.id === track.id && !isPlayerPlaying) {
          // If same track, paused, and waveform was clicked, use that click time
          currentTimeToSet = localSeekTime;
        } else if (playerTrack?.id === track.id) { // Same track, could be playing or paused (playerCurrentTime is fine)
          currentTimeToSet = playerCurrentTime;
        } else {
          // Fallback or if track is not in player and no local seek, use 0 or current displayed time if available
          currentTimeToSet = localSeekTime !== null ? localSeekTime : 0;
        }
      }
    } else {
      currentTimeToSet = timeToSet; // Use the provided timeToSet if available
    }

    const newCue: HotCue = {
      label: cueLabel,
      time: currentTimeToSet,
      color: CUE_LABEL_COLORS[cueLabel] || '#808080'
    };

    console.log(`[TrackDetail] Setting cue: ${cueLabel} at ${currentTimeToSet}s`);

    // Get filename for saving to service
    const trackFilename = track.audioUrl?.split('/').pop();
    if (trackFilename) {
      // Create service-compatible cue with required color
      const serviceCue = {
        label: cueLabel,
        time: currentTimeToSet,
        color: CUE_LABEL_COLORS[cueLabel] || '#808080'
      };
      hotCueService.setHotCueWithNotification(trackFilename, serviceCue);
    }

    // Update local state immediately for UI responsiveness
    setTrack(prevTrack => {
      if (!prevTrack) return null;
      const existingCues = prevTrack.hotCues || [];
      // Remove existing cue with the same label, then add the new one
      const filteredCues = existingCues.filter(c => c.label !== cueLabel);
      const updatedCues = [...filteredCues, newCue].sort((a, b) => a.label.localeCompare(b.label));
      
      // Check if actual update is needed to prevent unnecessary re-renders if new state is identical
      if (JSON.stringify(prevTrack.hotCues || []) === JSON.stringify(updatedCues)) {
        return prevTrack;
      }
      return { ...prevTrack, hotCues: updatedCues };
    });

  }, [track, playerTrack?.id, playerCurrentTime, localSeekTime, isPlayerPlaying, setTrack]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, cueLabel: string) => {
    setDraggedCue(cueLabel);
    e.dataTransfer.setData('text/plain', cueLabel);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, newTime: number) => {
    e.preventDefault();
    const cueLabel = e.dataTransfer.getData('text/plain');
    if (cueLabel && draggedCue) {
      handleSetCue(cueLabel, newTime);
      setDraggedCue(null);
    }
  }, [draggedCue, handleSetCue]);

  const handleDragEnd = useCallback(() => {
    setDraggedCue(null);
  }, []);

  const handlePlayPauseFromDetail = useCallback(() => {
    if (!track) return;

    const isThisTrackCurrentlyInPlayer = playerTrack?.id === track.id;
    console.log(`[TrackDetail] handlePlayPauseFromDetail called for track: ${track.title} (ID: ${track.id})`);
    console.log(`[TrackDetail] Current player track: ${playerTrack?.id || 'none'}, isPlaying: ${isPlayerPlaying}`);
    console.log(`[TrackDetail] Is this track currently in player: ${isThisTrackCurrentlyInPlayer}`);

    if (!isThisTrackCurrentlyInPlayer) {
      console.log(`[TrackDetail] Loading new track into player: ${track.title}`);
      const trackForPlayer: AudioStoreTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        audioSrc: track.audioUrl,
        imageUrl: track.imageUrl || undefined,
      };
      console.log(`[TrackDetail] Calling loadTrackInPlayer with:`, trackForPlayer);
      console.log(`[TrackDetail] trackForPlayer.audioSrc:`, trackForPlayer.audioSrc);
      console.log(`[TrackDetail] track.audioUrl:`, track.audioUrl);
      loadTrackInPlayer(trackForPlayer);
      
      const playIntent = `play-${track.id}-${Date.now()}`;
      console.log(`[TrackDetail] Setting play intent: ${playIntent}`);
      setPlayIntent(playIntent); 
      
      if (localSeekTime !== null) {
          console.log(`[TrackDetail] Will seek to localSeekTime: ${localSeekTime} after load`);
      }
      
      console.log(`[TrackDetail] Calling togglePlayerPlayPause`);
      togglePlayerPlayPause(); 
      
      if (localSeekTime !== null) {
        console.log(`[TrackDetail] Seeking to localSeekTime: ${localSeekTime}`);
        seekPlayerTo(localSeekTime); 
        setLocalSeekTime(null); 
      }
    } else {
      if (!isPlayerPlaying) {
        console.log(`[TrackDetail] Track already in player but paused. Resuming playback.`);
        if (localSeekTime !== null && Math.abs(playerCurrentTime - localSeekTime) > 0.1) {
          console.log(`[TrackDetail] Seeking to ${localSeekTime}s before playing.`);
          seekPlayerTo(localSeekTime);
        }
        const playIntent = `play-${track.id}-${Date.now()}`;
        console.log(`[TrackDetail] Setting play intent for resume: ${playIntent}`);
        setPlayIntent(playIntent);
        togglePlayerPlayPause(); 
        setLocalSeekTime(null); 
      } else {
        console.log(`[TrackDetail] Track already in player and playing. Pausing.`);
        setPlayIntent(null); 
        togglePlayerPlayPause();
      }
    }
  }, [
    track, 
    playerTrack?.id,
    isPlayerPlaying,
    playerCurrentTime,
    localSeekTime,
    loadTrackInPlayer,
    togglePlayerPlayPause,
    seekPlayerTo,
    setPlayIntent
  ]);

  const handleSeekFromWaveform = useCallback((newTime: number) => {
    if (!track?.id) return;
    // console.log(`[TrackDetail] handleSeekFromWaveform: newTime=${newTime}, playerTrack.id=${playerTrack?.id}, track.id=${track.id}`);
    if (playerTrack?.id === track.id) {
      // console.log(`[TrackDetail] Seeking player to ${newTime}`);
      seekPlayerTo(newTime);
    } else {
      // console.log(`[TrackDetail] Setting local seek time to ${newTime} for track ${track.title}`);
      setLocalSeekTime(newTime);
      // If track is not in player, clicking waveform sets local seek time.
      // If user then clicks play, handlePlayPauseFromDetail should use this localSeekTime.
    }
  }, [
    track?.id,
    track?.title, // For logging
    playerTrack?.id,
    seekPlayerTo,
    // setLocalSeekTime is part of this component's state setters, not a dependency here
  ]);

  // Add these to your existing imports at the top
  const [isVocalPlaying, setIsVocalPlaying] = useState(false);

  // Add these states near the other state declarations
  const [isVocalLoading, setIsVocalLoading] = useState(false);
  const [vocalCurrentTime, setVocalCurrentTime] = useState(0);
  const [vocalError, setVocalError] = useState<string | null>(null);

  // Update handleVocalPlayback to be async and check file existence
  const handleVocalPlayback = useCallback(async () => {
    console.log('[Vocals] handleVocalPlayback called');
    console.log('[Vocals] Current track:', track);
    
    if (!track) {
      console.log('[Vocals] No track available');
      return;
    }

    setVocalError(null);
    setIsVocalLoading(true);

    try {
      const trackFilename = track.audioUrl?.split('/').pop() || track.title;
      const vocalPath = getVocalStemPath(trackFilename);
      console.log('[Vocals] Using vocal path:', vocalPath);

      const fileExists = await checkVocalFileExists(vocalPath);
      if (!fileExists) {
        console.error('[Vocals] Vocal file not found:', vocalPath);
        setVocalError('Vocal track not found');
        setIsVocalLoading(false);
        return;
      }

      if (!vocalAudioRef.current) {
        console.log('[Vocals] Creating new Audio element');
        const audio = new Audio(vocalPath);
        audio.preload = 'auto';
        
        // Add event listeners
        audio.addEventListener('loadeddata', () => {
          console.log('[Vocals] Audio loaded successfully');
          setIsVocalLoading(false);
        });
        
        audio.addEventListener('error', (e) => {
          console.error('[Vocals] Error loading audio:', e);
          setVocalError('Error loading vocal track');
          setIsVocalLoading(false);
        });
        
        audio.addEventListener('ended', () => {
          console.log('[Vocals] Audio playback ended');
          setIsVocalPlaying(false);
          setVocalCurrentTime(0);
        });

        // Add timeupdate event listener
        audio.addEventListener('timeupdate', () => {
          setVocalCurrentTime(audio.currentTime);
        });
        
        vocalAudioRef.current = audio;
        setVocalAudio(audio);
      }

      const audio = vocalAudioRef.current;
      
      if (isVocalPlaying) {
        console.log('[Vocals] Pausing vocal track');
        audio.pause();
        setIsVocalPlaying(false);
      } else {
        console.log('[Vocals] Attempting to play vocal track');
        if (localSeekTime !== null) {
          console.log('[Vocals] Setting time to:', localSeekTime);
          audio.currentTime = localSeekTime;
          setVocalCurrentTime(localSeekTime);
        }
        
        try {
          await audio.play();
          console.log('[Vocals] Playback started successfully');
          setIsVocalPlaying(true);
        } catch (e) {
          console.error('[Vocals] Error playing vocal track:', e);
          setVocalError('Error playing vocal track');
          setIsVocalPlaying(false);
        }
      }
    } catch (error) {
      console.error('[Vocals] Unexpected error:', error);
      setVocalError('Unexpected error occurred');
    } finally {
      setIsVocalLoading(false);
    }
  }, [track, isVocalPlaying, localSeekTime]);

  // Add cleanup effect for vocal audio
  useEffect(() => {
    return () => {
      if (vocalAudioRef.current) {
        vocalAudioRef.current.pause();
        vocalAudioRef.current = null;
        setVocalAudio(null);
        setIsVocalPlaying(false);
        setVocalCurrentTime(0);
      }
    };
  }, []);

  useEffect(() => {
    if (vocalAudioRef.current && localSeekTime !== null) {
      vocalAudioRef.current.currentTime = localSeekTime;
      setVocalCurrentTime(localSeekTime);
    }
  }, [localSeekTime]);

  useEffect(() => {
    // Cleanup previous vocal audio when track changes
    if (vocalAudioRef.current) {
      vocalAudioRef.current.pause();
      vocalAudioRef.current = null;
      setVocalAudio(null);
      setIsVocalPlaying(false);
      setVocalCurrentTime(0);
    }
  }, [track?.id]);

  // Update handleVocalSeek to set the current time
  const handleVocalSeek = useCallback((time: number) => {
    if (vocalAudioRef.current) {
      vocalAudioRef.current.currentTime = time;
      setVocalCurrentTime(time);
    }
  }, []);

  // Add these near other state declarations, after the draggedCue state
  const [vocalAudio, setVocalAudio] = useState<HTMLAudioElement | null>(null);
  const vocalAudioRef = useRef<HTMLAudioElement | null>(null);

  if (!track) { 
    return <div className="min-h-screen bg-[#121212] text-white p-10 text-center">Track not found or select a track to view details...</div>;
  }

  const actualTrackDurationSecs = parseTrackLengthToSeconds(track.trackLength);

  let displayTimeForWaveforms = 0;
  let displayDurationForWaveforms = actualTrackDurationSecs > 0 ? actualTrackDurationSecs : 0;

  if (playerTrack?.id === track.id) {
    displayTimeForWaveforms = playerCurrentTime;
    displayDurationForWaveforms = playerDuration > 0 ? playerDuration : actualTrackDurationSecs;
  } else {
    if (localSeekTime !== null) {
      displayTimeForWaveforms = localSeekTime;
    }
  }

  // Format displayTimeForWaveforms and track.trackLength for the time display string
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const currentTimeFormatted = formatTime(displayTimeForWaveforms);
  const totalTimeFormatted = formatTime(displayDurationForWaveforms > 0 ? displayDurationForWaveforms : actualTrackDurationSecs);

  return (
    <div className="min-h-screen bg-[#121212]">


      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        <div>
          {/* Track Info */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-orange-500 text-sm font-medium">{convertToCamelot(track.key)}</span>
              <span className="text-purple-400 text-sm font-medium">{currentBpm} BPM</span>
              <h1 className="text-3xl font-bold text-white flex-1">{track.title} {track.remixer && <span className="text-xl font-normal text-gray-400">({track.remixer} Remix)</span>}</h1>
              <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
                {track.genre}
              </span>
              {track.subgenre && 
                <span className="px-3 py-1 bg-gray-600 rounded-full text-sm text-gray-400">
                  {track.subgenre}
                </span>
              }
            </div>
            <div className="flex items-center gap-4 mb-6 text-sm text-gray-400">
              <span>By: <span className="text-gray-200">{track.artist}</span></span>
              {track.recordLabel && <span>Label: <span className="text-gray-200">{track.recordLabel}</span></span>}
              <span>Released: <span className="text-gray-200">{track.releaseDate}</span></span>
              <span>Length: <span className="text-gray-200">{track.trackLength}</span></span>
              {track.fileType && <span>Format: <span className="text-gray-200">{track.fileType}</span></span>}
            </div>

            {/* Main Waveform & DJ Controls */}
            <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6">
              {/* BPM and Time Display */}
              <div className="flex justify-between items-center mb-3 px-2">
                <div className="text-lg flex items-center gap-2">
                  {/* Play/Pause Button */}
                  <button 
                    onClick={handlePlayPauseFromDetail}
                    className={`p-2 rounded-full mr-2 transition-colors 
                                ${playerTrack?.id === track?.id && isPlayerPlaying ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-amber-500 hover:bg-amber-400 text-slate-900'}`}
                    aria-label={playerTrack?.id === track?.id && isPlayerPlaying ? 'Pause' : 'Play'}
                    disabled={!track} // Disable if no track is loaded on the page
                  >
                    {playerTrack?.id === track?.id && isPlayerPlaying ? <PauseIcon size={20} fill="currentColor"/> : <PlayIcon size={20} fill="currentColor"/>}
                  </button>

                  <button className="p-1 bg-gray-700 hover:bg-gray-600 rounded-full text-white disabled:opacity-50" title="Decrease BPM" onClick={() => adjustBpm(-1)} >
                    <MinusIcon size={16} />
                  </button>
                  <div>
                    <span className="text-purple-400 font-semibold">{currentBpm.toFixed(1)}</span> <span className="text-gray-400 text-sm">BPM</span>
                  </div>
                  <button className="p-1 bg-gray-700 hover:bg-gray-600 rounded-full text-white disabled:opacity-50" title="Increase BPM" onClick={() => adjustBpm(1)} >
                    <PlusIcon size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    className={`px-2 py-1 text-xs font-medium rounded ${true ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`} 
                    title="Toggle Key Lock (Master Tempo)"
                    onClick={() => console.log('Key Lock Toggled')}
                  >
                    KEY LOCK
                  </button>
                  <div className="text-lg text-gray-300">
                    <span>{currentTimeFormatted}</span> / <span>{totalTimeFormatted}</span>
                  </div>
                </div>
              </div>

              {track && track.audioUrl ? (
                <WaveformVisualizer
                  key={`main-waveform-${track.id}-${track.audioUrl}`}
                  audioUrl={track.audioUrl}
                  color="#4A90E2"
                  height={100}
                  currentTime={displayTimeForWaveforms}
                  onSeek={handleSeekFromWaveform}
                  isPlaying={playerTrack?.id === track.id && isPlayerPlaying}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ) : (
                <div style={{ height: 100, backgroundColor: '#1A1A1A' }} className="rounded-lg flex items-center justify-center text-gray-500">Loading waveform...</div>
              )}

              {/* Hot Cue Buttons */}
              <div className="mt-4 grid grid-cols-8 gap-2 px-2">
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((cueLabel) => {
                  const cue = track.hotCues?.find(c => c.label === cueLabel);
                  const isActive = !!cue;
                  const buttonStyle = isActive && cue?.color ? { backgroundColor: cue.color } : {};
                  const buttonClasses = `py-2 rounded text-xs font-medium transition-colors cursor-pointer select-none ${isActive ? 'text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`;

                  return (
                    <button 
                      key={cueLabel} 
                      className={buttonClasses}
                      style={buttonStyle}
                      draggable={isActive}
                      title={isActive && cue ? `Hot Cue ${cueLabel} - ${formatTime(cue.time)} (drag to move)` : `Set Hot Cue ${cueLabel} at ${formatTime(playerTrack?.id === track?.id ? playerCurrentTime : (localSeekTime ?? 0))}`}
                      onDragStart={(e) => isActive && handleDragStart(e, cueLabel)}
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        if (isActive && cue) {
                          handleSeekFromWaveform(cue.time);
                        } else {
                          handleSetCue(cueLabel);
                        }
                      }}
                    >
                      {cueLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vocal Track Section - Moved here */}
            {track?.stems?.length > 0 && track.stems[0] && (
              <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <span className="text-pink-500 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-lg font-medium text-white">Vocals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        className={`p-2 rounded-full mr-2 transition-colors ${
                          isVocalPlaying 
                            ? 'bg-pink-500 hover:bg-pink-600' 
                            : 'bg-gray-700 hover:bg-gray-600'
                        } text-white`}
                        onClick={handleVocalPlayback}
                        title={isVocalPlaying ? 'Pause Vocals' : 'Play Vocals'}
                      >
                        {isVocalPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
                      </button>
                      <button 
                        className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-full text-white"
                        onClick={() => {
                          if (track.stems[0]?.audioUrl) {
                            const link = document.createElement('a');
                            link.href = track.stems[0].audioUrl; // This URL is now the compressed one due to getVocalStemPath
                            link.download = `${track.title}_vocals_compressed.wav`; // Update download filename
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        }}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    WAV / 44.1 kHz
                  </div>
                </div>

                {/* Vocal Waveform */}
                <div className="relative w-full">
                  <WaveformVisualizer
                    key={`vocal-waveform-${track.id}-${track.stems[0].audioUrl}`}
                    audioUrl={track.stems[0].audioUrl}
                    color="#FF69B4"
                    height={80}
                    onSeek={handleVocalSeek}
                    isPlaying={isVocalPlaying}
                    currentTime={vocalCurrentTime}
                  />
                </div>
              </div>
            )}

            {/* Beat FX Section - styled like Pioneer sidebar */}
            <div className="bg-[#0D0D0D] rounded-lg p-4 mb-6 mt-4 text-gray-300 border border-gray-700">
              {/* OLED Display Placeholder */}
              <div 
                className="bg-black rounded p-3 mb-4 border border-gray-600 cursor-pointer"
                onClick={() => setIsBeatFxMinimized(!isBeatFxMinimized)}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-blue-400">{activeBeatFX || 'NO EFFECT'}</span>
                    {isBeatFxMinimized ? <ChevronDownIcon size={16} fill="currentColor" /> : <ChevronUpIcon size={16} fill="currentColor" />}
                  </div>
                  {!isBeatFxMinimized && (
                    <span className="text-xl font-bold text-white">{currentBpm.toFixed(0)} <span className="text-sm">BPM</span></span>
                  )}
                </div>
                {!isBeatFxMinimized && (
                  <>
                    <div className="grid grid-cols-4 gap-1 text-center text-sm mb-1">
                      <div className={`p-1 rounded text-white ${selectedBeatDivision === '1/2' ? 'bg-blue-500' : 'bg-gray-700'}`}>1/2</div>
                      <div className={`p-1 rounded text-white ${selectedBeatDivision === '3/4' ? 'bg-blue-500' : 'bg-gray-700'}`}>3/4</div>
                      <div className={`p-1 rounded text-white ${selectedBeatDivision === '1' ? 'bg-blue-500' : 'bg-gray-700'}`}>1</div>
                      <div className={`p-1 rounded text-white ${selectedBeatDivision === '2' ? 'bg-blue-500' : 'bg-gray-700'}`}>2</div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>BEAT: {selectedBeatDivision}</span>
                      <span>{calculateBeatDuration(selectedBeatDivision, currentBpm).toFixed(3)}s</span>
                    </div>
                  </>
                )}
              </div>

              {/* Conditionally rendered Beat FX controls */}
              {!isBeatFxMinimized && (
                <>
                  {/* X-PAD */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-1 text-center">X-PAD</p>
                    <div className="grid grid-cols-4 gap-2">
                      {beatDivisions.map(beat => {
                        const isSelected = selectedBeatDivision === beat;
                        const beatDuration = calculateBeatDuration(beat, currentBpm);
                        
                        return (
                          <button 
                            key={beat}
                            onClick={() => {
                              setSelectedBeatDivision(beat);
                              console.log(`[X-PAD] Beat division selected: ${beat} (duration: ${beatDuration.toFixed(3)}s at ${currentBpm} BPM)`);
                            }}
                            className={`py-2 rounded text-xs font-medium transition-colors ${
                              isSelected 
                                ? 'bg-blue-500 hover:bg-blue-400 text-white' 
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                            }`}
                            title={`${beat} beat division (${beatDuration.toFixed(3)}s at ${currentBpm} BPM)`}
                          >
                            {beat}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <button 
                      className="p-1 bg-gray-700 hover:bg-gray-600 rounded-full text-white transition-colors"
                      onClick={() => shiftBeatDivision('left')}
                      title="Previous beat division"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <span className="text-sm font-semibold text-white">BEAT</span>
                    <button 
                      className="p-1 bg-gray-700 hover:bg-gray-600 rounded-full text-white transition-colors"
                      onClick={() => shiftBeatDivision('right')}
                      title="Next beat division"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>

                  <div className="relative flex justify-center items-center mb-3 h-12"> {/* Container for AUTO, TAP, QUANTIZE buttons */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
                      <button 
                        onClick={toggleAutoBpm}
                        className={`text-xs py-1 px-2 rounded text-white transition-colors ${
                          isAutoBpmEnabled 
                          ? 'bg-blue-500 hover:bg-blue-600' 
                          : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        title={`Currently in ${isAutoBpmEnabled ? 'AUTO' : 'TAP'} mode - click to toggle`}
                      >
                        {isAutoBpmEnabled ? 'AUTO' : 'TAP'}
                      </button>
                    </div>

                    <button 
                      onClick={handleTapTempo}
                      disabled={isAutoBpmEnabled}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-black font-bold text-sm cursor-pointer transition-colors ${ 
                        isAutoBpmEnabled 
                        ? 'bg-gray-500 cursor-not-allowed' 
                        : 'bg-green-500 hover:bg-green-400'
                      }`}
                      title={isAutoBpmEnabled ? 'TAP disabled in AUTO mode' : `TAP to set BPM (${tapTimes.length} taps)`}
                    >
                      TAP
                    </button>

                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                      <button 
                        onClick={toggleQuantize}
                        className={`text-xs py-1 px-2 rounded text-white transition-colors ${ 
                          isQuantizeEnabled 
                          ? 'bg-orange-500 hover:bg-orange-600' 
                          : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        title={`Quantize is ${isQuantizeEnabled ? 'ON' : 'OFF'} - snaps effects to beat grid`}
                      >
                        QUANTIZE {isQuantizeEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                  
                  {/* FX Frequency Low/Mid/Hi */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-1 text-center">FX FREQUENCY</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['LOW', 'MID', 'HI'] as const).map(band => (
                        <button 
                          key={band} 
                          onClick={() => setActiveFXFrequencyBand(prevBand => prevBand === band ? null : band)}
                          className={`py-2 rounded text-sm font-medium transition-colors 
                            ${
                              activeFXFrequencyBand === band 
                              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            }`}
                        >
                          {band}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Rotary FX Selector */}
                  <div className="mb-1">
                    <select
                      className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={activeBeatFX || ""} // Controlled component
                      onChange={(e) => setActiveBeatFX(e.target.value || null)}
                    >
                      <option value="">NO EFFECT</option> {/* Option for no effect */}
                      {[
                        'FILTER', 'FLANGER', 'PHASER', 'REVERB',
                        'PING PONG', 'ECHO', 'ROLL',
                        'HELIX', 'DELAY'
                      ].map(fx => (
                        <option key={fx} value={fx}>{fx}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-1">CH SELECT: 1</p>
                </>
              )}
            </div>

            {/* Artist Info */}
            <div className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-lg mt-6">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${track.artist}`}
                alt={track.artist}
                className="w-12 h-12 rounded-full"
                crossOrigin="anonymous"
              />
              <div>
                <h3 className="font-medium text-white">{track.artist}</h3>
                <p className="text-sm text-gray-400">View Profile</p>
              </div>
            </div>

            {/* DJ Notes Section - Placeholder */}
            <div className="mt-8 bg-[#1A1A1A] rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">DJ Notes</h3>
              <textarea 
                className="w-full h-24 bg-gray-700 text-gray-300 p-3 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 resize-none"
                placeholder="Add your personal notes for this track (e.g., good pairings, energy points, crowd reactions)..."
              >
              </textarea>
              <button className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium text-white">
                Save Notes (Feature Coming Soon)
              </button>
            </div>

            {/* Download Section */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-white mb-4">
                Download tracks by {track.artist}
              </h3>
              <div className="space-y-2">
                {relatedTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 bg-[#1A1A1A] p-4 rounded-lg"
                  >
                    <button className="p-2 bg-[#2A2A2A] rounded-full">
                      <PlayIcon size={16} />
                    </button>
                    <div className="flex-1">
                      <div className="text-white">{track.title}</div>
                      <div className="text-sm text-gray-400">
                        {currentBpm} BPM • {track.key} • {track.genre}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-4 py-2 bg-[#4A90E2] rounded-full text-sm">
                        Download
                      </button>
                      <button className="p-2 bg-[#2A2A2A] rounded-full">
                        <AddIcon size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside>
          <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-white mb-4">
              Top DJ Chart - April 2025
            </h3>
            <img
              src="/chart-cover.png"
              alt="Chart Cover"
              className="w-full rounded-lg mb-4"
            />
            <button className="w-full px-4 py-2 bg-[#4A90E2] rounded-full text-sm">
              Download
            </button>
          </div>

          <div className="bg-[#1A1A1A] rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-4">Latest Tracks</h3>
            <div className="space-y-4">
              {/* Add latest tracks list */}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default TrackDetail;