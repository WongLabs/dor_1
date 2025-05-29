import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExpandContent from './ExpandContent';

describe('ExpandContent Component', () => {
  it('renders without crashing', () => {
    render(<ExpandContent />);
    
    expect(screen.getByTestId('expand-content-element')).toBeInTheDocument();
  });

  it('displays the correct heading', () => {
    render(<ExpandContent />);
    
    expect(screen.getByText('Top 50 Global')).toBeInTheDocument();
  });

  it('displays the album image', () => {
    render(<ExpandContent />);
    
    const image = screen.getByAltText('Album');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/assets/images/bruno.png');
    expect(image).toHaveAttribute('width', '300');
    expect(image).toHaveAttribute('height', '300');
  });

  it('has correct CSS classes', () => {
    render(<ExpandContent />);
    
    const element = screen.getByTestId('expand-content-element');
    expect(element).toHaveClass('rounded-2xl', 'my-10', 'bg-base-300', 'min-h-fit', 'basis-1/8', 'p-4');
  });

  it('has proper structure with flex layout', () => {
    render(<ExpandContent />);
    
    const element = screen.getByTestId('expand-content-element');
    const flexContainer = element.querySelector('.flex.flex-col.gap-4');
    expect(flexContainer).toBeInTheDocument();
  });
}); 