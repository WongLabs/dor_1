export interface HotCue {
  label: string;
  color: string;
  time: number;
}

export interface HotCueData {
  [trackFileName: string]: HotCue[];
}

// This makes the default export (the object itself) typed as HotCueData
declare const hotCueData: HotCueData;
export default hotCueData; 