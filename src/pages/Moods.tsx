import { Link } from 'react-router-dom';
import moodsData from '../data/moods.json';
import tracksData from '../data/packs.json';
import '../styles/Moods.css';
import useAudioStore, { type Track as AudioStoreTrack } from '../stores/audioStore';
import { Play, Pause, Download, ListPlus } from 'lucide-react';

// This interface should exactly match the structure of objects in tracksData.tracks (packs.json)
interface PackTrack {
  id: string;
  title: string;
  artist: string;
  audioSrc: string;
  imageUrl: string; // packs.json has imageUrl as non-optional string (even if empty)
  bpm: number;
  key: string;
  genre: string;
  mood: string;
  category: string;
  downloadUrls: { mp3: string; wav: string };
  duration: string;
  releaseDate: string;
}

const Moods = () => {
  const {
    loadTrack,
    currentTrack: globalCurrentTrack,
    isPlaying,
    togglePlayPause,
    setPlayIntent
  } = useAudioStore();

  const handlePlayPause = (track: PackTrack) => {
    if (globalCurrentTrack?.id === track.id && globalCurrentTrack?.audioSrc === track.audioSrc) {
      togglePlayPause();
    } else {
      const trackToLoad: AudioStoreTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        audioSrc: track.audioSrc,
        imageUrl: track.imageUrl || undefined, // Ensure it's string|undefined for AudioStoreTrack
      };
      loadTrack(trackToLoad);
      setPlayIntent(Date.now().toString());
    }
  };

  const MoodCard = ({ mood }: { mood: typeof moodsData.moods[0] }) => (
    <Link 
      to={`/music?moods=${mood.id}`}
      className={`mood-card ${mood.id} rounded-lg overflow-hidden shadow-lg 
                  w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.666rem)] md:w-[calc(25%-0.75rem)] lg:w-[calc(16.666%-0.833rem)] 
                  aspect-[3/2] sm:aspect-square flex items-center justify-center text-center p-2 
                  hover:scale-105 transition-transform duration-200`}
      style={{
        backgroundImage: `url(${mood.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <span className="text-white font-semibold text-sm sm:text-base break-words">{mood.name}</span>
    </Link>
  );

  const TrackRow = ({ track }: { track: PackTrack }) => {
    const isActive = globalCurrentTrack?.id === track.id && globalCurrentTrack?.audioSrc === track.audioSrc;
    const isPlayable = track.audioSrc && track.audioSrc !== '';

    return (
      <div className="track-row flex flex-col sm:flex-row items-center bg-gray-800/50 p-2.5 rounded-md hover:bg-gray-800/80 transition-colors duration-150">
        <div className="flex items-center space-x-3 flex-1 w-full mb-2 sm:mb-0">
          <button
            onClick={() => isPlayable && handlePlayPause(track)}
            disabled={!isPlayable}
            className={`play-button p-2 rounded-full text-slate-900 transition-colors flex-shrink-0
                        ${isPlayable ? (isActive && isPlaying ? 'bg-red-500 hover:bg-red-400' : 'bg-amber-500 hover:bg-amber-400') : 'bg-gray-600 opacity-50 cursor-not-allowed'}`}
            aria-label={isActive && isPlaying ? 'Pause' : 'Play'}
          >
            {isActive && isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate text-sm sm:text-base">{track.title}</h3>
            <p className="text-gray-400 text-xs sm:text-sm truncate">{track.artist}</p>
          </div>
        </div>
        
        <div className="track-actions flex items-center space-x-2 sm:space-x-2.5 mt-2 sm:mt-0 sm:ml-3 flex-shrink-0">
          <button className="action-button p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors" title="Download MP3">
            <Download size={16} />
          </button>
          <button className="action-button p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors hidden sm:inline-flex" title="Download WAV">
            <Download size={16} />
          </button>
          <button className="action-button p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors" title="Add to playlist">
            <ListPlus size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-800">
        <div className="max-w-3xl mx-auto">
          <input
            type="text"
            placeholder="Search for music"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-2">Moods</h1>
          <p className="text-gray-400 text-xl">by Fuvi Clan</p>
        </div>

        <div className="space-y-4 mb-16">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4">
            {moodsData.moods.map((mood) => (
              <MoodCard key={mood.id} mood={mood} />
            ))}
          </div>
        </div>

        <div className="my-16 flex items-center">
          <div className="flex-1 h-px bg-gray-800"></div>
          <div className="mx-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 p-0.5">
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                <img src="/images/logo-small.png" alt="Logo" className="w-8 h-8" />
              </div>
            </div>
          </div>
          <div className="flex-1 h-px bg-gray-800"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {moodsData.moods.map((mood) => {
            // The filter now correctly uses PackTrack for type checking against tracksData.tracks
            const moodTracks: PackTrack[] = tracksData.tracks.filter(
              (t: any): t is PackTrack => t.mood.toLowerCase() === mood.id.toLowerCase()
            );
            const displayTracks: PackTrack[] = moodTracks.slice(0, 5);
            
            while (displayTracks.length < 5) {
              const placeholderBase: Omit<PackTrack, 'id' | 'title' | 'artist' | 'audioSrc' | 'imageUrl'> = {
                bpm: 0,
                key: '',
                genre: '',
                mood: mood.name,
                category: '',
                downloadUrls: { mp3: '', wav: '' },
                duration: '',
                releaseDate: '',
              };
              displayTracks.push({
                ...placeholderBase,
                id: `placeholder-${mood.id}-${displayTracks.length}`,
                title: 'Coming Soon',
                artist: 'Stay tuned',
                audioSrc: '', 
                imageUrl: '', // Placeholder imageUrl is an empty string
              });
            }

            return (
              <div key={mood.id} className="mood-section p-6 h-full">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `var(--${mood.id}-color, ${mood.color})` }} />
                    <h2 className="text-xl font-semibold">{mood.name}</h2>
                  </div>
                  <Link to={`/music?moods=${mood.id}`} className="discover-link">
                    Discover →
                  </Link>
                </div>

                <div className="space-y-2">
                  {displayTracks.map((track) => (
                    <TrackRow key={track.id} track={track} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Moods; 