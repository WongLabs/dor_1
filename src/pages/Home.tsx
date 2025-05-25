import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  HelpCircle,
  Play as PlayIconLucide,
  Pause as PauseIconLucide,
  Info,
  Download,
  ListPlus
} from 'lucide-react';
import TrackCard, { TrackCardType } from '../components/TrackCard';
import PackCard, { PackCardType } from '../components/PackCard';
import tracksData from '../data/packs.json';
import playlists from '../data/playlists.json';
import useAudioStore from '../stores/audioStore';

interface PageHomeTrack extends TrackCardType {}

interface PageHomePack extends PackCardType {}

const SORT_OPTIONS = {
  RECENT: 'recent',
  TRENDING: 'trending',
  TOP_RATED: 'top_rated',
} as const;

type TabType = 'LATEST' | 'TRENDING' | 'TOP_YEAR';

const Home = () => {
  const [sortBy, setSortBy] = useState<keyof typeof SORT_OPTIONS>('RECENT');
  const [selectedTab, setSelectedTab] = useState<TabType>('LATEST');
  const navigate = useNavigate();

  const { loadTrack, currentTrack: globalCurrentTrack, isPlaying, togglePlayPause, setPlayIntent } = useAudioStore();

  const allTracks: PageHomeTrack[] = useMemo(() => tracksData.tracks.map((t: any): PageHomeTrack => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    bpm: t.bpm || 120,
    key: t.key || 'N/A',
    mood: t.mood || 'Unknown',
    genre: t.genre || 'Unknown',
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
  })), []);

  const newPacksData: PageHomePack[] = useMemo(() => playlists.playlists.slice(0, 5).map((p: any): PageHomePack => ({
    id: p.id,
    name: p.name,
    trackCount: p.trackIds.length,
    imageUrl: `https://picsum.photos/seed/${p.id}/200/200` // Placeholder image
  })), []);

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
    console.log('Add to playlist:', trackId);
  };

  const handlePackClick = (packId: string) => {
    navigate(`/pack/${packId}`);
  };

  const sortedTracksForTabs = useMemo(() => {
    let tracksToFilter = [...allTracks];
    switch (selectedTab) {
      case 'LATEST':
        return tracksToFilter.sort((a, b) => 
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        );
      case 'TRENDING':
        return tracksToFilter.sort((a, b) => (b.bpm || 0) - (a.bpm || 0));
      case 'TOP_YEAR':
        return tracksToFilter.filter(track => 
          new Date(track.releaseDate).getFullYear() === new Date().getFullYear()
        ).sort((a, b) => (b.bpm || 0) - (a.bpm || 0));
      default:
        return tracksToFilter;
    }
  }, [selectedTab, allTracks]);

  const personalizedSuggestionTracks = useMemo(() => allTracks.slice(0, 9), [allTracks]);
  
  const genericSectionTracks = useMemo(() => allTracks.slice(0, 6), [allTracks]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Top DJ Chart */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Top DJ Chart</h2>
          <div className="tabs tabs-boxed bg-gray-800">
            <button
              className={`tab ${sortBy === 'RECENT' ? 'tab-active' : ''}`}
              onClick={() => setSortBy('RECENT')}
            >
              Recent
            </button>
            <button
              className={`tab ${sortBy === 'TRENDING' ? 'tab-active' : ''}`}
              onClick={() => setSortBy('TRENDING')}
            >
              Trending
            </button>
            <button
              className={`tab ${sortBy === 'TOP_RATED' ? 'tab-active' : ''}`}
              onClick={() => setSortBy('TOP_RATED')}
            >
              Top Rated
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {genericSectionTracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onPlay={handlePlayPauseTrack}
              onAddToPlaylist={handleAddToPlaylist}
              isPlaying={globalCurrentTrack?.id === track.id && isPlaying}
            />
          ))}
        </div>
      </section>

      {/* New Packs */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">New Packs</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {newPacksData.map((pack) => (
            <PackCard 
              key={pack.id} 
              pack={pack} 
              onClick={handlePackClick} 
            />
          ))}
        </div>
      </section>

      {/* Latest Tracks */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Latest Packs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {genericSectionTracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onPlay={handlePlayPauseTrack}
              onAddToPlaylist={handleAddToPlaylist}
              isPlaying={globalCurrentTrack?.id === track.id && isPlaying}
            />
          ))}
        </div>
      </section>

      {/* Dor's Playlists */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Dor's Playlists</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {/* Sample Pack Cards */}
          {[1, 2, 3, 4, 5].map((playlists) => (
            <div
              key={playlists}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors aspect-square flex flex-col justify-between"
            >
              <div className="h-32 bg-gray-700 rounded-lg mb-4"></div>
              <div>
                <h3 className="font-semibold">Pack {playlists}</h3>
                <p className="text-gray-400 text-sm">10 tracks</p>
              </div>
            </div>
          ))}
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
                    <span className="font-semibold text-white truncate" title={track.title}>{track.title}</span>
                    <button className="p-0.5 text-gray-400 hover:text-white flex-shrink-0">
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs truncate" title={track.artist}>{track.artist}</p>
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

      {/* Artists and Favorites Row */}
      <div className="flex gap-6 mb-12">
        {/* Artists of the moment */}
        <section className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <h2 className="text-2xl font-bold">Artists of the moment</h2>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-orange-500 hover:text-orange-400">All artists →</a>
              <div className="flex gap-2">
                <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {tracksData.tracks.slice(0, 2).map((track) => (
              <div key={track.id} className="min-w-[240px] bg-gray-800 rounded-lg p-4">
                <div className="w-full aspect-square bg-gray-700 rounded-lg mb-4"></div>
                <h3 className="font-bold mb-1">{track.artist}</h3>
                <p className="text-sm text-gray-400">{Math.floor(Math.random() * 20 + 1)} tracks recently added</p>
                <button className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-full text-sm hover:bg-orange-400">
                  Discover
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Favorite Lists */}
        <section className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <h2 className="text-2xl font-bold">Favorite lists</h2>
            </div>
            <a href="#" className="text-pink-500 hover:text-pink-400">All user lists →</a>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2].map((list) => (
              <div key={list} className="min-w-[240px] bg-gray-800 rounded-lg p-4">
                <div className="relative">
                  <div className="w-full aspect-square bg-gray-700 rounded-lg mb-4"></div>
                  <div className="absolute top-2 right-2 px-3 py-1 bg-pink-500 text-white text-xs rounded-full">
                    Top list in March 2024
                  </div>
                </div>
                <h3 className="font-bold mb-1">Soirée 80's danse {list}</h3>
                <p className="text-sm text-gray-400">{Math.floor(Math.random() * 100 + 50)} tracks</p>
                <p className="text-xs text-orange-500 mt-1">Last updated Dec 17 2024</p>
                <button className="mt-3 w-full px-4 py-2 bg-pink-500 text-white rounded-full text-sm hover:bg-pink-400">
                  Discover
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Tracks Listing */}
      <section className="mb-12">
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setSelectedTab('LATEST')}
            className={`px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center gap-2 ${
              selectedTab === 'LATEST' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
            Latest tracks
          </button>
          <button 
            onClick={() => setSelectedTab('TRENDING')}
            className={`px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center gap-2 ${
              selectedTab === 'TRENDING' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            Trending
          </button>
          <button 
            onClick={() => setSelectedTab('TOP_YEAR')}
            className={`px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center gap-2 ${
              selectedTab === 'TOP_YEAR' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Top year
          </button>
        </div>

        <div className="space-y-2">
          {sortedTracksForTabs.map((track, index) => (
            <div key={track.id} className="bg-gray-800 hover:bg-gray-700 rounded-lg p-3 flex items-center gap-4">
              <div className="w-8 text-gray-400 text-sm">{index + 1}</div>
              <div className="flex-shrink-0">
                <input type="checkbox" className="checkbox checkbox-xs bg-gray-700" />
              </div>
              <div className="flex-shrink-0 flex gap-2">
                <button className="group relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="w-6 h-6 flex items-center justify-center" onClick={() => handlePlayPauseTrack(track)}>
                  {globalCurrentTrack?.id === track.id && isPlaying ? (
                    <PauseIconLucide className="h-4 w-4 text-gray-400" />
                  ) : (
                    <PlayIconLucide className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-medium text-sm truncate">{track.title}</h3>
                <p className="text-xs text-gray-400 truncate">{track.artist}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center text-xs">
                  <span className="text-gray-400">{track.bpm}</span>
                  <span className="mx-1 text-gray-600">|</span>
                  <span className="text-gray-400">{track.key}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 min-w-[120px]">
                <span className="text-xs text-gray-400">{track.genre}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className={`px-3 py-1 text-xs rounded-full ${
                  track.mood === 'Sexy' ? 'bg-pink-500 hover:bg-pink-600' :
                  track.mood === 'Happy' ? 'bg-yellow-500 hover:bg-yellow-600' :
                  track.mood === 'Chilled' ? 'bg-blue-500 hover:bg-blue-600' :
                  'bg-purple-500 hover:bg-purple-600'
                } text-white`}>
                  {track.mood}
                </button>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button className="p-1 hover:bg-gray-600 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="p-1 hover:bg-gray-600 rounded" onClick={() => handleAddToPlaylist(track.id)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="text-xs text-gray-400">{new Date(track.releaseDate).getFullYear()}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home; 