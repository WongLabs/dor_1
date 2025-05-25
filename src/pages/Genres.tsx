import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import genres from '../data/genres.json';
import tracks from '../data/packs.json';
import '../styles/Genres.css';

const Genres = () => {
  // Calculate track counts from packs.json
  const trackCounts = useMemo(() => {
    return tracks.tracks.reduce((acc, track) => {
      const genreId = track.genre.toLowerCase().replace(/[&\s]/g, '_').replace(/[']/g, '');
      acc[genreId] = (acc[genreId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, []);

  // Group genres by category and update counts
  const groupedGenres = useMemo(() => {
    return genres.genres.reduce((acc, genre) => {
      const actualCount = trackCounts[genre.id] || 0;
      // Only include genres that have tracks
      if (actualCount > 0) {
        if (!acc[genre.category]) {
          acc[genre.category] = [];
        }
        acc[genre.category].push({
          ...genre,
          count: actualCount
        });
      }
      return acc;
    }, {} as Record<string, typeof genres.genres>);
  }, [trackCounts]);

  // Calculate total tracks per category
  const categoryTotals = useMemo(() => {
    return Object.entries(groupedGenres).reduce((acc, [category, categoryGenres]) => {
      acc[category] = categoryGenres.reduce((sum, genre) => sum + genre.count, 0);
      return acc;
    }, {} as Record<string, number>);
  }, [groupedGenres]);

  const GenreCard = ({ genre }: { genre: typeof genres.genres[0] }) => (
    <Link 
      to={`/music?genre=${genre.id}`}
      className="genre-card bg-base-200 hover:bg-base-300 transition-all duration-300 rounded-lg p-4"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-2xl">🎵</span>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-lg">{genre.name}</h3>
          <p className="text-sm text-gray-400">{genre.count} track{genre.count !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Genres</h1>
      
      {Object.entries(groupedGenres).map(([category, categoryGenres]) => (
        <section key={category} className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">{category}</h2>
            <span className="text-sm text-gray-400">{categoryTotals[category]} track{categoryTotals[category] !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryGenres.map((genre) => (
              <GenreCard key={genre.id} genre={genre} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default Genres; 