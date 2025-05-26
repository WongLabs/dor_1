import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import AudioPlayer from './components/AudioPlayer';
import Moods from './pages/Moods';
import Home from './pages/Home';
import FilteredMood from './pages/FilteredMood';
import Genres from './pages/Genres';
import DownloadLists from './pages/DownloadLists';
import TrackDetail from './pages/TrackDetail';
import AllArtistsPage from './pages/AllArtistsPage';
import ArtistPage from './pages/ArtistPage';
import PackDetailPage from './pages/PackDetailPage';
import { CurrentTrackProvider } from './contexts/CurrentTrackContext';

const App = () => {
  return (
    <CurrentTrackProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 flex flex-col">
          <Header />
          <main className="flex-grow overflow-y-auto pb-14">
            {/* Routes */}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/artists" element={<AllArtistsPage />} />
              <Route path="/artist/:artistName" element={<ArtistPage />} />
              <Route path="/genres" element={<Genres />} />
              <Route path="/moods" element={<Moods />} />
              <Route path="/music" element={<FilteredMood />} />
              <Route path="/my-list" element={<DownloadLists />} />
              <Route path="/track/:trackId" element={<TrackDetail />} />
              <Route path="/pack/:packId" element={<PackDetailPage />} />
            </Routes>
          </main>
          <AudioPlayer />
        </div>
      </Router>
    </CurrentTrackProvider>
  );
};

export default App;
