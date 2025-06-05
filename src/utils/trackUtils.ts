import { type PackTrack } from '../pages/FilteredMood'; // Assuming PackTrack is needed and path is correct
import actualTracksDataModule from '../data/packs.json'; // Path relative to src/utils/
import bpmDataFromFile from '../data/bpm.json'; // Add this import

// Define a type for bpm.json structure with string index signature
interface BpmInfo { bpm: number; source: string; confidence: number; }
interface BpmData {
  trackSpecificBPMs: { [trackId: string]: BpmInfo };
  bpm_range?: any;
}

const bpmDataTyped: BpmData = bpmDataFromFile as BpmData;

// Utility function to convert music key from standard notation to Camelot system.
export const convertToCamelot = (key: string): string => {
  const majorCamelotMap: { [key: string]: string } = {
    'B': '1B', 'F#': '2B', 'Db': '3B', 'Ab': '4B', 'Eb': '5B',
    'Bb': '6B', 'F': '7B', 'C': '8B', 'G': '9B', 'D': '10B',
    'A': '11B', 'E': '12B'
  };
  const minorCamelotMap: { [key: string]: string } = {
    'Abm': '1A', 'Ebm': '2A', 'Bbm': '3A', 'Fm': '4A', 'Cm': '5A',
    'Gm': '6A', 'Dm': '7A', 'Am': '8A', 'Em': '9A', 'Bm': '10A',
    'F#m': '11A', 'C#m': '12A' // Also Db minor is C#m
  };

  if (majorCamelotMap[key]) {
    return majorCamelotMap[key];
  }
  if (minorCamelotMap[key]) {
    return minorCamelotMap[key];
  }
  return 'N/A'; // Or throw an error, or handle as preferred
};

// Utility function to parse track length (e.g., "3:45") to seconds
export const parseTrackLengthToSeconds = (trackLength: string | undefined): number => {
  if (!trackLength || typeof trackLength !== 'string') return 0;
  const parts = trackLength.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      return minutes * 60 + seconds;
    }
  }
  console.warn(`Could not parse trackLength: ${trackLength}`);
  return 0;
};

// Format time utility
export const formatTime = (time: number): string => {
  if (isNaN(time) || time === Infinity) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(Math.abs(time % 60)).toString().padStart(2, '0'); // Use Math.abs for seconds
  return `${minutes}:${seconds}`;
};

// Throttle utility function
export const throttle = (func: (...args: any[]) => any, limit: number): ((...args: any[]) => any) => {
  let lastFunc: NodeJS.Timeout | undefined;
  let lastRan: number | undefined;
  let inThrottle: boolean = false; // To track if we are in a throttle window after an initial call

  return function(this: any, ...args: any[]) {
    const context = this;
    let result: any;

    if (!inThrottle) { // If not in a throttle window, execute immediately
      result = func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
      if (lastFunc) clearTimeout(lastFunc); // Clear any previous lingering timer
      lastFunc = setTimeout(() => {
        inThrottle = false; // Reset throttle window after limit
        // If there was a call during the throttle window, it would have been queued by a more complex throttle.
        // This simpler version just resets the window.
      }, limit);
    } else { // In a throttle window, queue the last call
      if (lastFunc) {
        clearTimeout(lastFunc);
      }
      lastFunc = setTimeout(() => {
        // Check if enough time has passed since last execution before running the queued call
        if (Date.now() - (lastRan || 0) >= limit) {
          result = func.apply(context, args); // Execute the queued call
          lastRan = Date.now();
        }
        // Always reset inThrottle after the timeout for the queued call, 
        // regardless of whether it executed or not, to allow new calls.
        inThrottle = false; 
      }, limit); 
      // For this simpler throttle, we don't return the result of the queued call from the main function call.
    }
    return result; // Returns result of immediate call, or undefined for throttled calls.
  }
}; 

// Utility function to get tracks data (encapsulates the .default access)
export const getTracksData = (): PackTrack[] | undefined => {
  // Try to access .default first, as it might be an ES module default export
  let tracks = (actualTracksDataModule as any)?.default;

  // If .default is undefined or not an array, try using the module directly
  if (!Array.isArray(tracks)) {
    tracks = actualTracksDataModule;
  }

  // If tracks is still not an array, try accessing the .tracks property
  if (!Array.isArray(tracks) && tracks && typeof tracks === 'object' && 'tracks' in tracks) {
    tracks = tracks.tracks;
  }

  // Further check if tracks is indeed an array of PackTrack before returning
  if (Array.isArray(tracks) && tracks.every(track => typeof track === 'object' && track !== null && 'id' in track)) {
    return tracks as PackTrack[];
  }
  console.warn('[getTracksData] actualTracksDataModule was not the expected array of tracks:', actualTracksDataModule);
  return undefined;
}; 

// Utility function to get BPM for a track, prioritizing bpm.json
export const getTrackBpm = (trackId: string, fallbackBpm?: number): number | undefined => {
  const bpmEntry = bpmDataTyped.trackSpecificBPMs?.[trackId];
  if (bpmEntry && typeof bpmEntry.bpm === 'number') {
    return bpmEntry.bpm;
  }
  return fallbackBpm;
}; 