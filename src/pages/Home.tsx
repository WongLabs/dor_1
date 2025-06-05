import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lightbulb,
  HelpCircle,
  Play as PlayIconLucide,
  Pause as PauseIconLucide,
  Info,
  Download,
  ListPlus,
  ChevronRight,
  CloudDownload,
  Clock,
  Eye
} from 'lucide-react';
import TrackCard, { TrackCardType } from '../components/TrackCard';
import PackCard, { PackCardType, TrackInPack } from '../components/PackCard';
import tracksData from '../data/packs.json';
import bpmDataFromFile from '../data/bpm.json';
import useAudioStore from '../stores/audioStore';

interface PageHomeTrack extends TrackCardType {
  category?: string;
}

interface PageHomePack extends PackCardType {}

// Define an interface for the BPM data structure
interface BpmInfo {
  bpm: number;
  source: string;
  confidence: number;
}

interface BpmData {
  trackSpecificBPMs: { [trackId: string]: BpmInfo };
  bpm_range: {
    min: number;
    max: number;
    ranges: Array<{
      min: number;
      max: number;
      count: number;
    }>;
  };
}

const bpmData: BpmData = bpmDataFromFile;

/* // TS6133: 'SORT_OPTIONS' is declared but its value is never read.
const SORT_OPTIONS = {
  RECENT: 'recent',
  TRENDING: 'trending',
  TOP_RATED: 'top_rated',
} as const;
*/

type TabType = 'LATEST' | 'PAST_WEEK';

// New Hero Section Component
const HeroSection = () => {
  const navigate = useNavigate();

  // Placeholder data - replace with actual data source
  const userName = "Marco Francesco";
  const mp3Downloaded = 9204;
  const wavDownloaded = 162;
  const downloadListCount = 1;
  const remainingQuota = 864;
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const topChartMonthYear = "may-2025"; // For dynamic playlist navigation

  return (
    <section className="mb-12 flex flex-col lg:flex-row gap-6 items-stretch">
      {/* Left Side: Top DJ Chart */}
      <div className="flex-1 bg-gradient-to-br from-blue-700 via-blue-900 to-black rounded-xl p-8 flex flex-col justify-between items-start relative overflow-hidden min-h-[300px] lg:min-h-0">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        {/* Dot pattern - subtle */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '10px 10px'
        }}></div>

        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            TOP DJ Chart
          </h1>
          <p className="text-xl text-blue-200 mt-1">MAY 2025</p>
          <p className="text-blue-100 mt-4">New Top Dj Chart is here!</p>
        </div>
        
        <div className="relative z-10 mt-8 flex gap-4">
          <button className="bg-blue-500 hover:bg-blue-400 text-white font-semibold py-3 px-6 rounded-full flex items-center gap-2 transition-colors">
            Download <Download size={18} />
          </button>
          <button 
            onClick={() => navigate(`/playlist/top-chart-${topChartMonthYear}`)}
            className="bg-transparent hover:bg-white/10 border-2 border-white/50 text-white font-semibold py-3 px-6 rounded-full flex items-center gap-2 transition-colors">
            Discover <ChevronRight size={18} />
          </button>
        </div>

        {/* Circular Badge - positioned */}
        <div className="absolute bottom-8 right-8 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:right-12 transform transition-all duration-300 hover:scale-105">
          <div className="bg-black/60 backdrop-blur-md rounded-full p-2 shadow-2xl">
            <div className="bg-gradient-to-br from-green-400 to-green-600 text-white rounded-full w-40 h-40 md:w-48 md:h-48 flex flex-col items-center justify-center text-center p-4">
              <span className="text-2xl md:text-3xl font-bold block leading-none">TOP</span>
              <span className="text-2xl md:text-3xl font-bold block leading-none">DJ CHART</span>
              <div className="w-16 border-t-2 border-green-300 my-2"></div>
              <span className="text-sm md:text-base font-semibold">MAY 2025</span>
              <img src="/logo-placeholder.png" alt="FVC Logo" className="w-8 h-8 mt-2 opacity-80" /> {/* Replace with actual logo */}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: User Stats */}
      <div className="w-full lg:w-[380px] bg-gray-800 rounded-xl p-6 flex flex-col justify-between shadow-lg">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Welcome back {userName}</h2>
          <p className="text-sm text-gray-400 mb-6">Let's make some noise!</p>

          <ul className="space-y-3 text-sm">
            <li 
              onClick={() => navigate('/dashboard/library')} 
              className="flex justify-between items-center cursor-pointer hover:bg-gray-700 p-2 rounded-md transition-colors duration-150"
            >
              <span className="flex items-center text-gray-300">
                <CloudDownload size={18} className="mr-3 text-blue-400" />
                MP3s already downloaded
              </span>
              <span className="bg-blue-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {mp3Downloaded.toLocaleString()}
              </span>
            </li>
            <li 
              onClick={() => navigate('/dashboard/library')} 
              className="flex justify-between items-center cursor-pointer hover:bg-gray-700 p-2 rounded-md transition-colors duration-150"
            >
              <span className="flex items-center text-gray-300">
                <CloudDownload size={18} className="mr-3 text-blue-400" />
                WAVs already downloaded
              </span>
              <span className="bg-blue-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {wavDownloaded.toLocaleString()}
              </span>
            </li>
            <li 
              onClick={() => navigate('/download-lists')}
              className="flex justify-between items-center pt-2 mt-2 border-t border-gray-700 cursor-pointer hover:bg-gray-700 p-2 rounded-md transition-colors duration-150"
            >
              <span className="flex items-center text-gray-300">
                <ListPlus size={18} className="mr-3 text-green-400" />
                My download list
              </span>
              <span className="bg-green-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {downloadListCount}
              </span>
            </li>
          </ul>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between items-center text-xs text-gray-400">
          <span className="flex items-center">
            <Clock size={14} className="mr-1.5" />
            remaining quota: <strong className="text-gray-200 ml-1">{remainingQuota}</strong>
          </span>
          <span>{currentDate} at {currentTime}</span>
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  const [selectedTab, setSelectedTab] = useState<TabType>('LATEST');
  const [latestTracksToShow, setLatestTracksToShow] = useState(10);
  const navigate = useNavigate();

  const { 
    loadTrack, 
    currentTrack: globalCurrentTrack, 
    isPlaying, 
    togglePlayPause, 
    setPlayIntent,
    seenTrackIds
  } = useAudioStore();

  const allTracks: PageHomeTrack[] = useMemo(() => tracksData.tracks.map((t: any): PageHomeTrack => {
    const specificBpmInfo = bpmData.trackSpecificBPMs[t.id];
    const calculatedBpm = specificBpmInfo ? specificBpmInfo.bpm : (t.bpm || 120);

    return {
      id: t.id,
      title: t.title,
      artist: t.artist,
      bpm: calculatedBpm,
      key: t.key || 'N/A',
      mood: t.mood || 'Unknown',
      genre: t.genre || 'Unknown',
      category: t.category || 'Unknown',
      releaseDate: t.releaseDate || new Date().toISOString(),
      duration: t.duration || '3:00',
      downloadUrls: t.downloadUrls || {
        mp3: `/audio/${t.title.replace(/\s+/g, '-').toLowerCase()}_placeholder.mp3`,
        wav: `/audio/${t.title.replace(/\s+/g, '-').toLowerCase()}_placeholder.wav`,
      },
      audioSrc: t.title === 'Electric Dreams' 
        ? '/audio/electric-dreams.mp3' 
        : (t.audioSrc || `/audio/${t.title.replace(/\s+/g, '-').toLowerCase()}.mp3`),
      imageUrl: t.imageUrl || `https://picsum.photos/seed/${t.id}/100/100`,
    };
  }), []);

  const staticPackGenres = [
    "Remix Hits", "Techno", "Tech House", "EDM & Electro", "Hard Techno", 
    "Melodic House & Techno", "Electro Pop & Dance", "Hard Music", 
    "Instrumental", "Grooves"
  ];

  const newPacksData: PageHomePack[] = useMemo(() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return staticPackGenres.map((genreName, index): PageHomePack => {
      const tracksInGenreAndLast3Months = allTracks.filter(track => {
        const isRecent = track.releaseDate && new Date(track.releaseDate) >= threeMonthsAgo;
        if (!isRecent) return false;

        const genreLower = genreName.toLowerCase();
        const trackGenreLower = track.genre?.toLowerCase();
        const trackTitleLower = track.title?.toLowerCase();
        // const trackCategoryLower = track.category?.toLowerCase(); // Uncomment if needed for more complex mapping

        if (genreLower === "remix hits") {
          return trackTitleLower?.includes("remix");
        }
        // Add more specific mappings here if Grooves or other genres need special title/category checks
        // For example, for "Grooves":
        // if (genreLower === "grooves") {
        //   return trackGenreLower?.includes("funk") || trackGenreLower?.includes("soul");
        // }
        return trackGenreLower === genreLower;
      });
      
      let lastDate = null;
      if (tracksInGenreAndLast3Months.length > 0) {
        // Sort by release date to find the most recent for the 'Updated' display
        tracksInGenreAndLast3Months.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        lastDate = new Date(tracksInGenreAndLast3Months[0].releaseDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }

      return {
        id: `static-pack-${index}-${genreName.replace(/\s+/g, '-')}`,
        name: genreName,
        trackCount: tracksInGenreAndLast3Months.length,
        imageUrl: `https://picsum.photos/seed/${genreName.replace(/\s+/g, '-')}/200/200`,
        lastUpdated: lastDate || undefined,
        tracks: tracksInGenreAndLast3Months.map(t => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          audioSrc: t.audioSrc,
          imageUrl: t.imageUrl,
        })),
      };
    });
  }, [allTracks]);

  const handlePlayPauseTrack = (track: PageHomeTrack | TrackInPack) => {
    if (globalCurrentTrack?.id === track.id && globalCurrentTrack?.audioSrc === track.audioSrc) {
      togglePlayPause();
    } else {
      loadTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        audioSrc: track.audioSrc,
        imageUrl: track.imageUrl || '',
      });
      setPlayIntent(Date.now().toString());
    }
  };

  const handleAddToPlaylist = (trackId: string) => {
    console.log('Add to playlist:', trackId);
  };

  const handleDownloadPack = (packId: string) => {
    console.log('Download pack request:', packId);
    // Implement actual download logic here
  };

  const handlePackClick = (packId: string, wasTrackListToggled: boolean) => {
    // Navigation to pack page removed as requested by the user (ticket #12345).
    // The click on the pack card will now only toggle the track list if applicable,
    // as track details are shown in-card.
    // if (!wasTrackListToggled) { // Original condition for navigation
    //   navigate(`/pack/${packId}`);
    // }
    console.log(`Pack card ${packId} clicked. Navigation disabled. Original 'wasTrackListToggled' value: ${wasTrackListToggled}`);
  };

  const sortedTracksForTabs = useMemo(() => {
    let tracksToFilter = [...allTracks];
    switch (selectedTab) {
      case 'LATEST':
        return tracksToFilter.sort((a, b) => 
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        );
      case 'PAST_WEEK':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return tracksToFilter.filter(track => 
          new Date(track.releaseDate) >= oneWeekAgo
        ).sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
      default:
        return tracksToFilter;
    }
  }, [selectedTab, allTracks]);

  const personalizedSuggestionTracks = useMemo(() => allTracks.slice(0, 9), [allTracks]);
  
  const genericSectionTracks = useMemo(() => allTracks.slice(0, 6), [allTracks]);

  // State for Artists of the moment carousel
  // const [currentArtistCardIndex, setCurrentArtistCardIndex] = useState(0); // TS6133: 'currentArtistCardIndex' declared but not used
  // Assuming tracksData.tracks.slice(0, 2) is the source for artist cards
  // For a more dynamic approach, you'd fetch or define actual artist data
  // const artistCardsData = useMemo(() => tracksData.tracks.slice(0, 5), []); // TS6133: 'artistCardsData' is declared but its value is never read.

  /* // TS6133: 'nextArtistCard' declared but not used
  const nextArtistCard = () => {
// ... existing code ...
  // State for Favorite Lists carousel
  // const [currentFavoriteListIndex, setCurrentFavoriteListIndex] = useState(0); // TS6133: 'currentFavoriteListIndex' declared but not used
  // Using [1, 2, 3, 4] as placeholder data for favorite lists, update with real data
  // const favoriteListsData = useMemo(() => [1, 2, 3, 4], []); // TS6133: 'favoriteListsData' is declared but its value is never read.

  /* // TS6133: 'nextFavoriteList' declared but not used
  const nextFavoriteList = () => {
// ... existing code ...
*/

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white p-6">
      {/* Hero Section */}
      <HeroSection />

      {/* New Packs */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">New Packs</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {newPacksData.map((pack) => (
            <PackCard 
              key={pack.id} 
              pack={pack} 
              onClick={handlePackClick}
              onPlayTrack={handlePlayPauseTrack}
              onDownloadPack={handleDownloadPack}
              currentPlayingTrackId={globalCurrentTrack?.id}
              isCurrentlyPlaying={isPlaying && globalCurrentTrack?.audioSrc === pack.tracks?.find(t => t.id === globalCurrentTrack?.id)?.audioSrc}
            />
          ))}
        </div>
      </section>

      {/* Top 10 by Genre */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Top 10 by Genre</h2>
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8">
          {Object.entries(
            allTracks.reduce((acc, track) => {
              const genre = track.genre || 'Unknown';
              if (!acc[genre]) {
                acc[genre] = [];
              }
              acc[genre].push(track);
              return acc;
            }, {} as Record<string, PageHomeTrack[]>)
          ).map(([genre, tracks]) => {
            // Sort tracks by number of times they've been seen/played
            const sortedTracks = [...tracks].sort((a, b) => {
              const aSeen = seenTrackIds.has(a.id) ? 1 : 0;
              const bSeen = seenTrackIds.has(b.id) ? 1 : 0;
              return bSeen - aSeen;
            }).slice(0, 10); // Take top 10

            return (
              <div
                key={genre}
                className="bg-gray-800 rounded-lg p-4 w-full min-w-0"
              >
                <h3 className="text-xl font-semibold mb-4 text-white">{genre}</h3>
                <div className="space-y-2">
                  {sortedTracks.map((track, index) => (
                    <div key={track.id} className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-md transition-colors">
                      <div className="w-6 text-center text-gray-400">{index + 1}</div>
                      <button 
                        onClick={() => handlePlayPauseTrack(track)}
                        className="p-1.5 rounded-full hover:bg-gray-600"
                      >
                        {globalCurrentTrack?.id === track.id && isPlaying ? (
                          <PauseIconLucide className="h-4 w-4 text-white" />
                        ) : (
                          <PlayIconLucide className="h-4 w-4 text-white" />
                        )}
                      </button>
                      <div className="flex-grow min-w-0">
                        <Link to={`/track/${track.id}`} className="block w-full font-medium text-white truncate hover:underline" title={track.title}>
                          {track.title}
                        </Link>
                        <p className="block w-full text-xs text-gray-400 truncate">
                          {track.artist.split(',').map((artistName, idx, arr) => {
                            const trimmed = artistName.trim();
                            return (
                              <span key={trimmed}>
                                <Link
                                  to={`/artist/${encodeURIComponent(trimmed)}`}
                                  className="hover:underline cursor-pointer"
                                  title={trimmed}
                                >
                                  {trimmed}
                                </Link>
                                {idx < arr.length - 1 && ', '}
                              </span>
                            );
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{track.bpm} BPM</span>
                        <span>•</span>
                        <span>{track.key}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Personalized Suggestions */}
      <section className="mb-12 relative">
        {/* Question Mark Icon - Positioned top-right of the section */}
        <div className="absolute top-0 right-0 -mt-0.5 mr-1 tooltip tooltip-left" data-tip="Based on your download history">
          <HelpCircle className="h-5 w-5 text-gray-400" />
        </div>

        {/* Title bar with yellow top border */}
        <div className="border-t-4 border-yellow-500 pt-3 pb-3 mb-6 mt-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            <h2 className="text-lg font-semibold text-yellow-500">Personalized suggestions</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          {personalizedSuggestionTracks.map((track) => (
            <div key={track.id} className="bg-gray-800 p-3 rounded-md flex flex-col text-sm">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handlePlayPauseTrack(track)}
                  className="bg-gray-600 hover:bg-gray-500 rounded-full p-2 flex-shrink-0"
                >
                  {globalCurrentTrack?.id === track.id && isPlaying ? (
                    <PauseIconLucide className="h-5 w-5 text-white" fill="white" />
                  ) : (
                    <PlayIconLucide className="h-5 w-5 text-white" fill="white" />
                  )}
                </button>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-1">
                    <Link to={`/track/${track.id}`} className="font-semibold text-white truncate hover:underline" title={track.title}>
                      {track.title}
                    </Link>
                    <button className="p-0.5 text-gray-400 hover:text-white flex-shrink-0">
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs truncate">
                    {track.artist.split(',').map((artistName, idx, arr) => {
                      const trimmed = artistName.trim();
                      return (
                        <span key={trimmed}>
                          <Link
                            to={`/artist/${encodeURIComponent(trimmed)}`}
                            className="hover:underline cursor-pointer"
                            title={trimmed}
                          >
                            {trimmed}
                          </Link>
                          {idx < arr.length - 1 && ', '}
                        </span>
                      );
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button className="flex flex-col items-center text-gray-400 hover:text-white">
                    <Download className="h-5 w-5" />
                    <span className="text-xs mt-0.5">MP3</span>
                  </button>
                  <button className="flex flex-col items-center text-gray-400 hover:text-white">
                    <Download className="h-5 w-5" />
                    <span className="text-xs mt-0.5">WAV</span>
                  </button>
                  <button 
                    onClick={() => handleAddToPlaylist(track.id)}
                    className="flex flex-col items-center text-gray-400 hover:text-white"
                  >
                    <ListPlus className="h-5 w-5" />
                    <span className="text-xs mt-0.5">Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tracks Listing */}
      <section className="mb-12">
        <div className="flex gap-1.5 sm:gap-2 mb-6 pb-2">
          <button
            onClick={() => setSelectedTab('LATEST')}
            className={`px-2 sm:px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center gap-1.5 sm:gap-2 ${
              selectedTab === 'LATEST' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
            <span className="text-xs sm:text-sm whitespace-nowrap">Latest tracks</span>
          </button>
          <button
            onClick={() => setSelectedTab('PAST_WEEK')}
            className={`px-2 sm:px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center gap-1.5 sm:gap-2 ${
              selectedTab === 'PAST_WEEK' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4zM2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5z" />
            </svg>
            <span className="text-xs sm:text-sm whitespace-nowrap">Past week</span>
          </button>
        </div>

        <div className="space-y-2">
          {(selectedTab === 'LATEST' ? sortedTracksForTabs.slice(0, latestTracksToShow) : sortedTracksForTabs).map((track, index) => (
            <div key={track.id} className="bg-gray-800 hover:bg-gray-700 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="w-8 text-gray-400 text-sm hidden sm:block">{index + 1}</div>
                <div className="flex-shrink-0">
                  <input type="checkbox" className="checkbox checkbox-xs bg-gray-700" />
                </div>
                <div className="flex-shrink-0 flex gap-2 items-center">
                  {/* Eye icon for seen status - color changes if seen */}
                  <button className="group relative hidden sm:block">
                     <Eye 
                      className={`h-4 w-4 ${seenTrackIds.has(track.id) ? 'text-blue-500' : 'text-gray-600'}`} 
                    />
                  </button>
                  <button className="w-6 h-6 flex items-center justify-center" onClick={() => handlePlayPauseTrack(track)}>
                    {globalCurrentTrack?.id === track.id && isPlaying ? (
                      <PauseIconLucide className="h-5 w-5 sm:h-4 sm:w-4 text-gray-400" />
                    ) : (
                      <PlayIconLucide className="h-5 w-5 sm:h-4 sm:w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="flex-grow min-w-0">
                  <Link to={`/track/${track.id}`} className="font-medium text-sm truncate hover:underline">
                    {track.title}
                  </Link>
                  <p className="text-xs text-gray-400 truncate">
                    {track.artist.split(',').map((artistName, idx, arr) => {
                      const trimmed = artistName.trim();
                      return (
                        <span key={trimmed}>
                          <Link
                            to={`/artist/${encodeURIComponent(trimmed)}`}
                            className="hover:underline cursor-pointer"
                            title={trimmed}
                          >
                            {trimmed}
                          </Link>
                          {idx < arr.length - 1 && ', '}
                        </span>
                      );
                    })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-4 justify-start sm:justify-end text-xs w-full sm:w-auto pt-2 sm:pt-0 border-t border-gray-700 sm:border-t-0 mt-2 sm:mt-0">
                <div className="flex items-center">
                  <span className="text-gray-400">{track.bpm}</span>
                  <span className="mx-1 text-gray-600">|</span>
                  <span className="text-gray-400">{track.key}</span>
                </div>
                <div className="min-w-[80px] sm:min-w-[100px]">
                  <span className="text-gray-400">{track.genre}</span>
                </div>
                <div>
                  <button className={`px-2 py-0.5 sm:px-3 sm:py-1 text-xs rounded-full ${
                    track.mood === 'Sexy' ? 'bg-pink-500 hover:bg-pink-600' :
                    track.mood === 'Happy' ? 'bg-yellow-500 hover:bg-yellow-600' :
                    track.mood === 'Chilled' ? 'bg-blue-500 hover:bg-blue-600' :
                    'bg-purple-500 hover:bg-purple-600'
                  } text-white whitespace-nowrap`}>
                    {track.mood}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-gray-600 rounded hidden sm:inline-flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="p-1 hover:bg-gray-600 rounded" onClick={() => handleAddToPlaylist(track.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="text-gray-400">{new Date(track.releaseDate).getFullYear()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {selectedTab === 'LATEST' && latestTracksToShow < sortedTracksForTabs.length && (
          <div className="flex justify-center mt-4">
            <button
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold shadow"
              onClick={() => setLatestTracksToShow(latestTracksToShow + 10)}
            >
              Show 10 more
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home; 