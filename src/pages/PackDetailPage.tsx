import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import playlistsData from '../data/playlists.json';
import tracksData from '../data/packs.json';
import { TrackCardType } from '../components/TrackCard'; // Keep this for PageHomeTrack
import PlaylistTrackListItem from '../components/PlaylistTrackListItem';
import useAudioStore from '../stores/audioStore';
import { Download } from 'lucide-react';

export interface PageHomeTrack extends TrackCardType {
  // Add any pack-specific track properties if needed in the future
  // For now, it inherits all from TrackCardType
  // and we add releaseDate directly if not already in TrackCardType
  releaseDate: string; 
}

const PackDetailPage: React.FC = () => {
  const { packId } = useParams<{ packId: string }>();
  const { loadTrack, currentTrack: globalCurrentTrack, isPlaying, togglePlayPause, setPlayIntent } = useAudioStore();
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());

  const packDetails = useMemo(() => {
    const foundPlaylist = playlistsData.playlists.find(p => p.id === packId);
    if (foundPlaylist) {
      return {
        ...foundPlaylist,
        // Ensure description is treated as the main title for the playlist page
        title: foundPlaylist.description || foundPlaylist.name, 
        lastUpdated: (foundPlaylist as any).lastUpdated || new Date().toLocaleDateString(),
        imageUrl: `https://picsum.photos/seed/${foundPlaylist.id}/200/200` // Default image
      };
    }
    return undefined;
  }, [packId]);

  const packTracks: PageHomeTrack[] = useMemo(() => {
    if (!packDetails) return [];
    return packDetails.trackIds.map(trackId => {
      const track = tracksData.tracks.find(t => t.id === trackId);
      if (!track) return null;
      return {
        id: track.id,
        title: track.title,
        artist: track.artist,
        bpm: track.bpm || 120,
        key: track.key || 'N/A',
        mood: track.mood || 'Unknown',
        genre: track.genre || 'Unknown',
        releaseDate: track.releaseDate || new Date().toISOString(),
        duration: track.duration || '3:00',
        downloadUrls: track.downloadUrls || {
          mp3: `/audio/${track.title.replace(/\s+/g, '-').toLowerCase()}_placeholder.mp3`,
          wav: `/audio/${track.title.replace(/\s+/g, '-').toLowerCase()}_placeholder.wav`,
        },
        audioSrc: track.audioSrc || `/audio/${track.title.replace(/\s+/g, '-').toLowerCase()}.mp3`,
        imageUrl: track.imageUrl || `https://picsum.photos/seed/${track.id}/100/100`,
      };
    }).filter(track => track !== null) as PageHomeTrack[];
  }, [packDetails]);

  const handlePlayPauseTrack = (track: PageHomeTrack) => {
    if (globalCurrentTrack?.id === track.id && globalCurrentTrack?.audioSrc === track.audioSrc) {
      togglePlayPause();
    } else {
      loadTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        audioSrc: track.audioSrc,
        imageUrl: track.imageUrl,
      });
      setPlayIntent(Date.now().toString());
    }
  };

  const handleAddToPlaylist = (trackId: string) => {
    console.log('Add to playlist clicked for track:', trackId);
  };
  
  const handleDownloadTrack = (track: PageHomeTrack, format: 'mp3' | 'wav') => {
    console.log(`Download ${format} for track:`, track.title);
    // Actual download logic would go here
  };

  const handleInfoClick = (trackId: string) => {
    console.log('Info clicked for track:', trackId);
    // Potentially navigate to a track detail page or show a modal
  };
  
  // const handleSelectTrack = (trackId: string) => {
  //   setSelectedTracks(prev => {
  //     const newSet = new Set(prev);
  //     if (newSet.has(trackId)) {
  //       newSet.delete(trackId);
  //     } else {
  //       newSet.add(trackId);
  //     }
  //     return newSet;
  //   });
  // };

  if (!packDetails) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Playlist not found</h2>
        <p>The playlist you are looking for does not exist or could not be loaded.</p>
        {/* Consider adding a link back to a general playlists page or home */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Playlist Header */}
      <div className="flex items-end mb-8 gap-6">
        <img 
          src={packDetails.imageUrl} 
          alt={packDetails.name} 
          className="w-48 h-48 rounded-lg object-cover shadow-lg"
        />
        <div className="flex flex-col justify-end">
          <p className="text-sm text-gray-400 mb-1">Playlist</p>
          <h1 className="text-5xl font-bold mb-2 truncate" title={packDetails.title}>{packDetails.title}</h1>
          <p className="text-gray-400 text-sm">{packTracks.length} tracks</p>
          <p className="text-gray-500 text-xs mt-0.5">Last updated on: {new Date(packDetails.lastUpdated).toLocaleDateString()}</p>
        </div>
        <button className="ml-auto bg-white text-black px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2 self-start mt-4">
          <Download size={18} />
          Download
        </button>
      </div>

      {/* Action Bar (Placeholder) */}
      <div className="mb-6 flex items-center gap-4">
        {/* <input 
            type="checkbox" 
            className="checkbox checkbox-sm bg-gray-700 border-gray-600" 
            // onChange={handleSelectAll}
            // checked={selectedTracks.size === packTracks.length && packTracks.length > 0}
        /> */}
        <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2">
          <Download size={16} />
          Download selected ({selectedTracks.size})
        </button>
      </div>

      {/* Tracks List Header (Mimicking the image) */}
      <div className="flex items-center gap-3 p-2.5 text-xs text-gray-500 border-b border-gray-700 mb-2">
        <div className="w-6 text-center">#</div>
        <div className="w-[calc(1.5rem+0.375rem+0.75rem)]"></div> {/* Spacer for play button area */}
        <div className="flex-grow min-w-0">TITLE</div>
        <div className="w-32 text-center"></div> {/* Spacer for MP3/WAV/Add buttons */}
        <div className="w-8 text-center">BPM</div>
        <div className="w-8 text-center">KEY</div>
        <div className="w-36 px-2 text-center">GENRE</div>
        <div className="w-20 px-2 text-center">MOOD</div>
        <div className="w-16 text-center">YEAR</div>
      </div>

      {/* Tracks List */}
      <div className="space-y-1">
        {packTracks.map((track, index) => (
          <PlaylistTrackListItem
            key={track.id}
            track={track}
            index={index}
            isPlaying={globalCurrentTrack?.id === track.id && isPlaying}
            onPlayPauseClick={handlePlayPauseTrack}
            onAddToPlaylistClick={handleAddToPlaylist}
            onDownloadClick={handleDownloadTrack}
            onInfoClick={handleInfoClick}
            // onSelectTrack={handleSelectTrack} // For future selection feature
            // isSelected={selectedTracks.has(track.id)} // For future selection feature
          />
        ))}
      </div>
    </div>
  );
};

export default PackDetailPage; 