import React, { useEffect, useRef, useMemo, useState } from 'react';
import useAudioStore from '../stores/audioStore';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.esm.js';
import {
  // hotCueData,
  type HotCue,
} from "../../public/hotCueData";
import { Play, Pause, Volume2, VolumeX, Download, ListPlus, SkipBack, SkipForward } from 'lucide-react';
import { hotCueService } from '../services/hotCueService';
import { useNavigate } from 'react-router-dom';

const formatTime = (time: number): string => {
  if (isNaN(time) || time === Infinity) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const throttle = (func: (...args: any[]) => void, limit: number): ((...args: any[]) => void) => {
  let lastFunc: NodeJS.Timeout | undefined;
  let lastRan: number | undefined;
  return function(this: any, ...args: any[]) {
    const context = this;
    if (lastRan === undefined) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      if (lastFunc) {
        clearTimeout(lastFunc);
      }
      lastFunc = setTimeout(() => {
        if (lastRan !== undefined && (Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (lastRan !== undefined ? (Date.now() - lastRan) : 0));
    }
  }
};

interface HotCueLabel {
  id: string;
  label: string;
  time: number;
  color: string; // Original hex color for the label background
  leftPosition: string;
}

const AudioPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isReady,
    playIntentId,
    setAudioElement,
    setWaveSurferInstance,
    togglePlayPause,
    setVolume,
    setPlayIntent,
    play,
    _updateCurrentTime,
    _updateDuration,
    _setPlaying,
    _setIsReady,
  } = useAudioStore();

  const audioElementRef = useRef<HTMLAudioElement>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null); // Ref for waveform container
  const wavesurferInstanceRef = useRef<WaveSurfer | null>(null); // Ref for WaveSurfer instance
  const regionsPluginRef = useRef<RegionsPlugin | null>(null); // Ref for RegionsPlugin instance
  const wavesurferReadyRef = useRef(false); // For Point 4
  const [hotCueLabels, setHotCueLabels] = useState<HotCueLabel[]>([]); // State for cue labels
  const [hotCueDataVersion, setHotCueDataVersion] = useState(0); // State to trigger hot cue reload
  const navigate = useNavigate();

  const throttledUpdateCurrentTime = useMemo(() => 
    throttle((time: number) => {
      _updateCurrentTime(time);
    }, 250), 
    [_updateCurrentTime]
  );

  // Effect for HTML Audio Element setup and event listeners
  useEffect(() => {
    if (currentTrack && audioElementRef.current) {
      console.log('[AudioPlayer] audioElementRef IS current & currentTrack exists, calling setAudioElement.');
      setAudioElement(audioElementRef.current);
      const audio = audioElementRef.current;
      
      const handleTimeUpdate = () => throttledUpdateCurrentTime(audio.currentTime);
      const handleDurationChange = () => _updateDuration(audio.duration);
      const handlePlayEvent = () => { 
        console.log('[AudioPlayer] HTML Audio play event triggered');
        _setPlaying(true);
      };
      const handlePauseEvent = () => _setPlaying(false);
      const htmlAudioReadyLogic = () => {
        console.log('[AudioPlayer] HTML Audio is ready (canplaythrough).');
        _setIsReady(true); 
        // Play intent logic will be moved to a separate effect
      };
      const handleLoadedMetadata = () => {
        console.log('[AudioPlayer] HTML Audio loadedmetadata');
        if (audio.duration !== Infinity && !isNaN(audio.duration)) _updateDuration(audio.duration);
        else _updateDuration(0); // Set duration to 0 if invalid
      };

      // Add more debugging events
      const handleLoadStart = () => console.log('[AudioPlayer] HTML Audio loadstart');
      const handleLoadedData = () => console.log('[AudioPlayer] HTML Audio loadeddata');
      const handleCanPlay = () => console.log('[AudioPlayer] HTML Audio canplay');
      const handleStalled = () => console.log('[AudioPlayer] HTML Audio stalled');
      const handleWaiting = () => console.log('[AudioPlayer] HTML Audio waiting');
      const handleError = (e: any) => console.error('[AudioPlayer] HTML Audio error:', e.target.error);

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('play', handlePlayEvent);
      audio.addEventListener('pause', handlePauseEvent);
      audio.addEventListener('canplaythrough', htmlAudioReadyLogic);
      // Add debugging listeners
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('loadeddata', handleLoadedData);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('stalled', handleStalled);
      audio.addEventListener('waiting', handleWaiting);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('durationchange', handleDurationChange);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('play', handlePlayEvent);
        audio.removeEventListener('pause', handlePauseEvent);
        audio.removeEventListener('canplaythrough', htmlAudioReadyLogic);
        // Remove debugging listeners
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('loadeddata', handleLoadedData);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('stalled', handleStalled);
        audio.removeEventListener('waiting', handleWaiting);
        audio.removeEventListener('error', handleError);
      };
    } else if (currentTrack && !audioElementRef.current) {
      console.warn('[AudioPlayer] currentTrack exists but audioElementRef.current is unexpectedly null.');
    }
  }, [currentTrack?.id, setAudioElement, throttledUpdateCurrentTime, _updateDuration, _setPlaying, _setIsReady]); // Removed currentTrack?.title and playIntentId, play, setPlayIntent dependencies

  // Effect for handling play intent when audio is ready
  useEffect(() => {
    console.log(`[AudioPlayer] Play intent effect triggered. isReady: ${isReady}, playIntentId: ${playIntentId}, hasAudioElement: ${!!audioElementRef.current}, wavesurferReady: ${wavesurferReadyRef.current}`);
    if (isReady && playIntentId && audioElementRef.current && wavesurferReadyRef.current) {
      console.log(`[AudioPlayer] Play intent effect: HTMLAudio Ready, WS Ready & playIntentId (${playIntentId}) is present. Calling play().`);
      play(); // This is from useAudioStore
      setPlayIntent(null); // Consume the intent
    } else {
      console.log(`[AudioPlayer] Play intent effect: Conditions not met for play. isReady: ${isReady}, playIntentId: ${playIntentId}, hasAudio: ${!!audioElementRef.current}, wsReady: ${wavesurferReadyRef.current}`);
    }
  }, [isReady, playIntentId, play, setPlayIntent, wavesurferReadyRef.current]);

  // Effect for loading new track source into HTML Audio Element
  useEffect(() => {
    const audio = audioElementRef.current; 
    console.log(`[AudioPlayer] Track loading effect triggered. currentTrack: ${currentTrack?.id}, audioSrc: ${currentTrack?.audioSrc}`);
    console.log('[AudioPlayer] Full currentTrack object:', currentTrack);
    
    if (currentTrack && currentTrack.audioSrc && audio) {
      console.log('[AudioPlayer] New track detected, loading src into HTML Audio element:', currentTrack.audioSrc);
      console.log('[AudioPlayer] Setting isReady to false and resetting state');
      useAudioStore.getState()._setIsReady(false); 
      audio.currentTime = 0; // Explicitly reset currentTime
      _updateCurrentTime(0); // Reset time in store
      _updateDuration(0);  // Reset duration in store
      audio.src = encodeURI(currentTrack.audioSrc); // Encode the URL
      audio.load(); 
      console.log('[AudioPlayer] Audio element src set and load() called');
    } else if (!currentTrack && audio) {
        console.log('[AudioPlayer] No current track, clearing audio element');
        audio.pause(); 
        audio.src = ''; 
        _updateCurrentTime(0);
        _updateDuration(0);
        _setPlaying(false);
        _setIsReady(false);
    }
  }, [currentTrack?.id, currentTrack?.audioSrc, _updateCurrentTime, _updateDuration, _setPlaying, _setIsReady]);
  
  // Effect for WaveSurfer.js initialization
  useEffect(() => {
    const audio = audioElementRef.current;
    const waveformContainer = waveformContainerRef.current;

    // Only initialize WaveSurfer if the audio element is ready with the current track
    if (audio && waveformContainer && currentTrack?.audioSrc && isReady) {
      console.log(`[AudioPlayer] Initializing WaveSurfer for track ${currentTrack.id} because audio is ready.`);
      wavesurferReadyRef.current = false; // Reset for new instance
      
      // Destroy existing instance if any (e.g., if isReady flickered or an old instance persisted)
      if (wavesurferInstanceRef.current) {
        console.log('[AudioPlayer] Destroying pre-existing WaveSurfer instance before creating new one.');
        wavesurferInstanceRef.current.destroy();
        wavesurferInstanceRef.current = null;
        regionsPluginRef.current = null; 
      }

      console.log('[AudioPlayer] Initializing WaveSurfer and RegionsPlugin.');
      // Create RegionsPlugin instance first
      const regions = RegionsPlugin.create();
      regionsPluginRef.current = regions;

      const ws = WaveSurfer.create({
        container: waveformContainer,
        waveColor: 'rgb(96, 165, 250)',
        progressColor: 'rgb(245, 158, 11)',
        height: 30,
        cursorWidth: 0,
        media: audio,
        normalize: true,
        plugins: [regions] // Pass the instance
      });

      wavesurferInstanceRef.current = ws;
      setWaveSurferInstance(ws);

      // Event listener for region clicks (Hot Cues) - on the plugin instance
      regions.on('region-clicked', (region: Region, e: MouseEvent) => {
        e.stopPropagation(); 
        console.log(`[AudioPlayer] Hot Cue clicked: ${region.id}, seeking to ${region.start}`);
        if (audioElementRef.current) {
          audioElementRef.current.currentTime = region.start;
        }
      });

      const handleWaveformClick = (progress: number) => {
        if (audio && duration > 0 && !isNaN(duration)) {
          const seekTime = progress * duration;
          console.log(`[AudioPlayer] Waveform clicked: progress=${progress}, seekTime=${seekTime}`);
          audio.currentTime = seekTime;
          _updateCurrentTime(seekTime);
        }
      };

      ws.on('click', handleWaveformClick);

      ws.on('ready', () => {
        console.log('[AudioPlayer] WaveSurfer is ready.');
        const wsDuration = ws.getDuration();
        if (wsDuration > 0) {
            console.log(`[AudioPlayer] WaveSurfer reported duration: ${wsDuration}`);
            _updateDuration(wsDuration); // Prioritize WaveSurfer's duration (Point 5)
        }
        wavesurferReadyRef.current = true; // (Point 4)
        // Hot cues will be loaded based on the store's duration, which is now updated
      });
      ws.on('error', (err) => {
        console.error('[AudioPlayer] WaveSurfer error:', err);
        wavesurferReadyRef.current = false; // Ensure it's false on error too
      });

      return () => {
        console.log('[AudioPlayer] Destroying WaveSurfer instance.');
        if (ws && typeof ws.destroy === 'function') {
            ws.destroy();
        }
        wavesurferInstanceRef.current = null;
        setWaveSurferInstance(null);
        wavesurferReadyRef.current = false; // Reset on cleanup (Point 4)
      };
    } else if (wavesurferInstanceRef.current && !currentTrack) {
      // If no track, destroy WaveSurfer
      console.log('[AudioPlayer] No current track, destroying WaveSurfer instance.');
      if (wavesurferInstanceRef.current && typeof wavesurferInstanceRef.current.destroy === 'function') {
          wavesurferInstanceRef.current.destroy();
      }
      wavesurferInstanceRef.current = null;
      setWaveSurferInstance(null);
      wavesurferReadyRef.current = false; // Reset if no track (Point 4)
    }
  }, [currentTrack?.id, currentTrack?.audioSrc, isReady, _updateCurrentTime, _updateDuration, setWaveSurferInstance]); // Added isReady to dependencies

  // Effect for loading Hot Cues
  useEffect(() => {
    const wsInstance = wavesurferInstanceRef.current;
    const regions = regionsPluginRef.current;

    // Ensure duration is valid and WaveSurfer is ready
    if (wsInstance && regions && currentTrack?.audioSrc && duration > 0) {
      console.log(`[AudioPlayer] Attempting to load Hot Cues. Version: ${hotCueDataVersion}, Duration: ${duration}`);
      regions.clearRegions();
      const newLabels: HotCueLabel[] = [];

      const audioSrcParts = currentTrack.audioSrc.split('/');
      const fileName = audioSrcParts[audioSrcParts.length - 1];
      
      const cues = hotCueService.getHotCues(fileName);

      if (cues && cues.length > 0) {
        console.log(`[AudioPlayer] Loading ${cues.length} Hot Cues for ${fileName} from service`);
        cues.forEach((cue: HotCue) => {
          const r = parseInt(cue.color.slice(1, 3), 16);
          const g = parseInt(cue.color.slice(3, 5), 16);
          const b = parseInt(cue.color.slice(5, 7), 16);
          const rgbaColor = `rgba(${r}, ${g}, ${b}, 0.3)`;

          regions.addRegion({
            id: cue.label,
            start: cue.time,
            end: cue.time + 0.05, 
            color: rgbaColor,
            drag: false,
            resize: false,
          });

          newLabels.push({
            id: cue.label,
            label: cue.label,
            time: cue.time,
            color: cue.color,
            leftPosition: `${(cue.time / duration) * 100}%` // Use store's duration
          });
        });
        setHotCueLabels(newLabels);
      } else {
        console.log(`[AudioPlayer] No Hot Cues found for ${fileName} in service`);
        setHotCueLabels([]);
      }
    } else if (regions && !currentTrack) {
      regions.clearRegions();
      setHotCueLabels([]);
    } else if (wsInstance && regions && currentTrack?.audioSrc && duration === 0) {
        console.log("[AudioPlayer] Waiting for duration to load hot cues...");
    }
  }, [currentTrack?.id, duration, hotCueDataVersion]); // Depend on track, duration, and data version

  // Subscription to hotCueService changes
  useEffect(() => {
    console.log('[AudioPlayer] Subscribing to hotCueService changes.');
    const unsubscribe = hotCueService.subscribe(() => {
      console.log('[AudioPlayer] HotCueService data changed notification received. Incrementing version.');
      setHotCueDataVersion(prevVersion => prevVersion + 1);
    });
    return () => {
      console.log('[AudioPlayer] Unsubscribing from hotCueService changes.');
      unsubscribe();
    };
  }, []); // Empty dependency array: subscribe once on mount, unsubscribe on unmount

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(event.target.value));
  };

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-500 flex items-center justify-center px-4 py-2 z-[9999] border-t border-slate-700 h-14">
        No track selected.
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white flex items-center px-3 py-2 z-[9999] border-t border-slate-700 h-auto sm:h-14 shadow-2xl space-x-3">
      <audio ref={audioElementRef} preload="metadata" />

      {/* Player Controls */}
      <div className="flex items-center space-x-1">
        <button 
          className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
          aria-label="Previous track"
          // onClick={() => console.log("Previous track")} // Placeholder
        >
          <SkipBack size={18} />
        </button>
        <button 
          onClick={togglePlayPause} 
          disabled={!isReady}
          className="p-2 bg-amber-500 hover:bg-amber-400 rounded-full text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>}
        </button>
        <button 
          className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
          aria-label="Next track"
          // onClick={() => console.log("Next track")} // Placeholder
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Song Info */}
      <div className="flex items-center overflow-hidden sm:min-w-[150px] sm:max-w-[250px] flex-shrink-0">
        {/* Optional: Keep image if desired, though not prominent in new design */}
        {/* {currentTrack.imageUrl ? (
          <img src={currentTrack.imageUrl} alt={currentTrack.title} className="w-8 h-8 rounded object-cover mr-2" />
        ) : (
          <div className="w-8 h-8 rounded bg-slate-700 mr-2 flex items-center justify-center">
            <Play size={18} className="text-slate-500" />
          </div>
        )} */}
        <div className="overflow-hidden">
          <p
            className="text-xs font-medium truncate cursor-pointer hover:underline text-blue-300"
            title={currentTrack.title}
            onClick={() => navigate(`/track/${currentTrack.id}`)}
            tabIndex={0}
            role="button"
            aria-label={`Go to details for ${currentTrack.title}`}
          >
            {currentTrack.title}
          </p>
          <p
            className="text-[11px] text-slate-400 truncate"
            title={currentTrack.artist}
          >
            {currentTrack.artist.split(',').map((artistName, idx, arr) => {
              const trimmed = artistName.trim();
              return (
                <span key={trimmed}>
                  <span
                    className="hover:underline cursor-pointer"
                    onClick={() => navigate(`/artist/${encodeURIComponent(trimmed)}`)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Go to artist page for ${trimmed}`}
                  >
                    {trimmed}
                  </span>
                  {idx < arr.length - 1 && ', '}
                </span>
              );
            })}
          </p>
        </div>
      </div>
      
      {/* Download and Action Buttons */}
      <div className="flex items-center space-x-1">
        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white flex items-center text-xs" title="Download MP3">
            <Download size={14} className="mr-1"/> MP3
        </button>
        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white flex items-center text-xs" title="Download WAV">
            <Download size={14} className="mr-1"/> WAV
        </button>
        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Add to list">
            <ListPlus size={16}/>
        </button>
      </div>

      {/* Waveform */}
      <div
        ref={waveformContainerRef}
        className="flex-grow h-[30px] cursor-pointer relative overflow-hidden group mx-2" // Added mx-2 for some spacing
      >
        {/* Render Hot Cue Labels */}
        {hotCueLabels.map((label) => (
          <div
            key={label.id}
            className="absolute bottom-1 transform -translate-x-1/2 px-1.5 py-0.5 rounded-sm text-[9px] font-bold leading-none shadow-md cursor-pointer hover:scale-110 transition-transform select-none"
            style={{
              left: label.leftPosition,
              backgroundColor: label.color,
              color: 'white', 
              zIndex: 20, 
            }}
            onClick={() => {
              if (audioElementRef.current) {
                audioElementRef.current.currentTime = label.time;
                _updateCurrentTime(label.time); 
              }
            }}
            title={`Cue ${label.label} (${formatTime(label.time)})`}
          >
            {label.label}
          </div>
        ))}
      </div>
      
      {/* Time Display */}
      <div className="flex items-center text-xs font-mono text-slate-400 w-20 justify-center">
        <span>{formatTime(currentTime)}</span>
        <span className="mx-0.5">/</span>
        <span>{formatTime(duration)}</span>
      </div>
      
      {/* Volume Control */}
      <div className="flex items-center justify-end">
        <div className="flex items-center">
          <button 
            onClick={() => setVolume(volume > 0 ? 0 : 0.5)} // Simple toggle mute/unmute logic
            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white mr-1"
            aria-label={volume === 0 ? "Unmute" : "Mute"}
          >
            {volume === 0 ? 
              <VolumeX size={18} /> : 
              <Volume2 size={18} />
            }
          </button>
          <input 
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-amber-500 range-xs"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer; 