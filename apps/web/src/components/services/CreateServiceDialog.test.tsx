import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateServiceDialog } from './CreateServiceDialog';

// Mock the API client
vi.mock('@/lib/api/services', () => ({
  createService: vi.fn(),
}));

import { createService } from '@/lib/api/services';

const mockCreateService = vi.mocked(createService);

describe('CreateServiceDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the dialog when open is true', () => {
      render(<CreateServiceDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create New Service')).toBeInTheDocument();
    });

    it('renders form fields', () => {
      render(<CreateServiceDialog {...defaultProps} />);

      expect(screen.getByLabelText(/service name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
      render(<CreateServiceDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /create service/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<CreateServiceDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when name is empty on submit', async () => {
      const user = userEvent.setup();
      render(<CreateServiceDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(screen.getByText(/service name is required/i)).toBeInTheDocument();
      });
      expect(mockCreateService).not.toHaveBeenCalled();
    });

    it('shows error when name exceeds 255 characters', async () => {
      const user = userEvent.setup();
      render(<CreateServiceDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/service name/i);
      await user.type(nameInput, 'a'.repeat(256));
      await user.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(screen.getByText(/255 characters or less/i)).toBeInTheDocument();
      });
      expect(mockCreateService).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('calls createService with form data on successful submit', async () => {
      const user = userEvent.setup();
      mockCreateService.mockResolvedValueOnce({
        id: 'test-id',
        name: 'Test Service',
        description: 'A test service',
        category: 'Testing',
        status: 'DRAFT',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      render(<CreateServiceDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/service name/i), 'Test Service');
      await user.type(screen.getByLabelText(/description/i), 'A test service');
      await user.type(screen.getByLabelText(/category/i), 'Testing');
      await user.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(mockCreateService).toHaveBeenCalledWith({
          name: 'Test Service',
          description: 'A test service',
          category: 'Testing',
        });
      });
    });

    it('calls onSuccess with created service data', async () => {
      const user = userEvent.setup();
      const mockService = {
        id: 'test-id',
        name: 'Test Service',
        description: null,
        category: null,
        status: 'DRAFT' as const,
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCreateService.mockResolvedValueOnce(mockService);

      render(<CreateServiceDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/service name/i), 'Test Service');
      await user.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockService);
      });
    });

    it('closes dialog on successful submit', async () => {
      const user = userEvent.setup();
      mockCreateService.mockResolvedValueOnce({
        id: 'test-id',
        name: 'Test Service',
        description: null,
        category: null,
        status: 'DRAFT',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      render(<CreateServiceDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/service name/i), 'Test Service');
      await user.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('displays API error message', async () => {
      const user = userEvent.setup();
      mockCreateService.mockRejectedValueOnce(new Error('Service name already exists'));

      render(<CreateServiceDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/service name/i), 'Duplicate Service');
      await user.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(screen.getByText(/service name already exists/i)).toBeInTheDocument();
      });
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  describe('Loading State', () => {
    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      // Never resolve to keep loading state
      mockCreateService.mockImplementation(() => new Promise(() => {}));

      render(<CreateServiceDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/service name/i), 'Test Service');
      await user.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(screen.getByText(/creating.../i)).toBeInTheDocument();
      });
    });

    it('disables inputs during submission', async () => {
      const user = userEvent.setup();
      mockCreateService.mockImplementation(() => new Promise(() => {}));

      render(<CreateServiceDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/service name/i), 'Test Service');
      await user.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/service name/i)).toBeDisabled();
        expect(screen.getByLabelText(/description/i)).toBeDisabled();
        expect(screen.getByLabelText(/category/i)).toBeDisabled();
      });
    });
  });

  describe('Cancel Behavior', () => {
    it('calls onOpenChange with false when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateServiceDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
