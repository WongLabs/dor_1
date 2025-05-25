import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import AddToListModal from '../components/AddToListModal';
import tracksData from '../data/packs.json'; // Renamed for clarity
import genresData from '../data/genres.json'; // Renamed for clarity
import '../styles/FilteredMood.css';
import useAudioStore, { type Track as AudioStoreTrack } from '../stores/audioStore'; // Import store and Track type
import { Play, Pause } from 'lucide-react'; // Import icons

// Interface for tracks from packs.json
interface PackTrack {
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
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    loadTrack,
    currentTrack: globalCurrentTrack,
    isPlaying,
    togglePlayPause,
    setPlayIntent
  } = useAudioStore();

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
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
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

  const handleAddToList = (trackId: string) => {
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
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Filter Bar */}
      <FilterBar onFilterChange={handleFilterChange} />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-800">
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

        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">Music</h1>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.stems}
                  onChange={() => handleFilterChange('stems', !filters.stems)}
                  className="form-checkbox"
                />
                <span>Stems</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.wav}
                  onChange={() => handleFilterChange('wav', !filters.wav)}
                  className="form-checkbox"
                />
                <span>Wav</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.remix}
                  onChange={() => handleFilterChange('remix', !filters.remix)}
                  className="form-checkbox"
                />
                <span>Remix</span>
              </label>
              <button className="text-blue-400">+ Recent</button>
            </div>
          </div>

          <button 
            className={`px-4 py-2 rounded-lg ${selectedTracks.length > 0 ? 'bg-blue-500' : 'bg-gray-700'}`}
            disabled={selectedTracks.length === 0}
          >
            download selected ({selectedTracks.length})
          </button>
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredTracks.map((track) => (
              <div 
                key={track.id}
                className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center flex-1 gap-4">
                  {/* Left section with expand, play, and title */}
                  <div className="flex items-center gap-2 w-1/3">
                    <button className="text-gray-400">▼</button>
                    <button 
                      onClick={() => handlePlayPause(track)}
                      className="w-8 h-8 flex items-center justify-center p-1 bg-amber-500 hover:bg-amber-400 rounded-full text-slate-900 transition-colors"
                      aria-label={globalCurrentTrack?.id === track.id && isPlaying ? 'Pause' : 'Play'}
                    >
                      {globalCurrentTrack?.id === track.id && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>
                    <div>
                      <Link to={`/track/${track.id}`} className="hover:text-blue-400">
                        <h3 className="font-medium text-sm">{track.title}</h3>
                      </Link>
                      <p className="text-gray-400 text-xs">{track.artist}</p>
                    </div>
                  </div>

                  {/* Center section with download buttons */}
                  <div className="flex items-center gap-2">
                    <button className="bg-gray-700 rounded p-1">
                      <span className="text-xs text-gray-300">MP3</span>
                    </button>
                    {filters.wav && (
                      <button className="bg-gray-700 rounded p-1">
                        <span className="text-xs text-gray-300">WAV</span>
                      </button>
                    )}
                  </div>

                  {/* Add button */}
                  <button 
                    className="text-gray-400 hover:text-white"
                    onClick={() => handleAddToList(track.id)}
                  >
                    Add
                  </button>

                  {/* Stats section */}
                  <div className="flex items-center gap-8 ml-auto">
                    <span className="text-sm w-12 text-right">{track.bpm}</span>
                    <span className="text-sm w-8">{track.key}</span>
                    <span className="text-sm text-gray-400 w-24">{track.genre}</span>
                    <span className="bg-blue-500 text-xs px-3 py-1 rounded-full">Chilled</span>
                    <span className="text-xs text-gray-400">2025/4/29</span>
                    <Link 
                      to={`/track/${track.id}`}
                      className="text-gray-400 hover:text-white"
                    >
                      ℹ️
                    </Link>
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