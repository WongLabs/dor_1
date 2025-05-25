import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformVisualizerProps {
  audioUrl: string;
  color?: string;
  height?: number;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioUrl,
  color = '#00A3FF',
  height = 80,
  onReady,
  onPlay,
  onPause
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: color,
      progressColor: color,
      height: height,
      cursorWidth: 1,
      cursorColor: '#fff',
      normalize: true,
      fillParent: true,
      minPxPerSec: 1,
      interact: true,
      hideScrollbar: true,
      autoCenter: true,
    });

    wavesurfer.load(audioUrl);

    wavesurfer.on('ready', () => {
      onReady?.();
    });

    wavesurfer.on('play', () => {
      onPlay?.();
    });

    wavesurfer.on('pause', () => {
      onPause?.();
    });

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl, color, height, onReady, onPlay, onPause]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full" />
      <button
        onClick={handlePlayPause}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 btn btn-circle btn-sm btn-primary"
      >
        ▶️
      </button>
    </div>
  );
};

export default WaveformVisualizer; 