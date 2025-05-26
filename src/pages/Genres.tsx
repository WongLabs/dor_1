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
      className="genre-card group bg-base-200 hover:bg-base-300 active:bg-base-100 transition-all duration-200 rounded-xl p-4 sm:p-5 border border-transparent hover:border-primary/20 shadow-sm hover:shadow-md"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
          <span className="text-xl sm:text-2xl">🎵</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg text-base-content group-hover:text-primary transition-colors duration-200 truncate">
            {genre.name}
          </h3>
          <p className="text-sm sm:text-base text-base-content opacity-60 mt-0.5">
            {genre.count} track{genre.count !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-gray-500 group-hover:text-primary transition-colors duration-200 opacity-60 group-hover:opacity-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral to-neutral-focus text-neutral-content">
      {/* Header */}
      <div className="sticky top-0 bg-neutral/90 backdrop-blur-sm border-b border-neutral-focus z-10">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Genres
          </h1>
          <p className="text-sm sm:text-base mt-1 sm:mt-2">
            Discover music by genre
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-12 max-w-7xl mx-auto">
        {Object.entries(groupedGenres).map(([category, categoryGenres]) => (
          <section key={category} className="space-y-4 sm:space-y-6">
            {/* Category Header */}
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                {category}
              </h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                  {categoryTotals[category]} track{categoryTotals[category] !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Genre Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {categoryGenres.map((genre) => (
                <GenreCard key={genre.id} genre={genre} />
              ))}
            </div>
          </section>
        ))}

        {/* Empty State */}
        {Object.keys(groupedGenres).length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl sm:text-3xl">🎵</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No genres found</h3>
            <p className="text-sm sm:text-base max-w-md mx-auto">
              It looks like there are no tracks available yet. Check back later for more music!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Genres; 