import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateServiceDialog } from './CreateServiceDialog';

// Mock the API clients
vi.mock('@/lib/api/services', () => ({
  createService: vi.fn(),
}));

vi.mock('@/lib/api/templates', () => ({
  getTemplates: vi.fn(),
  getTemplateCategories: vi.fn(),
  createServiceFromTemplate: vi.fn(),
}));

// Mock template hooks
vi.mock('@/hooks/use-templates', () => ({
  useTemplates: vi.fn(() => ({
    data: { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } },
    isLoading: false,
    error: null,
  })),
  useTemplateCategories: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useCreateServiceFromTemplate: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  templateKeys: {
    all: ['templates'],
    lists: () => ['templates', 'list'],
    list: (params: Record<string, unknown>) => ['templates', 'list', params],
    details: () => ['templates', 'detail'],
    detail: (id: string) => ['templates', 'detail', id],
    categories: () => ['templates', 'categories'],
  },
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

    it('renders mode selection options', () => {
      render(<CreateServiceDialog {...defaultProps} />);

      expect(screen.getByText('Start from Scratch')).toBeInTheDocument();
      expect(screen.getByText('Use a Template')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<CreateServiceDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Mode Selection', () => {
    it('shows blank service form when "Start from Scratch" is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateServiceDialog {...defaultProps} />);

      await user.click(screen.getByText('Start from Scratch'));

      expect(screen.getByText('Create Blank Service')).toBeInTheDocument();
      expect(screen.getByLabelText(/service name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    it('shows template gallery when "Use a Template" is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateServiceDialog {...defaultProps} />);

      await user.click(screen.getByText('Use a Template'));

      expect(screen.getByText('Choose a Template')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search templates...')).toBeInTheDocument();
    });

    it('has back button in blank service mode', async () => {
      const user = userEvent.setup();
      render(<CreateServiceDialog {...defaultProps} />);

      await user.click(screen.getByText('Start from Scratch'));

      // Click back button
      await user.click(screen.getByRole('button', { name: /back/i }));

      // Should be back to mode selection
      expect(screen.getByText('Start from Scratch')).toBeInTheDocument();
      expect(screen.getByText('Use a Template')).toBeInTheDocument();
    });
  });

  describe('Blank Service Form', () => {
    const goToBlankForm = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByText('Start from Scratch'));
    };

    it('renders submit and cancel buttons', async () => {
      const user = userEvent.setup();
      render(<CreateServiceDialog {...defaultProps} />);
      await goToBlankForm(user);

      expect(screen.getByRole('button', { name: /create service/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('shows error when name is empty on submit', async () => {
      const user = userEvent.setup();
      render(<CreateServiceDialog {...defaultProps} />);
      await goToBlankForm(user);

      await user.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(screen.getByText(/service name is required/i)).toBeInTheDocument();
      });
      expect(mockCreateService).not.toHaveBeenCalled();
    });

    it('shows error when name exceeds 255 characters', async () => {
      const user = userEvent.setup();
      render(<CreateServiceDialog {...defaultProps} />);
      await goToBlankForm(user);

      const nameInput = screen.getByLabelText(/service name/i);
      await user.type(nameInput, 'a'.repeat(256));
      await user.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(screen.getByText(/255 characters or less/i)).toBeInTheDocument();
      });
      expect(mockCreateService).not.toHaveBeenCalled();
    });

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
      await goToBlankForm(user);

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
      await goToBlankForm(user);

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
      await goToBlankForm(user);

      await user.type(screen.getByLabelText(/service name/i), 'Test Service');
      await user.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('displays API error message', async () => {
      const user = userEvent.setup();
      mockCreateService.mockRejectedValueOnce(new Error('Service name already exists'));

      render(<CreateServiceDialog {...defaultProps} />);
      await goToBlankForm(user);

      await user.type(screen.getByLabelText(/service name/i), 'Duplicate Service');
      await user.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(screen.getByText(/service name already exists/i)).toBeInTheDocument();
      });
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      // Never resolve to keep loading state
      mockCreateService.mockImplementation(() => new Promise(() => {}));

      render(<CreateServiceDialog {...defaultProps} />);
      await goToBlankForm(user);

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
      await goToBlankForm(user);

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
    it('calls onOpenChange with false when cancel is clicked on mode selection', async () => {
      const user = userEvent.setup();
      render(<CreateServiceDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
