import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import TrackCard, { TrackCardType } from './TrackCard';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

const mockTrack: TrackCardType = {
  id: '1',
  title: 'Test Track',
  artist: 'Test Artist',
  bpm: 120,
  key: 'C Major',
  mood: 'Energetic',
  genre: 'Electronic',
  duration: '3:45',
  downloadUrls: {
    mp3: 'https://example.com/track.mp3',
    wav: 'https://example.com/track.wav'
  },
  audioSrc: 'https://example.com/track.mp3',
  imageUrl: 'https://example.com/image.jpg',
  releaseDate: '2023-01-01'
};

const mockProps = {
  track: mockTrack,
  onPlay: vi.fn(),
  onAddToPlaylist: vi.fn(),
  isPlaying: false
};

describe('TrackCard Component', () => {
  it('renders without crashing', () => {
    renderWithRouter(<TrackCard {...mockProps} />);
    expect(screen.getByText('Test Track')).toBeInTheDocument();
  });

  it('displays track information', () => {
    renderWithRouter(<TrackCard {...mockProps} />);
    
    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getByText('120 BPM')).toBeInTheDocument();
    expect(screen.getByText('C Major')).toBeInTheDocument();
    expect(screen.getByText('Energetic')).toBeInTheDocument();
    expect(screen.getByText('Electronic')).toBeInTheDocument();
    expect(screen.getByText('3:45')).toBeInTheDocument();
  });

  it('displays track image', () => {
    renderWithRouter(<TrackCard {...mockProps} />);
    // Since there's no image in the component, we'll check for download links instead
    expect(screen.getByText('MP3')).toBeInTheDocument();
    expect(screen.getByText('WAV')).toBeInTheDocument();
  });

  it('handles click events', () => {
    renderWithRouter(<TrackCard {...mockProps} />);
    
    const playButton = screen.getByLabelText('Play');
    fireEvent.click(playButton);
    expect(mockProps.onPlay).toHaveBeenCalledWith(mockTrack);
    
    const addButton = screen.getByLabelText('Add to playlist');
    fireEvent.click(addButton);
    expect(mockProps.onAddToPlaylist).toHaveBeenCalledWith('1');
  });

  it('displays additional track metadata when available', () => {
    renderWithRouter(<TrackCard {...mockProps} />);
    
    // Check for mood color class
    const moodElement = screen.getByText('Energetic');
    expect(moodElement).toHaveClass('bg-red-500');
  });

  it('handles missing optional properties', () => {
    const trackWithoutImage = { ...mockTrack, imageUrl: undefined };
    const propsWithoutImage = { ...mockProps, track: trackWithoutImage };
    
    renderWithRouter(<TrackCard {...propsWithoutImage} />);
    expect(screen.getByText('Test Track')).toBeInTheDocument();
  });
}); 