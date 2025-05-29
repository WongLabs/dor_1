import { describe, it, expect, vi } from 'vitest';

// Mock ReactDOM
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
  })),
}));

// Mock App component
vi.mock('./App.tsx', () => ({
  default: () => 'App Component',
}));

describe('main.tsx', () => {
  it('should render the app without crashing', async () => {
    // Create a mock root element
    const mockRoot = document.createElement('div');
    mockRoot.id = 'root';
    document.body.appendChild(mockRoot);

    // Import and run main
    await import('./main');

    // Verify that createRoot was called with the correct element
    const { createRoot } = await import('react-dom/client');
    expect(createRoot).toHaveBeenCalledWith(mockRoot);

    // Clean up
    document.body.removeChild(mockRoot);
  });
}); 