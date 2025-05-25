import React from 'react';
import { Play, Pause, Download, ListPlus, Info } from 'lucide-react';
import { PageHomeTrack } from '../pages/PackDetailPage'; // Assuming PageHomeTrack is defined here

interface PlaylistTrackListItemProps {
  track: PageHomeTrack;
  index: number;
  isPlaying: boolean;
  onPlayPauseClick: (track: PageHomeTrack) => void;
  onDownloadClick?: (track: PageHomeTrack, format: 'mp3' | 'wav') => void; // Optional
  onAddToPlaylistClick?: (trackId: string) => void; // Optional
  onInfoClick?: (trackId: string) => void; // Optional
}

const PlaylistTrackListItem: React.FC<PlaylistTrackListItemProps> = ({
  track,
  index,
  isPlaying,
  onPlayPauseClick,
  onDownloadClick,
  onAddToPlaylistClick,
  onInfoClick
}) => {
  const releaseYear = track.releaseDate ? new Date(track.releaseDate).getFullYear() : 'N/A';
  const moodColor = 
    track.mood === 'Uplifting' ? 'bg-purple-500' :
    track.mood === 'Sexy' ? 'bg-pink-500' :
    track.mood === 'Happy' ? 'bg-yellow-500' :
    track.mood === 'Energetic' ? 'bg-orange-500' :
    'bg-gray-500';

  return (
    <div className="flex items-center gap-3 p-2.5 hover:bg-gray-800 rounded-md text-sm text-gray-300">
      <div className="w-6 text-center text-gray-400">{index + 1}</div>
      <button 
        onClick={() => onPlayPauseClick(track)}
        className="p-1.5 rounded-full hover:bg-gray-700 focus:outline-none"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <div className="flex-grow min-w-0">
        <div className="flex items-center">
            <p className="font-medium text-white truncate group-hover:underline">{track.title}</p>
            {onInfoClick && (
                <button onClick={() => onInfoClick(track.id)} className="ml-1.5 text-gray-500 hover:text-white">
                    <Info size={14}/>
                </button>
            )}
        </div>
        <p className="text-xs text-gray-400 truncate">{track.artist}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
        {onDownloadClick && (
          <>
            <button onClick={() => onDownloadClick(track, 'mp3')} className="p-1.5 hover:bg-gray-700 rounded-full">
              <Download size={16} /> 
              <span className='text-xs'>MP3</span>
            </button>
            <button onClick={() => onDownloadClick(track, 'wav')} className="p-1.5 hover:bg-gray-700 rounded-full">
              <Download size={16} />
              <span className='text-xs'>WAV</span>
            </button>
          </>
        )}
        {onAddToPlaylistClick && (
          <button onClick={() => onAddToPlaylistClick(track.id)} className="p-1.5 hover:bg-gray-700 rounded-full">
            <ListPlus size={16} />
            <span className='text-xs'>Add</span>
          </button>
        )}
      </div>
      <div className="w-8 text-center">{track.bpm}</div>
      <div className="w-8 text-center">{track.key}</div>
      <div className="w-36 truncate text-xs px-2 text-center">{track.genre}</div>
      <div className={`w-20 px-2 py-0.5 text-xs rounded-full text-white text-center ${moodColor}`}>
        {track.mood}
      </div>
      <div className="w-16 text-center text-xs">{releaseYear}</div>
    </div>
  );
};

export default PlaylistTrackListItem; 