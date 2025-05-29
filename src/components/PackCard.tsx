import React, { useState } from 'react';
import { Play as PlayIconLucide, Pause as PauseIconLucide, Download as DownloadIcon, CalendarDays, ListMusic } from 'lucide-react';

export interface TrackInPack { // New interface for tracks within a pack
  id: string;
  title: string;
  artist: string;
  audioSrc: string;
  imageUrl?: string; // Keep for consistency if needed elsewhere, though not directly used in this list item
}

export interface PackCardType {
  id: string;
  name: string;
  trackCount: number;
  imageUrl?: string;
  lastUpdated?: string;
  tracks?: TrackInPack[]; // Added tracks array
}

interface PackCardProps {
  pack: PackCardType;
  onClick?: (packId: string, hasTracks: boolean) => void; // Modified onClick
  onPlayTrack?: (track: TrackInPack) => void; // Added for playing tracks
  onDownloadPack?: (packId: string) => void; // New: for download button
  // Optional: to manage which track is playing for styling the play/pause button
  currentPlayingTrackId?: string | null;
  isCurrentlyPlaying?: boolean;
}

const PackCard: React.FC<PackCardProps> = ({ pack, onClick, onPlayTrack, onDownloadPack, currentPlayingTrackId, isCurrentlyPlaying }) => {
  const [showTracks, setShowTracks] = useState(false);

  const handleCardClick = () => {
    if (pack.tracks && pack.tracks.length > 0) {
      setShowTracks(!showTracks);
    }
    // Notify parent about the click, and whether tracks were shown/hidden
    // This allows the parent to decide if navigation should still occur or not
    onClick?.(pack.id, pack.tracks && pack.tracks.length > 0 ? !showTracks : false);
  };
  
  const handleTrackPlay = (e: React.MouseEvent, track: TrackInPack) => {
    e.stopPropagation(); // Prevent card click event when clicking play
    onPlayTrack?.(track);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    onDownloadPack?.(pack.id);
    console.log('Download pack:', pack.id); // Placeholder action
  };

  return (
    <div
      key={pack.id}
      className={`bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors flex flex-col justify-between cursor-pointer aspect-square`}
      // p-4 to p-3 to match reference more closely if needed, or adjust padding inside
    >
      <div className="relative w-full h-32 mb-3"> {/* Make this div relative for positioning download button & ensure consistent height for image/tracklist area */}
        {showTracks && pack.tracks && pack.tracks.length > 0 ? (
          <div className="absolute inset-0 overflow-y-auto pr-1"> {/* Use absolute to fill parent, adjust pr for scrollbar */}
            {pack.tracks.map((track) => (
              <div key={track.id} className="flex items-center justify-between py-1 border-b border-gray-700 last:border-b-0">
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-medium truncate" title={track.title}>{track.title}</p>
                  <p className="text-xxs text-gray-400 truncate" title={track.artist}>{track.artist}</p> {/* Adjusted text size */}
                </div>
                {onPlayTrack && (
                  <button 
                    onClick={(e) => handleTrackPlay(e, track)} 
                    className="p-1 text-gray-300 hover:text-white rounded-full hover:bg-gray-600 flex-shrink-0"
                    aria-label={currentPlayingTrackId === track.id && isCurrentlyPlaying ? "Pause" : "Play"}
                  >
                    {currentPlayingTrackId === track.id && isCurrentlyPlaying ? (
                      <PauseIconLucide size={16} />
                    ) : (
                      <PlayIconLucide size={16} />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Image container
          <div className="absolute inset-0" onClick={handleCardClick}>
            {pack.imageUrl ? (
              <img 
                src={pack.imageUrl} 
                alt={pack.name} 
                className="w-full h-full object-cover rounded-md" 
              />
            ) : (
              <div className="w-full h-full bg-gray-700 rounded-md"></div>
            )}
          </div>
        )}
      </div>
      
      {/* Clickable text area for pack name and metadata - this part also toggles the track list */}
      <div onClick={handleCardClick} className="min-h-[3.5rem] flex flex-col justify-between">
        <div>
            <h3 className="font-semibold text-sm line-clamp-2 mb-1" title={pack.name}>{pack.name}</h3>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400"> {/* justify-between to push download to right */}
          <div className="flex items-center space-x-2"> {/* Group date and track count */}
            {pack.lastUpdated && (
                <span className="flex items-center">
                    <CalendarDays size={12} className="mr-0.5 text-gray-500" /> {/* Reduced margin */}
                    {pack.lastUpdated}
                </span>
            )}
            <span className="flex items-center">
                <ListMusic size={12} className="mr-0.5 text-gray-500" /> {/* Reduced margin */}
                {pack.trackCount}
            </span>
          </div>
          {/* Download Button - MOVED HERE */}
          {onDownloadPack && (
            <button 
              onClick={handleDownloadClick}
              className="bg-black bg-opacity-20 hover:bg-opacity-40 text-white p-1.5 rounded-full transition-colors flex-shrink-0" // Adjusted styling
              aria-label="Download pack"
            >
              <DownloadIcon size={14} /> {/* Adjusted size */}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackCard; 