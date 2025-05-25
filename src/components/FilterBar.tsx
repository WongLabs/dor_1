import React, { useState } from 'react';
import genres from '../data/genres.json';
import artists from '../data/artists.json';
import moods from '../data/moods.json';
import keys from '../data/keys.json';
import bpm from '../data/bpm.json';

type FilterValue = string | number[] | boolean | null;

interface FilterBarProps {
  onFilterChange: (filterType: string, value: FilterValue) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange }) => {
  const [expandedSections, setExpandedSections] = useState({
    genres: true,
    artists: true,
    moods: true,
    bpm: true,
    key: true
  });

  const [artistSearch, setArtistSearch] = useState('');
  const [bpmRange, setBpmRange] = useState([bpm.bpm_range.min, bpm.bpm_range.max]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filteredArtists = artists.artists.filter(artist =>
    artist.name.toLowerCase().includes(artistSearch.toLowerCase())
  );

  return (
    <div className="w-64 bg-gray-900 text-white h-full overflow-y-auto">
      {/* Genres Section */}
      <div className="border-b border-gray-800">
        <button
          onClick={() => toggleSection('genres')}
          className="flex items-center justify-between w-full p-4 hover:bg-gray-800"
        >
          <div className="flex items-center">
            <span className={`transform transition-transform ${expandedSections.genres ? 'rotate-90' : ''}`}>▶</span>
            <span className="ml-2">Genres</span>
          </div>
        </button>
        {expandedSections.genres && (
          <div className="px-4 pb-4">
            {genres.genres.map(genre => (
              <div key={genre.id} className="flex items-center justify-between py-1">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-500"
                    onChange={() => onFilterChange('genre', genre.id)}
                  />
                  <span className="ml-2">{genre.name}</span>
                </label>
                <span className="text-gray-500 text-sm">{genre.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Artists Section */}
      <div className="border-b border-gray-800">
        <button
          onClick={() => toggleSection('artists')}
          className="flex items-center justify-between w-full p-4 hover:bg-gray-800"
        >
          <div className="flex items-center">
            <span className={`transform transition-transform ${expandedSections.artists ? 'rotate-90' : ''}`}>▶</span>
            <span className="ml-2">Artists</span>
          </div>
        </button>
        {expandedSections.artists && (
          <div className="px-4 pb-4">
            <input
              type="text"
              placeholder="Search artists"
              className="w-full bg-gray-800 text-white rounded px-3 py-2 mb-3"
              value={artistSearch}
              onChange={(e) => setArtistSearch(e.target.value)}
            />
            {filteredArtists.map(artist => (
              <div key={artist.id} className="flex items-center justify-between py-1">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-500"
                    onChange={() => onFilterChange('artist', artist.id)}
                  />
                  <span className="ml-2">{artist.name}</span>
                </label>
                <span className="text-gray-500 text-sm">{artist.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Moods Section */}
      <div className="border-b border-gray-800">
        <button
          onClick={() => toggleSection('moods')}
          className="flex items-center justify-between w-full p-4 hover:bg-gray-800"
        >
          <div className="flex items-center">
            <span className={`transform transition-transform ${expandedSections.moods ? 'rotate-90' : ''}`}>▶</span>
            <span className="ml-2">Moods</span>
          </div>
        </button>
        {expandedSections.moods && (
          <div className="px-4 pb-4">
            {moods.moods.map(mood => (
              <div key={mood.id} className="flex items-center justify-between py-1">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-500"
                    onChange={() => onFilterChange('mood', mood.id)}
                  />
                  <span className="ml-2">{mood.name}</span>
                </label>
                <span className="text-gray-500 text-sm">{mood.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BPM Section */}
      <div className="border-b border-gray-800">
        <button
          onClick={() => toggleSection('bpm')}
          className="flex items-center justify-between w-full p-4 hover:bg-gray-800"
        >
          <div className="flex items-center">
            <span className={`transform transition-transform ${expandedSections.bpm ? 'rotate-90' : ''}`}>▶</span>
            <span className="ml-2">Bpm</span>
          </div>
        </button>
        {expandedSections.bpm && (
          <div className="px-4 pb-4">
            <div className="flex justify-between mb-2">
              <span>{bpmRange[0]}</span>
              <span>{bpmRange[1]}</span>
            </div>
            <input
              type="range"
              min={bpm.bpm_range.min}
              max={bpm.bpm_range.max}
              value={bpmRange[1]}
              onChange={(e) => {
                const newRange = [bpmRange[0], parseInt(e.target.value)];
                setBpmRange(newRange);
                onFilterChange('bpm', newRange);
              }}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Harmonic Key Section */}
      <div className="border-b border-gray-800">
        <button
          onClick={() => toggleSection('key')}
          className="flex items-center justify-between w-full p-4 hover:bg-gray-800"
        >
          <div className="flex items-center">
            <span className={`transform transition-transform ${expandedSections.key ? 'rotate-90' : ''}`}>▶</span>
            <span className="ml-2">Harmonic Key</span>
          </div>
        </button>
        {expandedSections.key && (
          <div className="px-4 pb-4">
            <div className="relative w-full aspect-square">
              <img 
                src="/images/camelot-wheel.png" 
                alt="Camelot Wheel" 
                className="w-full"
              />
              <div className="text-center mt-2">
                <a href="#" className="text-blue-400 text-sm">Discover Camelot Wheel</a>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-4">
              {keys.keys.map(key => (
                <button
                  key={key.id}
                  onClick={() => onFilterChange('key', key.id)}
                  className="p-2 text-sm bg-gray-800 hover:bg-gray-700 rounded"
                >
                  {key.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar; 