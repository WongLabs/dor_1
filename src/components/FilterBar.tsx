import React, { useState } from 'react';
import genres from '../data/genres.json';
import artists from '../data/artists.json';
import moods from '../data/moods.json';
import keys from '../data/keys.json';
import bpm from '../data/bpm.json';

type FilterValue = string | number[] | boolean | null;

interface FilterBarProps {
  onFilterChange: (filterType: string, value: FilterValue) => void;
  isMobileView?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange, isMobileView }) => {
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

  // Mobile column classes
  const mobileColumnBaseClass = "w-52 sm:w-56 flex-shrink-0 h-full overflow-y-auto p-3";
  const mobileSectionButtonClass = "flex items-center justify-between w-full py-3 px-1 hover:bg-gray-800 rounded-md text-left";
  const mobileSectionContentClass = "pt-2 pb-3 pl-1 pr-2 text-sm";

  // Desktop section classes (original styling)
  const desktopSectionContainerClass = "border-b border-gray-800";
  const desktopSectionButtonClass = "flex items-center justify-between w-full p-4 hover:bg-gray-800 text-left";
  const desktopSectionContentClass = "px-4 pb-4 text-sm";

  return (
    <div 
      className={`
        ${isMobileView 
          ? 'flex flex-row overflow-x-auto bg-gray-850 no-scrollbar h-[calc(40vh-3rem)]' 
          : 'h-full overflow-y-auto bg-gray-900' // Desktop: vertical scroll, specific bg for desktop sidebar if needed
        }
      `}
    >
      {/* Genres Section */}
      <div className={`${isMobileView ? mobileColumnBaseClass + ' border-r border-gray-700/50' : desktopSectionContainerClass}`}>
        <button
          onClick={() => toggleSection('genres')}
          className={isMobileView ? mobileSectionButtonClass : desktopSectionButtonClass}
        >
          <div className="flex items-center">
            <span className={`transform transition-transform text-gray-400 ${expandedSections.genres ? 'rotate-90' : ''}`}>▶</span>
            <span className="ml-2 font-medium">Genres</span>
          </div>
        </button>
        {expandedSections.genres && (
          <div className={isMobileView ? mobileSectionContentClass : desktopSectionContentClass}>
            {genres.genres.map(genre => (
              <div key={genre.id} className={`flex items-center justify-between ${isMobileView ? 'py-1.5' : 'py-1'}`}>
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    className={`form-checkbox h-3.5 w-3.5 text-blue-500 rounded-sm focus:ring-blue-500 focus:ring-offset-0 
                                ${isMobileView ? 'bg-gray-700 border-gray-600 focus:ring-offset-gray-850' : 'bg-gray-800 border-gray-700 focus:ring-offset-gray-900'}`}
                    onChange={() => onFilterChange('genre', genre.id)}
                  />
                  <span className={`ml-2 ${isMobileView ? 'group-hover:text-white text-gray-300' : 'text-gray-200 group-hover:text-white'}`}>{genre.name}</span>
                </label>
                <span className="text-gray-500 text-xs">{genre.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Artists Section */}
      <div className={`${isMobileView ? mobileColumnBaseClass + ' border-r border-gray-700/50' : desktopSectionContainerClass}`}>
        <button
          onClick={() => toggleSection('artists')}
          className={isMobileView ? mobileSectionButtonClass : desktopSectionButtonClass}
        >
          <div className="flex items-center">
            <span className={`transform transition-transform text-gray-400 ${expandedSections.artists ? 'rotate-90' : ''}`}>▶</span>
            <span className="ml-2 font-medium">Artists</span>
          </div>
        </button>
        {expandedSections.artists && (
          <div className={isMobileView ? mobileSectionContentClass : desktopSectionContentClass}>
            <input
              type="text"
              placeholder="Search artists"
              className={`w-full text-white rounded text-sm mb-2.5 focus:ring-1 focus:ring-blue-500 border border-transparent focus:border-blue-500 
                          ${isMobileView ? 'bg-gray-700/80 px-3 py-1.5' : 'bg-gray-800 px-3 py-2'}`}
              value={artistSearch}
              onChange={(e) => setArtistSearch(e.target.value)}
            />
            {filteredArtists.map(artist => (
              <div key={artist.id} className={`flex items-center justify-between ${isMobileView ? 'py-1.5' : 'py-1'}`}>
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                     className={`form-checkbox h-3.5 w-3.5 text-blue-500 rounded-sm focus:ring-blue-500 focus:ring-offset-0 
                                ${isMobileView ? 'bg-gray-700 border-gray-600 focus:ring-offset-gray-850' : 'bg-gray-800 border-gray-700 focus:ring-offset-gray-900'}`}
                    onChange={() => onFilterChange('artist', artist.id)}
                  />
                  <span className={`ml-2 ${isMobileView ? 'group-hover:text-white text-gray-300' : 'text-gray-200 group-hover:text-white'}`}>{artist.name}</span>
                </label>
                <span className="text-gray-500 text-xs">{artist.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Moods Section */}
      <div className={`${isMobileView ? mobileColumnBaseClass + ' border-r border-gray-700/50' : desktopSectionContainerClass}`}>
        <button
          onClick={() => toggleSection('moods')}
          className={isMobileView ? mobileSectionButtonClass : desktopSectionButtonClass}
        >
          <div className="flex items-center">
            <span className={`transform transition-transform text-gray-400 ${expandedSections.moods ? 'rotate-90' : ''}`}>▶</span>
            <span className="ml-2 font-medium">Moods</span>
          </div>
        </button>
        {expandedSections.moods && (
          <div className={isMobileView ? mobileSectionContentClass : desktopSectionContentClass}>
            {moods.moods.map(mood => (
              <div key={mood.id} className={`flex items-center justify-between ${isMobileView ? 'py-1.5' : 'py-1'}`}>
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                     className={`form-checkbox h-3.5 w-3.5 text-blue-500 rounded-sm focus:ring-blue-500 focus:ring-offset-0 
                                ${isMobileView ? 'bg-gray-700 border-gray-600 focus:ring-offset-gray-850' : 'bg-gray-800 border-gray-700 focus:ring-offset-gray-900'}`}
                    onChange={() => onFilterChange('mood', mood.id)}
                  />
                  <span className={`ml-2 ${isMobileView ? 'group-hover:text-white text-gray-300' : 'text-gray-200 group-hover:text-white'}`}>{mood.name}</span>
                </label>
                <span className="text-gray-500 text-xs">{mood.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BPM Section */}
      <div className={`${isMobileView ? mobileColumnBaseClass + ' border-r border-gray-700/50' : desktopSectionContainerClass}`}>
        <button
          onClick={() => toggleSection('bpm')}
          className={isMobileView ? mobileSectionButtonClass : desktopSectionButtonClass}
        >
          <div className="flex items-center">
            <span className={`transform transition-transform text-gray-400 ${expandedSections.bpm ? 'rotate-90' : ''}`}>▶</span>
            <span className="ml-2 font-medium">BPM</span>
          </div>
        </button>
        {expandedSections.bpm && (
          <div className={`${isMobileView ? mobileSectionContentClass : desktopSectionContentClass} space-y-2`}>
            <div className="flex justify-between text-xs text-gray-300">
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
                if (newRange[1] >= newRange[0]) { 
                    setBpmRange(newRange);
                    onFilterChange('bpm', newRange);
                }
              }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        )}
      </div>

      {/* Harmonic Key Section */}
      <div className={`${isMobileView ? mobileColumnBaseClass : desktopSectionContainerClass}`}> {/* Last column on mobile, no right border */}
        <button
          onClick={() => toggleSection('key')}
          className={isMobileView ? mobileSectionButtonClass : desktopSectionButtonClass}
        >
          <div className="flex items-center">
            <span className={`transform transition-transform text-gray-400 ${expandedSections.key ? 'rotate-90' : ''}`}>▶</span>
            <span className="ml-2 font-medium">Harmonic Key</span>
          </div>
        </button>
        {expandedSections.key && (
          <div className={`${isMobileView ? mobileSectionContentClass : desktopSectionContentClass} space-y-3`}>
            {/* Image and Discover link REMOVED */}
            {/* <div className="relative w-full aspect-square max-w-[180px] mx-auto">
              <img 
                src="/images/camelot-wheel.png" 
                alt="Camelot Wheel" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center">
                <a href="#" className="text-blue-400 text-xs hover:underline">Discover Camelot Wheel</a>
            </div> */}
            <div className={`grid gap-1.5 ${isMobileView ? 'grid-cols-4' : 'grid-cols-4'}`}> {/* Adjusted to grid-cols-4 for mobile for better fit if possible, or can revert to 3 if too cramped */}
              {keys.keys.map(key => (
                <button
                  key={key.id}
                  onClick={() => onFilterChange('key', key.id)}
                  className={`text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-150
                              ${isMobileView ? 'p-2 bg-gray-700 hover:bg-gray-600' : 'p-2 bg-gray-800 hover:bg-gray-700'}`}
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