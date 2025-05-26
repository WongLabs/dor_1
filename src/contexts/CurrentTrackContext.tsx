import { createContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

// Attempt to import TrackDetail type. Adjust the path if your types are elsewhere.
// If TrackDetail is complex and only defined in TrackDetail.tsx,
// we might need a shared types file or define a simpler CurrentPlayingTrack type here.
import { type TrackDetail } from '../pages/TrackDetail';

// If the direct import causes issues (e.g., circular dependencies or if TrackDetail.tsx is not module-like yet for its type),
// define a minimal structure here for now.
// For example:
// export interface CurrentPlayingTrack {
//   id: string;
//   title: string;
//   artist: string;
//   audioUrl: string;
//   waveform: string;
//   bpm: number;
//   key: string;
//   trackLength: string;
//   // Add other essential fields needed by TrackDetail and AudioPlayer
// }

interface CurrentTrackContextType {
  currentTrack: TrackDetail | null;
  setCurrentTrack: Dispatch<SetStateAction<TrackDetail | null>>;
}

export const CurrentTrackContext = createContext<CurrentTrackContextType | undefined>(undefined);

export const CurrentTrackProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<TrackDetail | null>(null);

  return (
    <CurrentTrackContext.Provider value={{ currentTrack, setCurrentTrack }}>
      {children}
    </CurrentTrackContext.Provider>
  );
}; 