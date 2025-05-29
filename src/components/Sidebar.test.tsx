import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

// Mock the useMediaQuery hook
vi.mock('../hooks/useMediaQuery', () => ({
  default: vi.fn(() => false), // Default to desktop view
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Sidebar Component', () => {
  it('renders without crashing', () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByTestId('sidebar-element')).toBeInTheDocument();
  });

  it('displays navigation links', () => {
    renderWithRouter(<Sidebar />);
    
    // Check for the "Your Library" text
    expect(screen.getByText('Your Library')).toBeInTheDocument();
    
    // Check for filter buttons
    expect(screen.getByText('Playlists')).toBeInTheDocument();
    expect(screen.getByText('Artists')).toBeInTheDocument();
    expect(screen.getByText('Podcasts')).toBeInTheDocument();
    expect(screen.getByText('Albums')).toBeInTheDocument();
  });

  it('has proper structure', () => {
    const { container } = renderWithRouter(<Sidebar />);
    const sidebar = container.querySelector('[data-testid="sidebar-element"]');
    expect(sidebar).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    const { container } = renderWithRouter(<Sidebar />);
    const sidebar = container.querySelector('[data-testid="sidebar-element"]');
    expect(sidebar).toHaveClass('rounded-2xl');
    expect(sidebar).toHaveClass('bg-base-300');
  });
}); 