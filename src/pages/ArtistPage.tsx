import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import tracksData from '../data/packs.json'; // Main source of track data
import useAudioStore from '../stores/audioStore'; // Import the audio store
import { Play as PlayIconLucide, Download, ListPlus, Music, CalendarDays, MapPin, Info, Search as SearchIcon, Pause } from 'lucide-react';

// Placeholder: Define structure for track and artist based on your data
interface PageTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  keySignature: string; // Assuming 'key' from image is keySignature
  genre: string;
  mood: string;
  releaseDate: string; // Or Date object
  // Add any other relevant track properties
  audioSrc: string;
  imageUrl?: string; // For track image if available
}

interface ArtistDetails {
  name: string;
  totalTracks: number;
  lastUpdated: string; // Or Date object
  imageUrl: string;
  location?: string;
  onStageSince?: string;
  bornIn?: string;
  bio?: string; // If available
}

const ArtistPage: React.FC = () => {
  const { artistName } = useParams<{ artistName: string }>();
  const [artistDetails, setArtistDetails] = useState<ArtistDetails | null>(null);
  const [artistTracks, setArtistTracks] = useState<PageTrack[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Recent'); // Stems, Wav, Remix, Recent

  const { loadTrack, currentTrack: globalCurrentTrack, isPlaying, setPlayIntent, togglePlayPause } = useAudioStore(); // Get loadTrack from store

  useEffect(() => {
    if (artistName) {
      const decodedArtistName = decodeURIComponent(artistName);
      
      // Find tracks by this artist
      const tracksByArtist = tracksData.tracks.filter(
        (track: any) => {
          if (track.artist && typeof track.artist === 'string') {
            const individualArtists = track.artist.split(',').map((a: string) => a.trim().toLowerCase());
            return individualArtists.includes(decodedArtistName.toLowerCase());
          }
          return false;
        }
      ).map((t: any): PageTrack => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        bpm: t.bpm,
        keySignature: t.key, // Map 'key' to 'keySignature'
        genre: t.genre,
        mood: t.mood,
        releaseDate: t.releaseDate,
        audioSrc: t.title === 'Electric Dreams' 
          ? '/audio/electric-dreams.mp3' 
          : (t.audioSrc || `/audio/${t.title.replace(/\s+/g, '-').toLowerCase()}.mp3`),
        imageUrl: t.imageUrl || `https://picsum.photos/seed/${t.id}/100/100`, // Placeholder image
      }));
      setArtistTracks(tracksByArtist);

      // Create artist details (can be expanded with data from playlists.json or a dedicated artists.json)
      if (tracksByArtist.length > 0) {
        setArtistDetails({
          name: decodedArtistName,
          totalTracks: tracksByArtist.length,
          // Placeholder data - replace with actual if available
          lastUpdated: new Date().toLocaleDateString(), 
          imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(decodedArtistName)}&background=random&size=200&font-size=0.33`, // Larger avatar
          location: 'San Juan, Puerto Rico, U.S.', // Placeholder
          onStageSince: '2015', // Placeholder
          bornIn: '1994', // Placeholder
        });
      } else {
        // Handle artist not found scenario
        setArtistDetails(null);
      }
    }
  }, [artistName]);

  const handlePlayTrack = (track: PageTrack) => {
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
      setPlayIntent(Date.now().toString()); // Set play intent with a unique ID
    }
  };

  const filteredAndSortedTracks = useMemo(() => {
    let processedTracks = [...artistTracks];

    // Filter by search term (title or artist)
    if (searchTerm) {
      processedTracks = processedTracks.filter(track =>
        track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type (Stems, Wav, Remix) - This needs more specific data in packs.json
    // For now, "Recent" will sort by release date.
    // You'll need to add properties to your track data to support these filters.
    // e.g., track.hasStems, track.format === 'WAV', track.isRemix

    // Sort
    if (filterType === 'Recent') {
      processedTracks.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    } 
    // Add other sorting logic for Stems, Wav, Remix if data supports it

    return processedTracks;
  }, [artistTracks, searchTerm, filterType]);

  if (!artistDetails) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex justify-center items-center">
        <p>Artist not found or loading...</p>
      </div>
    );
  }

  const filterButtons = ['Stems', 'Wav', 'Remix', 'Recent'];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Artist Header Section */}
      <div className="bg-gray-800 p-6 md:p-8">
        <div className="container mx-auto">
          {/* Breadcrumbs */}
          <div className="text-sm text-gray-400 mb-4">
            <Link to="/" className="hover:text-white">Home</Link> / 
            <Link to="/artists" className="hover:text-white">Artists</Link> / 
            <span className="text-white">{artistDetails.name}</span>
          </div>

          <div className="md:flex gap-8 items-start">
            <img 
              src={artistDetails.imageUrl} 
              alt={artistDetails.name} 
              className="w-40 h-40 md:w-48 md:h-48 rounded-lg object-cover mb-4 md:mb-0 shadow-lg"
            />
            <div className="flex-grow">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{artistDetails.name}</h1>
              <p className="text-sm text-gray-400 mb-1">{artistDetails.totalTracks} tracks</p>
              <p className="text-xs text-gray-500 mb-4">Last updated on: {artistDetails.lastUpdated}</p>
              {/* Additional details like location, on stage, born in could go here */}
              {artistDetails.location && (
                <div className="flex items-center gap-2 text-sm text-gray-300 mb-1.5">
                  <MapPin size={16} className="text-gray-400" /> {artistDetails.location}
                </div>
              )}
              {artistDetails.onStageSince && (
                <div className="flex items-center gap-2 text-sm text-gray-300 mb-1.5">
                  <Music size={16} className="text-gray-400" /> On stage since {artistDetails.onStageSince}
                </div>
              )}
              {artistDetails.bornIn && (
                <div className="flex items-center gap-2 text-sm text-gray-300 mb-1.5">
                  <CalendarDays size={16} className="text-gray-400" /> Born in {artistDetails.bornIn}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tracks Section */}
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full md:w-auto md:flex-grow max-w-md">
            <input 
              type="text"
              placeholder={`Search in ${artistDetails.name}`}
              className="bg-gray-800 border border-gray-700 rounded-md py-2.5 px-4 pl-10 text-sm focus:outline-none focus:border-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            {/* Add clear search button if needed */}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {filterButtons.map(type => (
              <button 
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors 
                  ${filterType === type 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Download Selected - Assuming a selection mechanism exists */}
        <div className="mb-4 flex items-center justify-between">
            <button className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2">
                <Download size={18}/> Download selected (0)
            </button>
        </div>

        {/* Tracks List Header */}
        <div className="hidden md:grid grid-cols-[40px_minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_80px] gap-4 px-3 py-2 border-b border-gray-700 text-xs text-gray-400 font-medium">
            <div>{/* Play */}</div>
            <div>Title</div>
            <div>MP3</div>
            <div>BPM / Key</div>
            <div>Genre</div>
            <div>Mood</div>
            <div>Year</div>
        </div>

        <div className="space-y-1 md:space-y-0">
          {filteredAndSortedTracks.length > 0 ? (
            filteredAndSortedTracks.map((track, _) => (
              <div 
                key={track.id} 
                className="bg-gray-800 hover:bg-gray-700 rounded-md p-3 mb-2 transition-colors duration-150
                           md:grid md:grid-cols-[40px_minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_80px] 
                           md:items-center md:gap-x-4 md:gap-y-0 md:p-3 md:mb-0"
              >
                {/* --- Mobile Row 1 / Desktop Cells 1 & 2 --- */}
                <div className="flex items-center gap-3 md:contents"> {/* Parent for Play & Title/Artist, its children become grid items on desktop */}
                  {/* Play Button (Desktop Cell 1) */}
                  <div className="flex-shrink-0 md:flex md:items-center md:justify-center">
                      <button 
                          onClick={() => handlePlayTrack(track)} 
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600 hover:bg-blue-600 transition-colors text-white"
                      >
                          {globalCurrentTrack?.id === track.id && isPlaying ? 
                              <Pause size={18} fill="currentColor" /> : 
                              <PlayIconLucide size={18} fill="currentColor" />
                          }
                      </button>
                  </div>
                  {/* Title & Artist + Info Icon (Desktop Cell 2) */}
                  <div className="flex-grow min-w-0"> {/* Handles truncation */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-white truncate text-sm" title={track.title}>{track.title}</span>
                      <button className="text-gray-400 hover:text-white flex-shrink-0">
                        <Info size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* --- Mobile Row 2 / Desktop Cell 3 --- */}
                {/* Actions (MP3/Add) */}
                <div className="mt-2 pt-2 border-t border-gray-700 flex items-center gap-3 text-xs text-gray-400 
                                md:mt-0 md:pt-0 md:border-t-0 md:flex md:items-center"> {/* This div itself is Desktop Cell 3 */}
                  <button className="hover:text-white flex items-center gap-1"><Download size={16}/> MP3</button>
                  <button className="hover:text-white flex items-center gap-1"><ListPlus size={16}/> Add</button>
                </div>
                
                {/* --- Mobile Row 3 / Desktop Cells 4, 5, 6, 7 --- */}
                {/* Metadata (BPM/Key, Genre, Mood, Year) */}
                <div className="mt-2 pt-2 border-t border-gray-700 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-400 
                                md:mt-0 md:pt-0 md:border-t-0 md:contents"> {/* This div's children become Desktop Cells 4,5,6,7 */}
                  
                  {/* BPM / Key (Desktop Cell 4) */}
                  <div> 
                      <span className="font-mono">{track.bpm}</span><span className="mx-1">|</span><span className="font-mono">{track.keySignature}</span>
                  </div>

                  {/* Genre (Desktop Cell 5) */}
                  <div className="truncate" title={track.genre}>{track.genre}</div>
                  
                  {/* Mood Button (Desktop Cell 6) */}
                  {/* For mobile, this can be on its own line in the grid if needed: add `col-span-2` to the div below */}
                  <div>
                      <span 
                        className={`inline-block px-2.5 py-1 text-xs rounded-full font-medium leading-tight whitespace-nowrap
                          ${
                            track.mood === 'Sexy' ? 'bg-pink-500/20 text-pink-400' :
                            track.mood === 'Energetic' ? 'bg-red-500/20 text-red-400' :
                            track.mood === 'Chilled' ? 'bg-blue-500/20 text-blue-400' :
                            track.mood === 'Uplifting' ? 'bg-green-500/20 text-green-400' :
                            'bg-purple-500/20 text-purple-400' // Default/other moods
                          }`}
                      >
                        {track.mood}
                      </span>
                  </div>

                  {/* Year (Desktop Cell 7) */}
                  <div className="text-right">
                    {new Date(track.releaseDate).getFullYear()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 py-8">
              {searchTerm ? `No tracks found for "${searchTerm}" by ${artistDetails.name}.` : `No tracks found for ${artistDetails.name}.`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistPage; 