import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hotCueService } from './hotCueService';

describe('HotCueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    hotCueService.resetToDefaults();
  });

  afterEach(() => {
    hotCueService.resetToDefaults();
  });

  it('initializes with default hot cues', () => {
    const hotCues = hotCueService.getHotCues('nonexistent.mp3');
    expect(hotCues).toEqual([]);
  });

  it('sets a hot cue', () => {
    const hotCue = {
      label: 'Verse',
      time: 30,
      color: '#ff0000'
    };

    hotCueService.setHotCue('track1.mp3', hotCue);
    const hotCues = hotCueService.getHotCues('track1.mp3');
    
    expect(hotCues).toHaveLength(1);
    expect(hotCues[0]).toEqual(hotCue);
  });

  it('removes a hot cue', () => {
    const hotCue = {
      label: 'Verse',
      time: 30,
      color: '#ff0000'
    };

    hotCueService.setHotCue('track1.mp3', hotCue);
    expect(hotCueService.getHotCues('track1.mp3')).toHaveLength(1);

    hotCueService.removeHotCue('track1.mp3', 'Verse');
    expect(hotCueService.getHotCues('track1.mp3')).toHaveLength(0);
  });

  it('updates an existing hot cue with same label', () => {
    const hotCue = {
      label: 'Verse',
      time: 30,
      color: '#ff0000'
    };

    hotCueService.setHotCue('track1.mp3', hotCue);

    const updatedHotCue = {
      label: 'Verse',
      time: 35,
      color: '#00ff00'
    };

    hotCueService.setHotCue('track1.mp3', updatedHotCue);
    const hotCues = hotCueService.getHotCues('track1.mp3');
    
    expect(hotCues).toHaveLength(1);
    expect(hotCues[0].time).toBe(35);
    expect(hotCues[0].color).toBe('#00ff00');
  });

  it('handles multiple hot cues for same track', () => {
    const hotCue1 = {
      label: 'Verse',
      time: 30,
      color: '#ff0000'
    };

    const hotCue2 = {
      label: 'Chorus',
      time: 60,
      color: '#00ff00'
    };

    hotCueService.setHotCue('track1.mp3', hotCue1);
    hotCueService.setHotCue('track1.mp3', hotCue2);

    const hotCues = hotCueService.getHotCues('track1.mp3');
    expect(hotCues).toHaveLength(2);
    
    // Should be sorted by label
    expect(hotCues[0].label).toBe('Chorus');
    expect(hotCues[1].label).toBe('Verse');
  });

  it('handles multiple tracks separately', () => {
    const hotCue1 = {
      label: 'Verse',
      time: 30,
      color: '#ff0000'
    };

    const hotCue2 = {
      label: 'Bridge',
      time: 45,
      color: '#0000ff'
    };

    hotCueService.setHotCue('track1.mp3', hotCue1);
    hotCueService.setHotCue('track2.mp3', hotCue2);

    expect(hotCueService.getHotCues('track1.mp3')).toHaveLength(1);
    expect(hotCueService.getHotCues('track2.mp3')).toHaveLength(1);
    expect(hotCueService.getHotCues('track1.mp3')[0].label).toBe('Verse');
    expect(hotCueService.getHotCues('track2.mp3')[0].label).toBe('Bridge');
  });

  it('persists hot cues to localStorage', () => {
    const hotCue = {
      label: 'Verse',
      time: 30,
      color: '#ff0000'
    };

    hotCueService.setHotCue('track1.mp3', hotCue);
    
    const storedData = localStorage.getItem('hotCueData');
    expect(storedData).toBeTruthy();
    
    const parsedData = JSON.parse(storedData!);
    expect(parsedData['track1.mp3']).toHaveLength(1);
    expect(parsedData['track1.mp3'][0]).toEqual(hotCue);
  });

  it('gets all hot cues', () => {
    const hotCue1 = {
      label: 'Verse',
      time: 30,
      color: '#ff0000'
    };

    const hotCue2 = {
      label: 'Bridge',
      time: 45,
      color: '#0000ff'
    };

    hotCueService.setHotCue('track1.mp3', hotCue1);
    hotCueService.setHotCue('track2.mp3', hotCue2);

    const allHotCues = hotCueService.getAllHotCues();
    expect(allHotCues['track1.mp3']).toHaveLength(1);
    expect(allHotCues['track2.mp3']).toHaveLength(1);
  });

  it('resets to defaults', () => {
    const hotCue = {
      label: 'Verse',
      time: 30,
      color: '#ff0000'
    };

    hotCueService.setHotCue('track1.mp3', hotCue);
    expect(hotCueService.getHotCues('track1.mp3')).toHaveLength(1);

    hotCueService.resetToDefaults();
    expect(hotCueService.getHotCues('track1.mp3')).toHaveLength(0);
  });

  it('handles subscription and notification', () => {
    const callback = vi.fn();
    
    const unsubscribe = hotCueService.subscribe(callback);
    
    const hotCue = {
      label: 'Verse',
      time: 30,
      color: '#ff0000'
    };

    hotCueService.setHotCueWithNotification('track1.mp3', hotCue);
    
    expect(callback).toHaveBeenCalled();
    
    // Test unsubscribe
    unsubscribe();
    callback.mockClear();
    
    hotCueService.setHotCueWithNotification('track2.mp3', hotCue);
    expect(callback).not.toHaveBeenCalled();
  });

  it('handles remove with notification', () => {
    const callback = vi.fn();
    
    hotCueService.subscribe(callback);
    
    const hotCue = {
      label: 'Verse',
      time: 30,
      color: '#ff0000'
    };

    hotCueService.setHotCue('track1.mp3', hotCue);
    callback.mockClear();
    
    hotCueService.removeHotCueWithNotification('track1.mp3', 'Verse');
    
    expect(callback).toHaveBeenCalled();
    expect(hotCueService.getHotCues('track1.mp3')).toHaveLength(0);
  });

  it('exports hot cue data', () => {
    // Mock DOM methods
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    const mockCreateElement = vi.fn(() => mockLink);
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();
    const mockCreateObjectURL = vi.fn(() => 'blob:url');
    const mockRevokeObjectURL = vi.fn();

    Object.defineProperty(document, 'createElement', {
      value: mockCreateElement,
      writable: true,
    });
    Object.defineProperty(document.body, 'appendChild', {
      value: mockAppendChild,
      writable: true,
    });
    Object.defineProperty(document.body, 'removeChild', {
      value: mockRemoveChild,
      writable: true,
    });
    Object.defineProperty(URL, 'createObjectURL', {
      value: mockCreateObjectURL,
      writable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: mockRevokeObjectURL,
      writable: true,
    });

    hotCueService.exportHotCueData();

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockLink.download).toBe('hotCueData.js');
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });
}); 