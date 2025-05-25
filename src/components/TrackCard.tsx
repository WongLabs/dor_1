import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, ListPlus, Download, Info as InfoIcon } from 'lucide-react';

export interface TrackCardType {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  mood: string;
  genre: string;
  duration: string;
  downloadUrls: {
    mp3: string;
    wav: string;
  };
  audioSrc: string;
  imageUrl?: string;
  releaseDate: string;
}

interface TrackCardProps {
  track: TrackCardType;
  onPlay: (track: TrackCardType) => void;
  onAddToPlaylist: (id: string) => void;
  isPlaying: boolean;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, onPlay, onAddToPlaylist, isPlaying }) => {
  const moodColorClasses: Record<string, string> = {
    Energetic: 'bg-red-500 text-white',
    Happy: 'bg-yellow-500 text-gray-900',
    Chilled: 'bg-blue-500 text-white',
    Dark: 'bg-purple-600 text-white',
    Uplifting: 'bg-green-500 text-white',
    default: 'bg-gray-600 text-gray-200',
  };

  const getMoodClass = (mood: string) => {
    return moodColorClasses[mood] || moodColorClasses.default;
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg shadow-lg flex flex-col justify-between h-full hover:bg-slate-700 transition-colors duration-150">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-grow min-w-0 mr-3">
          <Link to={`/track/${track.id}`} className="block hover:text-amber-400 transition-colors">
            <h3 className="text-base font-semibold text-white truncate" title={track.title}>{track.title}</h3>
          </Link>
          <p className="text-sm text-slate-400 truncate" title={track.artist}>{track.artist}</p>
        </div>
        <div className="flex items-center flex-shrink-0 space-x-2">
          <button
            onClick={() => onPlay(track)}
            className={`p-2.5 rounded-full transition-colors ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-amber-400 hover:bg-amber-500'} text-slate-900`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button
            onClick={() => onAddToPlaylist(track.id)}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"
            aria-label="Add to playlist"
          >
            <ListPlus size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        <span className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded-full font-medium">
          {track.bpm} BPM
        </span>
        <span className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded-full font-medium">
          {track.key}
        </span>
        <span className={`px-2.5 py-1 rounded-full font-medium ${getMoodClass(track.mood)}`}>
          {track.mood}
        </span>
        <span className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded-full font-medium">
          {track.genre}
        </span>
      </div>
      
      <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
        <span className="text-sm text-slate-400 font-medium">{track.duration}</span>
        <div className="flex items-center space-x-2">
          <a 
            href={track.downloadUrls.mp3} 
            download 
            className="text-xs font-medium text-slate-400 hover:text-amber-400 transition-colors p-1.5 hover:bg-slate-700 rounded-md"
            aria-label="Download MP3"
          >
            MP3
          </a>
          <a 
            href={track.downloadUrls.wav} 
            download 
            className="text-xs font-medium text-slate-400 hover:text-amber-400 transition-colors p-1.5 hover:bg-slate-700 rounded-md"
            aria-label="Download WAV"
          >
            WAV
          </a>
          <Link 
            to={`/track/${track.id}`} 
            className="text-xs font-medium text-slate-400 hover:text-amber-400 transition-colors p-1.5 hover:bg-slate-700 rounded-md"
            aria-label="Track Info"
          >
            Info
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrackCard; 