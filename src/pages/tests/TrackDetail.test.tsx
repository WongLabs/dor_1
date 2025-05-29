// import React from 'react'; // TS6133: 'React' is declared but its value is never read.
import { render, screen, /* fireEvent, waitFor, */ act } from '@testing-library/react'; // TS6133: fireEvent, waitFor unused
import { describe, it, expect, vi, beforeEach } from 'vitest';
// import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom'; // TS6192: All imports in import declaration are unused.
// const actualUseParams = vi.fn(); // TS6133: 'actualUseParams' is declared but its value is never read.

// Hoisted Mocks (e.g., for audioStore)
const hoistedMocks = vi.hoisted(() => {
  const mockAudioStoreState = {
    currentTrack: null as AudioStoreTrack | null,
    isPlaying: false,
    playTrack: vi.fn(),
    pauseTrack: vi.fn(),
    togglePlayPause: vi.fn(() => {
      mockAudioStoreState.isPlaying = !mockAudioStoreState.isPlaying;
      console.log(`[TestMock togglePlayPause] New isPlaying state: ${mockAudioStoreState.isPlaying}`);
    }),
    seekTo: vi.fn(),
    setVolume: vi.fn(),
    subscribeToCurrentTime: vi.fn(() => vi.fn()),
    subscribeToWaveSurferReady: vi.fn(() => vi.fn()),
    audioElement: null,
    duration: 0,
    currentTime: 0,
    isReady: false,
    error: null,
    playAudioSource: vi.fn(),
    loadTrack: vi.fn((trackToLoad: AudioStoreTrack) => {
      console.log(`[TestMock loadTrack] Loading track: ${trackToLoad.id}, currentTrack before: ${mockAudioStoreState.currentTrack?.id}`);
      mockAudioStoreState.currentTrack = trackToLoad;
      const fullTrackData = mockTrackDataArray.find(t => t.id === trackToLoad.id);
      mockAudioStoreState.duration = fullTrackData?.duration_ms ? fullTrackData.duration_ms / 1000 : 240;
      mockAudioStoreState.currentTime = 0;
      mockAudioStoreState.isReady = true;
      console.log(`[TestMock loadTrack] Loaded. currentTrack: ${mockAudioStoreState.currentTrack?.id}, isPlaying: ${mockAudioStoreState.isPlaying}, duration: ${mockAudioStoreState.duration}`);
    }),
    setPlayIntent: vi.fn(),
    audioContext: null,
    fxChainInput: null,
    fxChainOutput: null,
    _setCurrentTrackPlaying: vi.fn(),
    _updateCurrentTime: vi.fn(),
    _updateDuration: vi.fn(),
    _setError: vi.fn(),
    _setReady: vi.fn(),
    _setAudioElement: vi.fn(),
    _setWaveSurferReady: vi.fn(),
    _setWaveformVisible: vi.fn(),
    seenTrackIds: new Set<string>(),
    markTrackAsSeen: vi.fn(),
    setAudioElement: vi.fn(),
    setWaveSurferInstance: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
  };

  const mockUseAudioStore = Object.assign(
    vi.fn(() => mockAudioStoreState),
    {
      getState: vi.fn(() => mockAudioStoreState),
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    }
  );

  // Define mockUseParamsFn inside hoistedMocks
  const mockUseParamsFn = vi.fn(); 

  return { mockAudioStoreState, mockUseAudioStore, mockUseParamsFn }; // Expose it
});

// Mock for trackUtils (provides getTracksData)
const mockTrackDataArray = [
  { 
    id: '123',
    title: 'Test Track Title',
    artist: 'Test Artist Name',
    album: 'Test Album',
    genre: 'Test Genre',
    year: '2024',
    duration: '4:00',
    duration_ms: 240000,
    track_number: 1,
    key: 'C',
    bpm: 120,
    audioSrc: 'http://example.com/test.mp3',
    imageUrl: 'http://example.com/album_art.jpg',
    moods: ['Happy', 'Energetic'],
    camelotKey: '8B',
    preview_url: 'http://example.com/preview.mp3',
    spotify_url: 'http://example.com/spotify_track',
    downloadUrls: { wav: 'http://example.com/test.wav', mp3: 'http://example.com/test.mp3' },
    remixer: 'Test Remixer',
    subgenre: 'Test Subgenre',
    releaseDate: '2024-01-01',
    recordLabel: 'Test Label',
    tags: ['tag1', 'tag2'],
    categories: ['category1'],
    energyLevel: 3,
  },
  {
    id: '456', 
    title: 'Another Track', 
    artist: 'Another Artist', 
    audioSrc: 'http://example.com/other.mp3',
    album: 'Another Test Album',
    genre: 'Electronic',
    year: '2023',
    duration: '3:30',
    duration_ms: 210000,
    track_number: 1,
    key: 'Am',
    bpm: 128,
    imageUrl: 'http://example.com/another_album_art.jpg',
    moods: ['Driving', 'Dark'],
    camelotKey: '8A',
    preview_url: 'http://example.com/other_preview.mp3',
    spotify_url: 'http://example.com/other_spotify_link',
    downloadUrls: { 
      wav: 'http://example.com/track456.wav', 
      mp3: 'http://example.com/track456.mp3' 
    },
    remixer: 'DJ Test',
    subgenre: 'Techno',
    releaseDate: '2023-03-15',
    recordLabel: 'Test Records 2',
    tags: ['underground', 'peak time'],
    categories: ['Techno', 'Club'],
    energyLevel: 4,
  },
];

vi.mock('../../utils/trackUtils', async () => {
  const actualUtils = await vi.importActual('../../utils/trackUtils') as any;
  return {
    ...actualUtils,
    getTracksData: vi.fn(() => mockTrackDataArray),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: hoistedMocks.mockUseParamsFn, // Access via hoistedMocks
    useNavigate: () => vi.fn(),
    Link: (props: any) => <a {...props} href={props.to}>{props.children}</a>,
  };
});

vi.mock('../../hooks/useMediaQuery', () => ({
  default: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

vi.mock('../../stores/audioStore', () => ({
  default: hoistedMocks.mockUseAudioStore,
}));

vi.mock('../../components/WaveformVisualizer', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="mock-waveform-visualizer">WaveformVisualizer</div>),
}));

vi.mock('../../services/hotCueService', () => ({
  hotCueService: {
    getHotCues: vi.fn().mockReturnValue([]),
    addHotCue: vi.fn().mockResolvedValue(undefined),
    deleteHotCue: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(() => vi.fn()),
  }
}));

// Now import the component and other non-mocked modules
import TrackDetail from '../TrackDetail';
import { CurrentTrackContext } from '../../contexts/CurrentTrackContext';
import type { Track as AudioStoreTrack } from '../../stores/audioStore'; // Import type

const mockSetCurrentTrack = vi.fn();
// This was the mockCurrentTrackContextValue from the truncated file.
// Let's use the more complete one.
const mockCurrentTrackContextValueFull = {
  currentTrack: null,
  setCurrentTrack: mockSetCurrentTrack,
  isPlaying: false,
  setIsPlaying: vi.fn(),
  playTime: 0,
  setPlayTime: vi.fn(),
  duration: 0,
  setDuration: vi.fn(),
};

describe('TrackDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoistedMocks.mockUseParamsFn.mockReturnValue({ trackId: '123' });

    // Reset hoisted mocks for audioStore
    Object.keys(hoistedMocks.mockAudioStoreState).forEach(key => {
      const prop = hoistedMocks.mockAudioStoreState[key as keyof typeof hoistedMocks.mockAudioStoreState];
      if (typeof prop === 'function') {
        (prop as ReturnType<typeof vi.fn>).mockClear();
      }
    });
    hoistedMocks.mockAudioStoreState.currentTrack = null;
    hoistedMocks.mockAudioStoreState.isPlaying = false;
    hoistedMocks.mockAudioStoreState.duration = 0;
    hoistedMocks.mockAudioStoreState.currentTime = 0;
    hoistedMocks.mockAudioStoreState.isReady = false;
    hoistedMocks.mockAudioStoreState.seenTrackIds = new Set<string>();
    hoistedMocks.mockAudioStoreState.audioContext = null;
    hoistedMocks.mockAudioStoreState.fxChainInput = null;
    hoistedMocks.mockAudioStoreState.fxChainOutput = null;

    hoistedMocks.mockUseAudioStore.getState.mockReturnValue(hoistedMocks.mockAudioStoreState);
    hoistedMocks.mockUseAudioStore.mockReturnValue(hoistedMocks.mockAudioStoreState);

    mockCurrentTrackContextValueFull.currentTrack = null; // Use the full context mock
    mockCurrentTrackContextValueFull.isPlaying = false;
  });

  it('renders track title and artist when track is found', async () => {
    render(
      <CurrentTrackContext.Provider value={mockCurrentTrackContextValueFull}> {/* Use the full context mock */}
        <TrackDetail />
      </CurrentTrackContext.Provider>
    );
    await screen.findByText('Test Track Title');
    expect(screen.getByText('Test Track Title')).toBeInTheDocument();
    
    const artistNameElements = screen.getAllByText('Test Artist Name');
    expect(artistNameElements.length).toBeGreaterThan(0);
    artistNameElements.forEach(element => expect(element).toBeInTheDocument());
  });

  it('displays "Track not found" message when trackId is invalid', async () => {
    // Override useParams for this test using the persistent mock function
    hoistedMocks.mockUseParamsFn.mockReturnValue({ trackId: 'invalid-id' }); // Access via hoistedMocks
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <CurrentTrackContext.Provider value={mockCurrentTrackContextValueFull}>
        <TrackDetail />
      </CurrentTrackContext.Provider>
    );

    // Wait for the "Track not found" message to appear
    // The message is "Track not found or select a track to view details..."
    expect(await screen.findByText(/Track not found/i)).toBeInTheDocument();
    expect(screen.getByText(/or select a track to view details/i)).toBeInTheDocument();

    // Check if console.error was called with the expected message
    expect(consoleErrorSpy).toHaveBeenCalledWith('Track with ID invalid-id not found.');

    consoleErrorSpy.mockRestore(); // Restore original console.error
  });

  it('clicking play loads and plays a new track if not already in player', async () => {
    // Ensure audioStore state shows no track or a different track initially
    hoistedMocks.mockAudioStoreState.currentTrack = null; // Or some other track ID
    hoistedMocks.mockAudioStoreState.isPlaying = false;
    // useParams is already mocked by default in beforeEach to return { trackId: '123' }

    render(
      <CurrentTrackContext.Provider value={mockCurrentTrackContextValueFull}>
        <TrackDetail />
      </CurrentTrackContext.Provider>
    );

    // Wait for the track title to ensure the component has loaded the track data
    await screen.findByText('Test Track Title');

    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeInTheDocument();

    await act(async () => {
      playButton.click();
    });

    // Assertions
    expect(hoistedMocks.mockAudioStoreState.loadTrack).toHaveBeenCalledWith(expect.objectContaining({
      id: '123',
      title: 'Test Track Title',
      artist: 'Test Artist Name',
      audioSrc: 'http://example.com/test.mp3',
    }));
    expect(hoistedMocks.mockAudioStoreState.setPlayIntent).toHaveBeenCalled();
    expect(hoistedMocks.mockAudioStoreState.togglePlayPause).toHaveBeenCalled();

    // Check if button now shows Pause icon (or aria-label changes)
    // The button's aria-label changes to 'Pause' and background changes
    // We expect the button to still exist but with a new label
    const pauseButton = await screen.findByRole('button', { name: /pause/i });
    expect(pauseButton).toBeInTheDocument();
    // Optionally, check class change if stable
    // expect(pauseButton).toHaveClass('bg-red-500'); 
  });
});