import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformVisualizerProps {
  audioUrl: string;
  color?: string;
  height?: number;
  currentTime?: number;
  duration?: number;
  onReady?: () => void;
  onSeek?: (time: number) => void;
  isPlaying?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, time: number) => void;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioUrl,
  color = '#00A3FF',
  height = 80,
  currentTime,
  duration,
  onReady,
  onSeek,
  isPlaying,
  onDragOver,
  onDrop
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const internalSyncRef = useRef(false); // For preventing seek feedback loops
  const [isWaveLoading, setIsWaveLoading] = useState(true);

  useEffect(() => {
    if (!audioUrl || !containerRef.current) {
      // If no audioUrl or container, clean up existing instance if any and return
      if (wavesurferRef.current) {
        console.log('[WaveformVisualizer] No audioUrl or container, destroying existing WaveSurfer instance.');
        try {
          wavesurferRef.current.unAll();
          wavesurferRef.current.destroy();
        } catch (err) {
          console.warn('WaveSurfer destroy failed during cleanup (no audioUrl/container)', err);
        }
        wavesurferRef.current = null;
      }
      setIsWaveLoading(false);
      return;
    }

    setIsWaveLoading(true);
    console.log('[WaveformVisualizer] Creating new WaveSurfer instance for audioUrl:', audioUrl);

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: color,
      progressColor: `rgba(${parseInt(color.slice(1, 3), 16)},${parseInt(color.slice(3, 5), 16)},${parseInt(color.slice(5, 7), 16)},0.5)`,
      height: height,
      cursorWidth: 1,
      cursorColor: '#fff',
      normalize: true,
      fillParent: true,
      minPxPerSec: 1,
      interact: !!onSeek, // Only allow interaction if onSeek is provided
      hideScrollbar: true,
      autoCenter: true,
    });

    wavesurferRef.current = wavesurfer;
    wavesurfer.load(audioUrl);

    wavesurfer.on('ready', () => {
      console.log('[WaveformVisualizer] WaveSurfer ready for:', audioUrl);
      setIsWaveLoading(false);
      onReady?.();
      // Initial seek if currentTime and duration are provided
      if (currentTime !== undefined && wavesurfer.getDuration() > 0) {
        const wsDuration = wavesurfer.getDuration();
        internalSyncRef.current = true;
        const initialProgress = Math.min(1, Math.max(0, currentTime / wsDuration));
        wavesurfer.seekTo(initialProgress);
        requestAnimationFrame(() => { internalSyncRef.current = false; });
      }
    });

    wavesurfer.on('error', (err) => {
      console.error('[WaveformVisualizer] WaveSurfer error:', err, 'for audioUrl:', audioUrl);
      setIsWaveLoading(false);
    });

    if (onSeek) {
      const handleInteraction = () => {
        if (internalSyncRef.current || !wavesurferRef.current) return;
        const newTime = wavesurferRef.current.getCurrentTime();
        onSeek(newTime);
      };
      wavesurfer.on('interaction', handleInteraction);
    }

    return () => {
      if (wavesurferRef.current) {
        console.log('[WaveformVisualizer] Destroying WaveSurfer instance for audioUrl:', audioUrl);
        try {
          wavesurferRef.current.unAll();
          wavesurferRef.current.destroy();
        } catch (err) {
          console.warn('WaveSurfer destroy failed on cleanup for:', audioUrl, err);
        }
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, color, height, onReady, onSeek]); // Key dependencies that require re-creating WaveSurfer

  // Effect for synchronizing currentTime from props
  useEffect(() => {
    if (wavesurferRef.current && wavesurferRef.current.getDuration() > 0 && currentTime !== undefined) {
      const currentWsTime = wavesurferRef.current.getCurrentTime();
      const wsDuration = wavesurferRef.current.getDuration();

      // Check if seeking is necessary (more than a small threshold and not internally syncing)
      if (Math.abs(currentWsTime - currentTime) > 0.1 && !internalSyncRef.current && wsDuration > 0) {
        internalSyncRef.current = true;
        const progress = Math.min(1, Math.max(0, currentTime / wsDuration));
        //console.log(`[WaveformVisualizer] Syncing currentTime from props: ${currentTime}, WS time: ${currentWsTime}, Progress: ${progress}`);
        wavesurferRef.current.seekTo(progress);
        requestAnimationFrame(() => { internalSyncRef.current = false; });
      }
    } else if (wavesurferRef.current && currentTime === 0 && wavesurferRef.current.getCurrentTime() !== 0 && !internalSyncRef.current) {
        // Special case: if prop currentTime is 0 and WS isn't, seek to 0
        internalSyncRef.current = true;
        wavesurferRef.current.seekTo(0);
        requestAnimationFrame(() => { internalSyncRef.current = false; });
    }
  }, [currentTime]); // Removed 'duration' from deps, as wsDuration is read directly. Re-eval on currentTime.

  // Effect for reflecting global play/pause state (visual only, no playback control here)
  useEffect(() => {
    // This component does not control play/pause, only reflects.
    // If you need visual feedback for isPlaying (e.g., different color), implement here.
    // Example: wavesurferRef.current?.setWaveColor(isPlaying ? 'playingColor' : color);
  }, [isPlaying, color]); // Include color if it's part of the playing state visual change

  // Handle drag and drop events
  const handleContainerDragOver = useCallback((e: React.DragEvent) => {
    onDragOver?.(e);
  }, [onDragOver]);

  const handleContainerDrop = useCallback((e: React.DragEvent) => {
    if (onDrop && wavesurferRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const containerWidth = rect.width;
      const progress = x / containerWidth;
      const waveformDuration = wavesurferRef.current.getDuration();
      const dropTime = progress * waveformDuration;
      onDrop(e, dropTime);
    }
  }, [onDrop]);

  return (
    <div 
      style={{ height: `${height}px` }} 
      className="w-full waveform-container relative bg-gray-800 rounded overflow-hidden"
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
    >
      {isWaveLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center text-xs text-gray-400"
          style={{ height: `${height}px` }}
        >
          Loading waveform...
        </div>
      )}
      <div ref={containerRef} className="w-full" style={{ opacity: isWaveLoading ? 0 : 1 }} />
    </div>
  );
};

export default WaveformVisualizer; 