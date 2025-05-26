import React, { useState, useRef, useContext } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import AddToListModal from '../components/AddToListModal';
import tracksData from '../data/packs.json'; // Renamed for clarity
import genresData from '../data/genres.json'; // Renamed for clarity
import '../styles/FilteredMood.css';
import useAudioStore, { type Track as AudioStoreTrack } from '../stores/audioStore'; // Import store and Track type
import { Play, Pause, Download, ListPlus, Info, ChevronDown, SlidersHorizontal, X } from 'lucide-react'; // Added SlidersHorizontal, X
import { CurrentTrackContext } from '../contexts/CurrentTrackContext'; // Import context
import type { TrackDetail } from '../pages/TrackDetail'; // Import TrackDetail type for mapping

// Interface for tracks from packs.json
export interface PackTrack {
  id: string;
  title: string;
  artist: string;
  audioSrc: string;
  imageUrl: string; // Consistent with packs.json
  bpm: number;
  key: string;
  genre: string;
  mood: string;
  category: string;
  downloadUrls: { mp3: string; wav: string };
  duration: string;
  releaseDate: string;
}

interface FilterState {
  stems: boolean;
  wav: boolean;
  remix: boolean;
  genre: string | null;
  artist: string | null;
  mood: string | null;
  key: string | null;
  bpm: number[] | null;
}

type FilterValue = string | number[] | boolean | null;

const FilteredMood = () => {
  const [searchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false); // State for mobile filter panel
  const headerRef = useRef<HTMLDivElement>(null); // Ref for the header to position dropdown
  const [filters, setFilters] = useState<FilterState>({
    stems: false,
    wav: false,
    remix: false,
    genre: null,
    artist: null,
    mood: searchParams.get('moods'),
    key: null,
    bpm: null
  });
  const [selectedTracks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    loadTrack,
    currentTrack: globalCurrentTrack,
    isPlaying,
    togglePlayPause,
    setPlayIntent
  } = useAudioStore();

  const navigate = useNavigate(); // Initialize useNavigate
  const context = useContext(CurrentTrackContext);

  if (!context) {
    // This component might be used outside a provider in some scenarios (e.g. tests)
    // Or you can throw an error: throw new Error('FilteredMood must be used within a CurrentTrackProvider');
    console.warn('CurrentTrackContext not found in FilteredMood. setCurrentTrack will not work.');
  }
  const setCurrentTrackFromContext = context?.setCurrentTrack;

  // New state for add to list modal
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [downloadLists, setDownloadLists] = useState<string[]>(['download']);

  // Filter tracks based on all criteria
  const filteredTracks: PackTrack[] = tracksData.tracks.filter((track: any): track is PackTrack => {
    const matchesMood = filters.mood ? track.mood.toLowerCase() === filters.mood.toLowerCase() : true;
    
    // Find the genre object with matching name and check if its ID matches the filter
    const matchesGenre = filters.genre 
      ? genresData.genres.find(g => g.name === track.genre)?.id === filters.genre
      : true;
      
    const matchesArtist = filters.artist ? track.artist.toLowerCase() === filters.artist.toLowerCase() : true;
    const matchesKey = filters.key ? track.key === filters.key : true;
    const matchesBpm = filters.bpm 
      ? track.bpm >= filters.bpm[0] && track.bpm <= filters.bpm[1]
      : true;
    const matchesSearch = searchQuery.toLowerCase() === '' || 
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesMood && matchesGenre && matchesArtist && matchesKey && matchesBpm && matchesSearch;
  });

  const handleFilterChange = (filterType: string, value: FilterValue) => {
    setFilters(prev => {
      // If the filter being changed is one of these types, and the new value is the same as the current one,
      // it means the user is deselecting/toggling it off. So, set it to null.
      if (['genre', 'artist', 'mood', 'key'].includes(filterType)) {
        if (prev[filterType as keyof FilterState] === value) {
          return {
            ...prev,
            [filterType]: null
          };
        }
      }
      // Otherwise, apply the new value (or toggle for booleans)
      return {
        ...prev,
        [filterType]: value
      };
    });
  };

  const handlePlayPause = (track: PackTrack) => {
    if (globalCurrentTrack?.id === track.id && globalCurrentTrack?.audioSrc === track.audioSrc) {
      togglePlayPause();
    } else {
      const trackToLoad: AudioStoreTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        audioSrc: track.audioSrc,
        imageUrl: track.imageUrl || undefined,
      };
      loadTrack(trackToLoad);
      setPlayIntent(Date.now().toString());
    }
  };

  const handleTrackSelectAndNavigate = (packTrack: PackTrack) => {
    if (setCurrentTrackFromContext) {
      // Map PackTrack to TrackDetail structure
      // This is a simplified mapping. You'll need to expand this based on what TrackDetail truly needs
      // and what data is available or can be reasonably simulated/defaulted.
      const trackDetailForContext: TrackDetail = {
        id: packTrack.id,
        title: packTrack.title,
        artist: packTrack.artist,
        bpm: packTrack.bpm,
        key: packTrack.key,
        genre: packTrack.genre, 
        releaseDate: packTrack.releaseDate,
        trackLength: packTrack.duration, 
        audioUrl: packTrack.audioSrc, 
        waveform: `/waveforms/${packTrack.id}.json`, // Assuming a convention for waveform files
        // --- Fields requiring default values or further logic if not in PackTrack ---
        remixer: undefined, // Or some default if applicable
        subgenre: undefined, // Or some default if applicable
        recordLabel: undefined, // Or some default if applicable
        stems: [], // Default to empty array, or simulate/fetch if necessary
        moodClusters: [], // Default to empty array
        moodProbabilities: [], // Default to empty array
        danceability: 0.7, // Example default
        voiceInstrumentalRatio: 0.5, // Example default
        energyLevel: 3, // Example default
        fileType: packTrack.downloadUrls?.wav ? 'WAV' : 'MP3', // Example logic
      };
      setCurrentTrackFromContext(trackDetailForContext);
    }
    navigate(`/track/${packTrack.id}`);
  };

  const handleAddToList = (_trackId: string) => {
    setIsAddToListModalOpen(true);
  };

  const handleAddToListConfirm = (listName: string) => {
    // Here you would implement the logic to add the track to the selected list
    if (!downloadLists.includes(listName)) {
      setDownloadLists([...downloadLists, listName]);
    }
    setIsAddToListModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden md:overflow-auto">
      {/* Static Filter Bar for Desktop - Placed first for layout, but visually appears left */}
      <div className="hidden md:block md:w-64 lg:w-72 md:flex-shrink-0 md:bg-gray-900 md:border-r md:border-gray-800 md:overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <FilterBar onFilterChange={handleFilterChange} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col relative"> {/* Added relative for dropdown positioning */}
        
        {/* Header - Search Bar is part of this conceptual header now for positioning the dropdown */}
        <div ref={headerRef} className="border-b border-gray-800 z-20 bg-gray-900"> {/* z-20 to be above content, bg for solid background */}
          <div className="p-3 sm:p-4">
            <div className="max-w-3xl mx-auto">
              <input
                type="text"
                placeholder="Search for music"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between p-3 sm:p-4 gap-3 md:gap-4 pt-0 sm:pt-0 md:pt-3">
            <div className="flex items-center self-start md:self-center space-x-2 sm:space-x-3 w-full md:w-auto">
              {/* Mobile Filter Toggle Button */}
              <button 
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)} 
                className="p-2 text-gray-300 hover:text-white md:hidden rounded-md hover:bg-gray-700"
                aria-label="Toggle filters"
                aria-expanded={isMobileFilterOpen}
              >
                <SlidersHorizontal size={20} />
              </button>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap">Music</h1>
              {/* Checkbox filters - now always flex for mobile, but items can wrap */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-1 ml-auto md:ml-0">
                <label className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={filters.stems}
                    onChange={() => handleFilterChange('stems', !filters.stems)}
                    className="form-checkbox h-3.5 w-3.5 sm:h-4 sm:w-4"
                  />
                  <span>Stems</span>
                </label>
                <label className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={filters.wav}
                    onChange={() => handleFilterChange('wav', !filters.wav)}
                    className="form-checkbox h-3.5 w-3.5 sm:h-4 sm:w-4"
                  />
                  <span>Wav</span>
                </label>
                <label className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={filters.remix}
                    onChange={() => handleFilterChange('remix', !filters.remix)}
                    className="form-checkbox h-3.5 w-3.5 sm:h-4 sm:w-4"
                  />
                  <span>Remix</span>
                </label>
                <button className="text-blue-400 text-xs sm:text-sm hover:text-blue-300 whitespace-nowrap">+ Recent</button>
              </div>
            </div>

            <button 
              className={`mt-2 md:mt-0 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium w-full md:w-auto
                          ${selectedTracks.length > 0 ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 opacity-70'}`}
              disabled={selectedTracks.length === 0}
            >
              Download selected ({selectedTracks.length})
            </button>
          </div>
        </div>
        
        {/* Mobile Filter Dropdown Panel */}
        <div
          className={`absolute left-0 right-0 md:hidden bg-gray-800 border-t border-gray-700 shadow-2xl rounded-b-lg 
                      overflow-y-auto transition-all duration-300 ease-in-out z-10
                      ${isMobileFilterOpen ? 'max-h-[40vh] opacity-100 p-4 pt-3' : 'max-h-0 opacity-0 p-0'}`}
          style={{ top: headerRef.current?.offsetHeight ? `${headerRef.current.offsetHeight}px` : 'auto' }} // Position below header
        >
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-700"> {/* Added pb-3 and border-b */}
            <h2 className="text-lg font-semibold">Filters</h2>
            <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-gray-700" aria-label="Close filters"> {/* Added hover bg */}
              <X size={22} />
            </button>
          </div>
          {/* Pass isMobileView true to the FilterBar in the mobile dropdown */}
          <FilterBar onFilterChange={handleFilterChange} isMobileView={true} />
        </div>

        {/* Overlay for mobile when filter dropdown is open */}
        {isMobileFilterOpen && (
          <div 
            className="fixed inset-0 z-0 bg-black/40 md:hidden" // Increased overlay darkness slightly
            onClick={() => setIsMobileFilterOpen(false)}
          />
        )}

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          <div className="space-y-1.5 sm:space-y-2">
            {filteredTracks.map((track) => (
              <div 
                key={track.id}
                className="bg-gray-800 hover:bg-gray-700 rounded-lg p-2.5 sm:p-3 transition-colors duration-150"
              >
                {/* Mobile: Column Layout / Desktop: Flex Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                  {/* Section 1 (Mobile Row 1): Play, Title, Artist, Expand (becomes first part of desktop row) */}
                  <div className="flex items-center gap-2 flex-grow min-w-0 mb-2 sm:mb-0 sm:w-1/3 md:w-2/5">
                    <button className="text-gray-400 hover:text-white p-1 hidden sm:inline-flex"> <ChevronDown size={16}/> </button> {/* Expand - hidden on smallest mobile, consider alternative for expand action */}
                    <button 
                      onClick={() => handlePlayPause(track)}
                      className={`w-8 h-8 flex-shrink-0 flex items-center justify-center p-1 rounded-full text-slate-900 transition-colors
                                  ${globalCurrentTrack?.id === track.id && isPlaying ? 'bg-red-500 hover:bg-red-400' : 'bg-amber-500 hover:bg-amber-400'}`}
                      aria-label={globalCurrentTrack?.id === track.id && isPlaying ? 'Pause' : 'Play'}
                    >
                      {globalCurrentTrack?.id === track.id && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>
                    <div className="flex-grow min-w-0">
                      <h3 
                        className="font-medium text-sm sm:text-base truncate hover:text-blue-400 cursor-pointer"
                        onClick={() => handleTrackSelectAndNavigate(track)}
                      >
                        {track.title}
                      </h3>
                      <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                    </div>
                  </div>

                  {/* Section 2 (Mobile Row 2): Downloads, Add (becomes middle part of desktop row) */}
                  <div className="flex items-center gap-2 mb-2 sm:mb-0 pl-10 sm:pl-0 flex-shrink-0">
                    <button className="bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 flex items-center gap-1" title="Download MP3">
                      <Download size={14} className="text-gray-300"/> <span className="text-xs text-gray-300">MP3</span>
                    </button>
                    {filters.wav && (
                      <button className="bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 flex items-center gap-1" title="Download WAV">
                        <Download size={14} className="text-gray-300"/> <span className="text-xs text-gray-300">WAV</span>
                      </button>
                    )}
                    <button 
                      className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 flex items-center gap-1" 
                      onClick={() => handleAddToList(track.id)} 
                      title="Add to playlist"
                    >
                      <ListPlus size={14}/> <span className="text-xs">Add</span>
                    </button>
                  </div>

                  {/* Section 3 (Mobile Row 3 or Grid): Stats (becomes end part of desktop row) */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:ml-auto pl-10 sm:pl-0 text-xs flex-shrink-0">
                    <span className="w-auto sm:w-10 text-left sm:text-right font-mono" title="BPM">{track.bpm}</span>
                    <span className="w-auto sm:w-7 text-left sm:text-center font-mono" title="Key">{track.key}</span>
                    <span className="text-gray-400 w-auto sm:w-20 truncate" title={`Genre: ${track.genre}`}>{track.genre}</span>
                    <span className={`px-2 py-0.5 rounded-full whitespace-nowrap 
                                      ${track.mood === 'Chilled' ? 'bg-blue-500/30 text-blue-300' : 'bg-purple-500/30 text-purple-300'}`}
                          title={`Mood: ${track.mood}`}
                    >
                      {track.mood} {/* Ensure mood is displayed, e.g. track.mood which matches your PackTrack interface */}
                    </span>
                    <span className="text-gray-400 whitespace-nowrap" title={`Released: ${track.releaseDate}`}>{new Date(track.releaseDate).toLocaleDateString('en-CA')}</span> {/* Using short date format */}
                    <button 
                      onClick={() => handleTrackSelectAndNavigate(track)}
                      className="text-gray-400 hover:text-white p-0.5"
                      title="Track Info"
                    >
                      <Info size={14}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add to List Modal */}
      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={() => setIsAddToListModalOpen(false)}
        onAddToList={handleAddToListConfirm}
        existingLists={downloadLists}
      />
    </div>
  );
};

export default FilteredMood; 