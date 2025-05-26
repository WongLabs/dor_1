import hotCueDataDefault, { type HotCueData, type HotCue } from '../../public/hotCueData';

const STORAGE_KEY = 'hotCueData';

class HotCueService {
  private hotCueData: HotCueData;

  constructor() {
    // Load from localStorage if exists, otherwise use default data
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.hotCueData = JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing stored hot cue data:', error);
        this.hotCueData = { ...hotCueDataDefault };
      }
    } else {
      this.hotCueData = { ...hotCueDataDefault };
    }
  }

  // Get hot cues for a specific track filename
  getHotCues(fileName: string): HotCue[] {
    return this.hotCueData[fileName] || [];
  }

  // Set/update a hot cue for a track
  setHotCue(fileName: string, cue: HotCue): void {
    if (!this.hotCueData[fileName]) {
      this.hotCueData[fileName] = [];
    }

    // Remove existing cue with the same label
    this.hotCueData[fileName] = this.hotCueData[fileName].filter(
      existingCue => existingCue.label !== cue.label
    );

    // Add the new cue
    this.hotCueData[fileName].push(cue);
    
    // Sort by label
    this.hotCueData[fileName].sort((a, b) => a.label.localeCompare(b.label));

    // Save to localStorage
    this.saveToStorage();
  }

  // Remove a hot cue
  removeHotCue(fileName: string, label: string): void {
    if (this.hotCueData[fileName]) {
      this.hotCueData[fileName] = this.hotCueData[fileName].filter(
        cue => cue.label !== label
      );
      this.saveToStorage();
    }
  }

  // Get all hot cue data
  getAllHotCues(): HotCueData {
    return { ...this.hotCueData };
  }

  // Reset to default data
  resetToDefaults(): void {
    this.hotCueData = { ...hotCueDataDefault };
    this.saveToStorage();
  }

  // Export current data as downloadable file
  exportHotCueData(): void {
    const dataStr = `const hotCueData = ${JSON.stringify(this.hotCueData, null, 2)};
export default hotCueData;`;
    
    const blob = new Blob([dataStr], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hotCueData.js';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.hotCueData));
  }

  // Subscribe to changes (for reactive updates)
  private listeners: Array<(data: HotCueData) => void> = [];

  subscribe(listener: (data: HotCueData) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getAllHotCues()));
  }

  // Update setHotCue to use notification
  setHotCueWithNotification(fileName: string, cue: HotCue): void {
    this.setHotCue(fileName, cue);
    this.notifyListeners();
  }

  // Update removeHotCue to use notification
  removeHotCueWithNotification(fileName: string, label: string): void {
    this.removeHotCue(fileName, label);
    this.notifyListeners();
  }
}

// Export singleton instance
export const hotCueService = new HotCueService(); 