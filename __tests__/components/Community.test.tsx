import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Community } from '../../src/components/Home/Community';

// Mock framer-motion to bypass intersection observers and animations in test
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('Community Form Component', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the join form by default', () => {
    render(<Community />);
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Join the Community/i })).toBeInTheDocument();
  });

  it('shows loading state on submit and success message upon successful API call', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<Community />);
    
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/College Name/i), { target: { value: 'Test College' } });
    fireEvent.change(screen.getByLabelText(/Year/i), { target: { value: '1st Year' } });
    fireEvent.change(screen.getByLabelText(/Skill Level/i), { target: { value: 'Complete Beginner' } });

    fireEvent.submit(screen.getByRole('button', { name: /Join the Community/i }).closest('form') as HTMLFormElement);

    expect(screen.getByRole('button', { name: /Joining.../i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/You're in! Welcome aboard./i)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/join', expect.any(Object));
  });

  it('shows error message if API fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid email address' }),
    });

    render(<Community />);
    
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText(/College Name/i), { target: { value: 'Test College' } });
    fireEvent.change(screen.getByLabelText(/Year/i), { target: { value: '1st Year' } });
    fireEvent.change(screen.getByLabelText(/Skill Level/i), { target: { value: 'Complete Beginner' } });

    fireEvent.submit(screen.getByRole('button', { name: /Join the Community/i }).closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText(/⚠️ Invalid email address/i)).toBeInTheDocument();
    });
    
    // Form should still be visible to try again
    expect(screen.getByRole('button', { name: /Join the Community/i })).toBeInTheDocument();
  });
});
