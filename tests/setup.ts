import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
    callback(Date.now());
    return 0; // Return a number, as requestAnimationFrame does
});

// Mock DataTransfer for drag-and-drop events
if (!global.DataTransfer) {
    class MockDataTransfer {
        data: Record<string, string> = {};
        dropEffect = 'none';
        effectAllowed = 'all';
        files = [] as unknown as FileList; // Mock FileList if needed for more complex tests
        items = [] as unknown as DataTransferItemList; // Mock DataTransferItemList if needed
        types = [] as readonly string[];

        clearData(format?: string): void {
            if (format) {
                delete this.data[format];
            } else {
                this.data = {};
            }
        }
        getData(format: string): string {
            return this.data[format] || '';
        }
        setData(format: string, data: string): void {
            this.data[format] = data;
        }
        setDragImage(image: Element, x: number, y: number): void {}
    }
    global.DataTransfer = MockDataTransfer as any;
}

// runs a clean after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
})