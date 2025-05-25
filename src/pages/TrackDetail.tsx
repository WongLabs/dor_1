import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import tracks from '../data/packs.json';
import WaveformVisualizer from '../components/WaveformVisualizer';
import MoodRadarChart from '../components/MoodRadarChart';

// Types
interface StemTrack {
  name: string;
  waveform: string;
  color: string;
  audioUrl: string;
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

interface TrackDetail {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  genre: string;
  releaseDate: string;
  waveform: string;
  audioUrl: string;
  stems: StemTrack[];
  moodClusters: MoodCluster[];
  moodProbabilities: MoodProbability[];
  danceability: number;
  voiceInstrumentalRatio: number;
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

const TrackDetail = () => {
  const { id } = useParams();
  const [track, setTrack] = useState<TrackDetail | null>(null);
  const [relatedTracks, setRelatedTracks] = useState<RelatedTrack[]>([]);

  useEffect(() => {
    // Simulated data
    setTrack({
      id: '1',
      title: 'Needed Me (Extended Mix)',
      artist: 'Olly James',
      bpm: 145,
      key: 'Am',
      genre: 'Trance',
      releaseDate: '2025',
      waveform: '/waveforms/main.json',
      audioUrl: '/audio/main.mp3',
      stems: [
        { 
          name: 'Bass', 
          waveform: '/waveforms/bass.json', 
          color: '#FF8A00',
          audioUrl: '/audio/bass.mp3'
        },
        { 
          name: 'Drums', 
          waveform: '/waveforms/drums.json', 
          color: '#00A3FF',
          audioUrl: '/audio/drums.mp3'
        },
        { 
          name: 'Autre', 
          waveform: '/waveforms/other.json', 
          color: '#FFD600',
          audioUrl: '/audio/other.mp3'
        },
        { 
          name: 'Vocals', 
          waveform: '/waveforms/vocals.json', 
          color: '#FF2D55',
          audioUrl: '/audio/vocals.mp3'
        }
      ],
      moodProbabilities: [
        { label: 'Energetic', value: 0.8, color: '#4A90E2' },
        { label: 'Happy', value: 0.6, color: '#4A90E2' },
        { label: 'Relaxed', value: 0.4, color: '#4A90E2' },
        { label: 'Dark', value: 0.3, color: '#4A90E2' },
        { label: 'Romantic', value: 0.2, color: '#4A90E2' }
      ],
      moodClusters: [
        {
          name: 'Cluster 1',
          moods: ['passionate', 'rousing', 'confident', 'boisterous']
        },
        {
          name: 'Cluster 2',
          moods: ['rollicking', 'cheerful', 'fun', 'sweet']
        },
        {
          name: 'Cluster 3',
          moods: ['aggressive', 'fiery', 'intense']
        }
      ],
      danceability: 0.99,
      voiceInstrumentalRatio: 0.83
    });

    // Simulated related tracks
    setRelatedTracks([
      {
        id: '2',
        title: 'In The Dark (Extended Mix)',
        artist: 'Olly James',
        bpm: 145,
        key: '11A',
        genre: 'Trance',
        mood: 'Energetic',
        releaseDate: '2025'
      },
      // Add more related tracks...
    ]);
  }, [id]);

  if (!track) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <header className="bg-[#1A1A1A] border-b border-[#2A2A2A] p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <img src="/logo.png" alt="Fuvi Clan" className="h-8" />
          <nav className="flex gap-6 text-gray-300">
            <a href="/music">Music</a>
            <a href="/blog">Blog</a>
            <a href="/help">Help</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-[1fr_300px] gap-6">
        <div>
          {/* Track Info */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[#FF8A00]">{track.bpm}kHz</span>
              <h1 className="text-2xl font-bold text-white">{track.title}</h1>
              <span className="px-3 py-1 bg-[#2A2A2A] rounded-full text-sm">
                {track.genre}
              </span>
            </div>

            {/* Main Waveform */}
            <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6">
              <WaveformVisualizer
                audioUrl={track.audioUrl}
                color="#4A90E2"
                height={120}
              />
            </div>

            {/* Stem Tracks */}
            <div className="space-y-4">
              {track.stems.map((stem) => (
                <div key={stem.name} className="bg-[#1A1A1A] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: stem.color }}>{stem.name}</span>
                    <div className="flex gap-2">
                      <button className="p-2 bg-[#2A2A2A] rounded-full">
                        <PlayIcon size={16} />
                      </button>
                      <button className="p-2 bg-[#2A2A2A] rounded-full">
                        <MuteIcon size={16} />
                      </button>
                    </div>
                  </div>
                  <WaveformVisualizer
                    audioUrl={stem.audioUrl}
                    color={stem.color}
                    height={40}
                  />
                </div>
              ))}
            </div>

            {/* Artist Info */}
            <div className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-lg mt-6">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${track.artist}`}
                alt={track.artist}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h3 className="font-medium text-white">{track.artist}</h3>
                <p className="text-sm text-gray-400">View Profile</p>
              </div>
            </div>

            {/* Analytics */}
            <div className="grid grid-cols-2 gap-6 mt-6">
              {/* Mood Probability */}
              <div className="bg-[#1A1A1A] rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">
                  Mood Probability
                </h3>
                <div className="h-[300px]">
                  <MoodRadarChart moodProbabilities={track.moodProbabilities} />
                </div>
              </div>

              {/* Audio Analysis */}
              <div className="bg-[#1A1A1A] rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-6">
                  Audio Analysis
                </h3>
                <div className="space-y-6">
                  <MetricBar
                    label="Danceability"
                    value={track.danceability}
                    color="#4A90E2"
                  />
                  <MetricBar
                    label="Voice vs Instrumental"
                    value={track.voiceInstrumentalRatio}
                    color="#4A90E2"
                  />
                </div>

                {/* Clusters */}
                <div className="mt-8">
                  <div className="flex justify-between mb-4 text-white">
                    <h4>Clusters</h4>
                    <h4>Moods</h4>
                  </div>
                  {track.moodClusters.map((cluster, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm text-gray-400 mb-3"
                    >
                      <span>{cluster.name}</span>
                      <span className="text-right flex-1 ml-8">
                        {cluster.moods.join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
                        {track.bpm} BPM • {track.key} • {track.genre}
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

const MetricBar = ({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div>
    <div className="flex justify-between text-sm mb-2">
      <span className="text-white">{label}</span>
      <span className="text-gray-400">{Math.round(value * 100)}%</span>
    </div>
    <div className="h-1.5 bg-[#2A2A2A] rounded-full">
      <div
        className="h-full rounded-full"
        style={{
          width: `${value * 100}%`,
          backgroundColor: color
        }}
      />
    </div>
  </div>
);

const PlayIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const MuteIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

const AddIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

export default TrackDetail; 