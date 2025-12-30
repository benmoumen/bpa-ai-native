import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceMetadataForm } from './ServiceMetadataForm';

// Mock the API client
vi.mock('@/lib/api/services', () => ({
  updateService: vi.fn(),
}));

import { updateService } from '@/lib/api/services';
import type { Service } from '@/lib/api/services';

const mockUpdateService = vi.mocked(updateService);

const mockService: Service = {
  id: 'test-service-id',
  name: 'Test Service',
  description: 'A test service description',
  category: 'Testing',
  status: 'DRAFT',
  createdBy: 'user-1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockPublishedService: Service = {
  ...mockService,
  status: 'PUBLISHED',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('ServiceMetadataForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form fields with service values', () => {
      render(
        <ServiceMetadataForm service={mockService} isEditable={true} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByLabelText(/service name/i)).toHaveValue('Test Service');
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        'A test service description'
      );
      expect(screen.getByLabelText(/category/i)).toHaveValue('Testing');
    });

    it('renders action buttons when editable', () => {
      render(
        <ServiceMetadataForm service={mockService} isEditable={true} />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.getByRole('button', { name: /save changes/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /discard changes/i })
      ).toBeInTheDocument();
    });

    it('does not render action buttons when not editable', () => {
      render(
        <ServiceMetadataForm service={mockPublishedService} isEditable={false} />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.queryByRole('button', { name: /save changes/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /discard changes/i })
      ).not.toBeInTheDocument();
    });

    it('disables inputs when not editable', () => {
      render(
        <ServiceMetadataForm service={mockPublishedService} isEditable={false} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByLabelText(/service name/i)).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
      expect(screen.getByLabelText(/category/i)).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('shows error when name is empty on submit', async () => {
      const user = userEvent.setup();
      render(
        <ServiceMetadataForm service={mockService} isEditable={true} />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByLabelText(/service name/i);
      await user.clear(nameInput);
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/service name is required/i)).toBeInTheDocument();
      });
      expect(mockUpdateService).not.toHaveBeenCalled();
    });

    it('shows error when name exceeds 255 characters', async () => {
      const user = userEvent.setup();
      render(
        <ServiceMetadataForm service={mockService} isEditable={true} />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByLabelText(/service name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'a'.repeat(256));
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/255 characters or less/i)).toBeInTheDocument();
      });
      expect(mockUpdateService).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('calls updateService with form data on successful submit', async () => {
      const user = userEvent.setup();
      mockUpdateService.mockResolvedValueOnce({
        ...mockService,
        name: 'Updated Service',
      });

      render(
        <ServiceMetadataForm service={mockService} isEditable={true} />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByLabelText(/service name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Service');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockUpdateService).toHaveBeenCalledWith('test-service-id', {
          name: 'Updated Service',
          description: 'A test service description',
          category: 'Testing',
        });
      });
    });

    it('displays success message after successful update', async () => {
      const user = userEvent.setup();
      mockUpdateService.mockResolvedValueOnce({
        ...mockService,
        name: 'Updated Service',
      });

      render(
        <ServiceMetadataForm service={mockService} isEditable={true} />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByLabelText(/service name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Service');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/service updated successfully/i)).toBeInTheDocument();
      });
    });

    it('success message has accessible role', async () => {
      const user = userEvent.setup();
      mockUpdateService.mockResolvedValueOnce({
        ...mockService,
        name: 'Updated Service',
      });

      render(
        <ServiceMetadataForm service={mockService} isEditable={true} />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByLabelText(/service name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Service');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays API error message', async () => {
      const user = userEvent.setup();
      mockUpdateService.mockRejectedValueOnce(new Error('Service name already exists'));

      render(
        <ServiceMetadataForm service={mockService} isEditable={true} />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByLabelText(/service name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Duplicate Service');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/service name already exists/i)).toBeInTheDocument();
      });
    });

    it('error message has accessible alert role', async () => {
      const user = userEvent.setup();
      mockUpdateService.mockRejectedValueOnce(new Error('Failed to update'));

      render(
        <ServiceMetadataForm service={mockService} isEditable={true} />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByLabelText(/service name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockUpdateService.mockImplementation(() => new Promise(() => {}));

      render(
        <ServiceMetadataForm service={mockService} isEditable={true} />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByLabelText(/service name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/saving.../i)).toBeInTheDocument();
      });
    });

    it('disables inputs during submission', async () => {
      const user = userEvent.setup();
      mockUpdateService.mockImplementation(() => new Promise(() => {}));

      render(
        <ServiceMetadataForm service={mockService} isEditable={true} />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByLabelText(/service name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/service name/i)).toBeDisabled();
        expect(screen.getByLabelText(/description/i)).toBeDisabled();
        expect(screen.getByLabelText(/category/i)).toBeDisabled();
      });
    });
  });

  describe('Discard Changes', () => {
    it('resets form to original values when discard is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ServiceMetadataForm service={mockService} isEditable={true} />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByLabelText(/service name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Changed Name');

      expect(nameInput).toHaveValue('Changed Name');

      await user.click(screen.getByRole('button', { name: /discard changes/i }));

      expect(nameInput).toHaveValue('Test Service');
    });

    it('disables discard button when form is not dirty', () => {
      render(
        <ServiceMetadataForm service={mockService} isEditable={true} />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.getByRole('button', { name: /discard changes/i })
      ).toBeDisabled();
    });
  });
});
