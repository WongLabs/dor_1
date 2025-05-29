import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { convertToCamelot, parseTrackLengthToSeconds, formatTime, throttle } from './trackUtils';

// Mock localStorage for tests that might use it via other utilities or hooks
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Track Utility Functions', () => {
  describe('convertToCamelot', () => {
    it('should convert major keys from the map correctly', () => {
      expect(convertToCamelot('B')).toBe('1B');
      expect(convertToCamelot('F#')).toBe('2B');
      expect(convertToCamelot('Db')).toBe('3B');
      expect(convertToCamelot('Ab')).toBe('4B');
      expect(convertToCamelot('Eb')).toBe('5B');
      expect(convertToCamelot('Bb')).toBe('6B');
      expect(convertToCamelot('F')).toBe('7B');
      expect(convertToCamelot('C')).toBe('8B');
      expect(convertToCamelot('G')).toBe('9B');
      expect(convertToCamelot('D')).toBe('10B');
      expect(convertToCamelot('A')).toBe('11B');
      expect(convertToCamelot('E')).toBe('12B');
    });

    it('should convert minor keys from the map correctly', () => {
      expect(convertToCamelot('Abm')).toBe('1A');
      expect(convertToCamelot('Ebm')).toBe('2A');
      expect(convertToCamelot('Bbm')).toBe('3A');
      expect(convertToCamelot('Fm')).toBe('4A');
      expect(convertToCamelot('Cm')).toBe('5A');
      expect(convertToCamelot('Gm')).toBe('6A');
      expect(convertToCamelot('Dm')).toBe('7A');
      expect(convertToCamelot('Am')).toBe('8A');
      expect(convertToCamelot('Em')).toBe('9A');
      expect(convertToCamelot('Bm')).toBe('10A');
      expect(convertToCamelot('F#m')).toBe('11A');
      expect(convertToCamelot('C#m')).toBe('12A');
    });

    it('should return N/A for keys not in the maps (including common sharp/flat alternative notations)', () => {
      expect(convertToCamelot('A#')).toBe('N/A'); // Bb is in map
      expect(convertToCamelot('C#')).toBe('N/A'); // Db is in map
      expect(convertToCamelot('D#')).toBe('N/A'); // Eb is in map
      expect(convertToCamelot('G#')).toBe('N/A'); // Ab is in map
      expect(convertToCamelot('Gb')).toBe('N/A'); // F# is in map
      
      expect(convertToCamelot('A#m')).toBe('N/A'); // Bbm is in map
      expect(convertToCamelot('Dbm')).toBe('N/A'); // C#m is in map
      expect(convertToCamelot('D#m')).toBe('N/A'); // Ebm is in map
      expect(convertToCamelot('G#m')).toBe('N/A'); // Abm is in map
      expect(convertToCamelot('Gbm')).toBe('N/A'); // F#m is in map
    });

    it('should return N/A for unknown, empty, or invalid formatted keys', () => {
      expect(convertToCamelot('X')).toBe('N/A');
      expect(convertToCamelot('invalid')).toBe('N/A');
      expect(convertToCamelot('')).toBe('N/A');
      expect(convertToCamelot('Cmaj7')).toBe('N/A');
      expect(convertToCamelot('c')).toBe('N/A'); // Lowercase
    });
  });

  describe('parseTrackLengthToSeconds', () => {
    it('should parse valid time strings correctly', () => {
      expect(parseTrackLengthToSeconds('3:45')).toBe(225);
      expect(parseTrackLengthToSeconds('0:30')).toBe(30);
      expect(parseTrackLengthToSeconds('10:05')).toBe(605);
      expect(parseTrackLengthToSeconds('1:00')).toBe(60);
    });

    it('should handle edge cases with valid formats', () => {
      expect(parseTrackLengthToSeconds('0:00')).toBe(0);
      expect(parseTrackLengthToSeconds('0:59')).toBe(59);
      expect(parseTrackLengthToSeconds('60:00')).toBe(3600); // 60 minutes
    });

    it('should return 0 and warn for invalid string formats', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(parseTrackLengthToSeconds('invalid')).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Could not parse trackLength: invalid');
      expect(parseTrackLengthToSeconds('3')).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Could not parse trackLength: 3');
      expect(parseTrackLengthToSeconds('3:45:30')).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Could not parse trackLength: 3:45:30');
      expect(parseTrackLengthToSeconds('3:ab')).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Could not parse trackLength: 3:ab');
      consoleWarnSpy.mockRestore();
    });

    it('should return 0 for non-string or empty inputs without warning', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(parseTrackLengthToSeconds(undefined)).toBe(0);
      expect(parseTrackLengthToSeconds('')).toBe(0);
      expect(parseTrackLengthToSeconds(null as any)).toBe(0);
      expect(parseTrackLengthToSeconds(123 as any)).toBe(0);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('formatTime', () => {
    it('should format valid positive times correctly', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(59)).toBe('0:59');
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(61)).toBe('1:01');
      expect(formatTime(125)).toBe('2:05');
      expect(formatTime(3600)).toBe('60:00');
      expect(formatTime(3661)).toBe('61:01');
    });

    it('should handle NaN and Infinity for formatTime', () => {
      expect(formatTime(NaN)).toBe('0:00');
      expect(formatTime(Infinity)).toBe('0:00');
    });
    
    it('should format negative times correctly, padding seconds with abs value', () => {
      expect(formatTime(-1)).toBe('-1:01'); // Math.floor(-1/60) is -1. Math.abs(-1%60) is 1.
      expect(formatTime(-5)).toBe('-1:05');
      expect(formatTime(-59)).toBe('-1:59');
      expect(formatTime(-60)).toBe('-1:00'); // Math.floor(-60/60) is -1. Math.abs(-60%60) is 0.
      expect(formatTime(-61)).toBe('-2:01'); // Math.floor(-61/60) is -2. Math.abs(-61%60) is 1.
      expect(formatTime(-125)).toBe('-3:05'); // Math.floor(-125/60) is -3. Math.abs(-125%60) is 5.
    });

    it('should pad seconds correctly (covered by positive and negative tests)', () => {
      expect(formatTime(1)).toBe('0:01');
      expect(formatTime(9)).toBe('0:09');
      expect(formatTime(10)).toBe('0:10');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks(); // This also restores original timers
    });

    it('should call function immediately on first call and return its result', () => {
      const mockFn = vi.fn((val: number) => val * 2);
      const throttledFn = throttle(mockFn, 100);
      const result = throttledFn(5);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(5);
      expect(result).toBe(10);
    });

    it('should throttle subsequent calls and only execute the latest one after delay', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('call1'); // Immediate
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenLastCalledWith('call1');

      const result2 = throttledFn('call2_throttled'); // Throttled
      const result3 = throttledFn('call3_latest_throttled'); // Replaces call2_throttled

      expect(mockFn).toHaveBeenCalledTimes(1); // Still 1
      expect(result2).toBeUndefined();
      expect(result3).toBeUndefined();

      vi.advanceTimersByTime(50); // Not enough time
      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(50); // Enough time for 'call3_latest_throttled'
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('call3_latest_throttled');
    });
    
    it('should preserve context (this) and pass arguments for throttled calls', () => {
      const contextObj = { 
        val: 10, 
        method: vi.fn(function(this: {val:number}, num: number, str: string) { 
          return this.val + num + str.length; 
        }) 
      };
      const throttledMethod = throttle(contextObj.method, 100);

      // Test immediate call
      const result1 = throttledMethod.call(contextObj, 5, 'abc'); // 10 + 5 + 3 = 18
      expect(contextObj.method).toHaveBeenCalledTimes(1);
      expect(contextObj.method).toHaveBeenLastCalledWith(5, 'abc');
      expect(result1).toBe(18);
      
      contextObj.method.mockClear(); // Clear for the throttled call assertions

      // Test throttled call
      const resultThrottled = throttledMethod.call(contextObj, 7, 'xy'); // Throttled
      expect(contextObj.method).not.toHaveBeenCalled();
      expect(resultThrottled).toBeUndefined(); // Throttled calls don't return original func's result from wrapper

      vi.advanceTimersByTime(100);
      expect(contextObj.method).toHaveBeenCalledTimes(1);
      expect(contextObj.method).toHaveBeenLastCalledWith(7, 'xy');
      // Check the actual return value of the _mocked_ method (contextObj.method)
      expect(contextObj.method.mock.results[0].value).toBe(10 + 7 + 2); // 19
    });

    it('should allow new immediate execution after throttle period completion', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('event1'); // Immediate
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenLastCalledWith('event1');

      throttledFn('event2_throttled'); // Throttled
      expect(mockFn).toHaveBeenCalledTimes(1); 

      vi.advanceTimersByTime(100); // 'event2_throttled' executes
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('event2_throttled');

      // Now the throttle period is over, next call should be immediate
      const result3 = throttledFn('event3_immediate_again'); 
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(mockFn).toHaveBeenLastCalledWith('event3_immediate_again');
      // Ensure result is returned for this new immediate call
      // For this, the mockFn needs to return something if we want to check `result3`
      // If mockFn is `vi.fn()`, it returns undefined.
      // If we change mockFn to `vi.fn(arg => arg)` then: expect(result3).toBe('event3_immediate_again');

      throttledFn('event4_throttled_after_reset'); // Throttled again
      expect(mockFn).toHaveBeenCalledTimes(3);
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(4);
      expect(mockFn).toHaveBeenLastCalledWith('event4_throttled_after_reset');
    });
  });
}); 