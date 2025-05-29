// import React from 'react'; // TS6133: 'React' is declared but its value is never read.
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import WaveformVisualizer from './WaveformVisualizer';
// We don't need to import WaveSurfer here if we trust our mock structure via hoistedMocks

const waveSurferInstanceMock = {
  load: vi.fn(),
  on: vi.fn(),
  unAll: vi.fn(),
  destroy: vi.fn(),
  seekTo: vi.fn(),
  getCurrentTime: vi.fn().mockReturnValue(0),
  getDuration: vi.fn().mockReturnValue(100),
};

// Use vi.hoisted for the mock function to be used in the factory
const hoistedMocks = vi.hoisted(() => {
  return {
    // This is the function that will replace WaveSurfer.default.create
    mockCreateFn: vi.fn(() => waveSurferInstanceMock)
  }
});

vi.mock('wavesurfer.js', () => ({
  __esModule: true,
  default: { // This means the module has a default export, which is an object
    create: hoistedMocks.mockCreateFn, // and that object has a create method
  },
  // No other named exports are mocked unless needed
}));

describe('WaveformVisualizer', () => {
  const mockAudioUrl = 'test.mp3';
  let readyCallback: (() => void) | null = null;
  let errorCallback: ((err: Error) => void) | null = null;
  let interactionCallback: (() => void) | null = null;

  // Access the mock through the hoisted variable, as this is the actual vi.fn() we want to assert against
  const mockedCreateReference = hoistedMocks.mockCreateFn;

  beforeEach(() => {
    vi.clearAllMocks(); 
    // Ensure the mock implementation is reset (vi.clearAllMocks should do this for vi.fn created by vi.hoisted)
    // If not, explicitly: mockedCreateReference.mockImplementation(() => waveSurferInstanceMock);

    waveSurferInstanceMock.load.mockClear();
    waveSurferInstanceMock.on.mockImplementation((event, callback) => {
      if (event === 'ready') readyCallback = callback as () => void;
      if (event === 'error') errorCallback = callback as (err: Error) => void;
      if (event === 'interaction') interactionCallback = callback as () => void;
      return waveSurferInstanceMock; 
    });
    waveSurferInstanceMock.unAll.mockClear();
    waveSurferInstanceMock.destroy.mockClear();
    waveSurferInstanceMock.seekTo.mockClear();
    waveSurferInstanceMock.getCurrentTime.mockReturnValue(0);
    waveSurferInstanceMock.getDuration.mockReturnValue(100);

    readyCallback = null;
    errorCallback = null;
    interactionCallback = null;
  });

  it('renders loading state initially', () => {
    render(<WaveformVisualizer audioUrl={mockAudioUrl} />);
    expect(screen.getByText('Loading waveform...')).toBeInTheDocument();
  });

  it('initializes WaveSurfer on mount with correct options', () => {
    const color = '#FF0000';
    const height = 100;
    render(<WaveformVisualizer audioUrl={mockAudioUrl} color={color} height={height} onSeek={vi.fn()} />);    
    expect(mockedCreateReference).toHaveBeenCalledTimes(1);
    expect(mockedCreateReference).toHaveBeenCalledWith(expect.objectContaining({
      waveColor: color,
      progressColor: 'rgba(255,0,0,0.5)',
      height: height,
      interact: true, 
    }));
    expect(waveSurferInstanceMock.load).toHaveBeenCalledWith(mockAudioUrl);
  });

  it('calls onReady when WaveSurfer is ready', () => {
      const handleReady = vi.fn();
      render(<WaveformVisualizer audioUrl={mockAudioUrl} onReady={handleReady} />); 
      if (readyCallback) {
          act(() => {
            readyCallback!();
          });
      }
      expect(handleReady).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Loading waveform...')).not.toBeInTheDocument(); 
  });

  it('handles WaveSurfer errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(<WaveformVisualizer audioUrl={mockAudioUrl} />); 
      const testError = new Error('Test WaveSurfer error');
      if (errorCallback) {
          act(() => {
            errorCallback!(testError);
          });
      }
      expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[WaveformVisualizer] WaveSurfer error:',
          testError,
          'for audioUrl:',
          mockAudioUrl
      );
      expect(screen.queryByText('Loading waveform...')).not.toBeInTheDocument();
      consoleErrorSpy.mockRestore();
  });

  it('cleans up WaveSurfer instance on unmount', () => {
      const { unmount } = render(<WaveformVisualizer audioUrl={mockAudioUrl} />);
      if (readyCallback) act(() => readyCallback!()); 
      unmount();
      expect(waveSurferInstanceMock.unAll).toHaveBeenCalledTimes(1);
      expect(waveSurferInstanceMock.destroy).toHaveBeenCalledTimes(1);
  });

  it('cleans up WaveSurfer if audioUrl becomes null', () => {
      const { rerender } = render(<WaveformVisualizer audioUrl={mockAudioUrl} />);
      if (readyCallback) act(() => readyCallback!());
      rerender(<WaveformVisualizer audioUrl={null as any} />); 
      expect(waveSurferInstanceMock.unAll).toHaveBeenCalledTimes(1);
      expect(waveSurferInstanceMock.destroy).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Loading waveform...')).not.toBeInTheDocument();
  });

  it('calls onSeek when WaveSurfer interaction produces a seek event', () => {
      const handleSeek = vi.fn();
      const mockSeekTime = 50;
      waveSurferInstanceMock.getCurrentTime.mockReturnValue(mockSeekTime);
      render(<WaveformVisualizer audioUrl={mockAudioUrl} onSeek={handleSeek} />);    
      if (readyCallback) act(() => readyCallback!()); 
      if (interactionCallback) act(() => interactionCallback!());
      expect(handleSeek).toHaveBeenCalledWith(mockSeekTime);
  });

  it('seeks WaveSurfer when currentTime prop changes', async () => {
      const { rerender } = render(<WaveformVisualizer audioUrl={mockAudioUrl} currentTime={10} />); 
      if (readyCallback) {
          act(() => {
              readyCallback!();
          });
      }
      await act(async () => { await Promise.resolve(); });
      waveSurferInstanceMock.seekTo.mockClear(); 
      rerender(<WaveformVisualizer audioUrl={mockAudioUrl} currentTime={30} />); 
      await act(async () => { await Promise.resolve(); });
      expect(waveSurferInstanceMock.seekTo).toHaveBeenCalledWith(0.3);
  });

  it('seeks WaveSurfer to 0 when currentTime prop changes to 0', async () => {
      const { rerender } = render(<WaveformVisualizer audioUrl={mockAudioUrl} currentTime={10} />); 
      waveSurferInstanceMock.getCurrentTime.mockReturnValue(10); 
      if (readyCallback) {
          act(() => {
              readyCallback!();
          });
      }
      await act(async () => { await Promise.resolve(); });
      waveSurferInstanceMock.seekTo.mockClear(); 
      rerender(<WaveformVisualizer audioUrl={mockAudioUrl} currentTime={0} />); 
      await act(async () => { await Promise.resolve(); });
      expect(waveSurferInstanceMock.seekTo).toHaveBeenCalledWith(0);
  });

  it('handles drag and drop events', async () => {
      const handleDragOver = vi.fn();
      const handleDrop = vi.fn();
      const mockDropTime = 25; 
      waveSurferInstanceMock.getDuration.mockReturnValue(100); 

      render(
          <WaveformVisualizer 
              audioUrl={mockAudioUrl} 
              onDragOver={handleDragOver} 
              onDrop={handleDrop} 
          />
      );
      if (readyCallback) {
         act(() => {
            readyCallback!();
         });
      }
      await act(async () => { await Promise.resolve(); });

      const dropZone = screen.getByTestId("waveform-visualizer-dropzone");        
      expect(dropZone).toBeInTheDocument();

      // Simpler mock, ensuring properties are numbers
      const mockBoundingClientRect = { left: 0, width: 200, top: 0, height: 80, bottom: 80, right: 200, x: 0, y: 0 };
      dropZone.getBoundingClientRect = vi.fn().mockReturnValue(mockBoundingClientRect);

      fireEvent.dragOver(dropZone, { clientX: 50 });
      expect(handleDragOver).toHaveBeenCalledTimes(1);
      
      fireEvent.drop(dropZone, { 
        dataTransfer: new DataTransfer(),
        clientX: 50, 
        clientY: 10,
        pageX: 50,
        pageY: 10
      }); 
      expect(handleDrop).toHaveBeenCalledTimes(1);
      expect(handleDrop).toHaveBeenCalledWith(expect.anything(), mockDropTime); 
  });
});