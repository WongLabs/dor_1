import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import tracksData from '../data/packs.json'; // Assuming tracks have artist info
import { Search, ChevronDown } from 'lucide-react';

// Define a simple artist type based on track data for now
interface Artist {
  name: string;
  trackCount: number;
  // Add imageUrl if available, otherwise use a placeholder
  imageUrl?: string; 
}

const AllArtistsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('Count'); // or 'Name'

  const artists = useMemo(() => {
    const artistMap = new Map<string, number>();
    tracksData.tracks.forEach(track => {
      const count = artistMap.get(track.artist) || 0;
      artistMap.set(track.artist, count + 1);
    });

    const uniqueArtists: Artist[] = Array.from(artistMap.entries()).map(([name, trackCount]) => ({
      name,
      trackCount,
      // Placeholder image - replace with actual image logic if available
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=128` 
    }));

    // Filter by search term
    let filtered = uniqueArtists.filter(artist => 
      artist.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort
    if (sortOrder === 'Count') {
      filtered.sort((a, b) => b.trackCount - a.trackCount);
    } else if (sortOrder === 'Name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [searchTerm, sortOrder]);

  // TODO: Implement A-Z filtering logic if needed

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="container mx-auto">
        {/* Breadcrumbs */}
        <div className="text-sm text-gray-400 mb-4">
          <Link to="/" className="hover:text-white">Home</Link> / 
          <span className="text-white">Artists</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 md:gap-0">
          <h1 className="text-3xl font-bold order-1 md:order-none">Artists</h1>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full md:w-auto order-2 md:order-none">
            <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
              <input 
                type="text"
                placeholder="Search Artists"
                className="bg-gray-800 border border-gray-700 rounded-md py-2.5 px-4 pl-10 text-sm focus:outline-none focus:border-blue-500 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <div className="relative w-full sm:w-auto">
              <button 
                onClick={() => setSortOrder(sortOrder === 'Count' ? 'Name' : 'Count')} 
                className="bg-gray-800 border border-gray-700 rounded-md py-2.5 px-3 text-sm flex items-center justify-center sm:justify-start gap-2 hover:bg-gray-700 w-full"
              >
                <span className="sm:hidden">Sort</span> {/* Hidden on sm and up */}
                <span className="hidden sm:inline">Sort by: {sortOrder}</span> {/* Visible on sm and up */}
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* A-Z Filter has been removed */}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {artists.map(artist => (
            <Link key={artist.name} to={`/artist/${encodeURIComponent(artist.name)}`} className="block group">
              <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all duration-200 flex flex-col items-center text-center">
                <img 
                  src={artist.imageUrl} 
                  alt={artist.name} 
                  className="w-24 h-24 rounded-full mb-3 object-cover border-2 border-gray-700 group-hover:border-blue-500"
                />
                <h3 className="font-semibold text-md truncate w-full" title={artist.name}>{artist.name}</h3>
                <p className="text-xs text-gray-400">{artist.trackCount} tracks</p>
              </div>
            </Link>
          ))}
        </div>
        {artists.length === 0 && searchTerm && (
          <p className="text-center text-gray-400 mt-8">No artists found for "{searchTerm}".</p>
        )}
      </div>
    </div>
  );
};

export default AllArtistsPage; 