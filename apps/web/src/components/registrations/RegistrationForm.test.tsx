import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegistrationForm } from './RegistrationForm';

// Mock the hooks
const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();

vi.mock('@/hooks/use-registrations', () => ({
  useCreateRegistration: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
  useUpdateRegistration: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
}));

// Wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('RegistrationForm', () => {
  const mockOnOpenChange = vi.fn();

  const defaultProps = {
    serviceId: 'service-1',
    registration: null,
    open: true,
    onOpenChange: mockOnOpenChange,
  };

  const existingRegistration = {
    id: 'reg-1',
    serviceId: 'service-1',
    name: 'Business License',
    shortName: 'BL',
    key: 'business-license',
    description: 'Apply for a business license',
    isActive: true,
    sortOrder: 0,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutateAsync.mockResolvedValue({});
    mockUpdateMutateAsync.mockResolvedValue({});
  });

  describe('Create Mode', () => {
    it('renders the create form with correct title', () => {
      render(<RegistrationForm {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Add Registration')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Create a new registration type that applicants can apply for.'
        )
      ).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(<RegistrationForm {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Short Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Unique Key/)).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it('auto-generates key from name', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const nameInput = screen.getByLabelText(/^Name/);
      await user.type(nameInput, 'Business License Application');

      await waitFor(() => {
        const keyInput = screen.getByLabelText(/Unique Key/) as HTMLInputElement;
        expect(keyInput.value).toBe('business-license-application');
      });
    });

    it('allows key to be edited manually', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const nameInput = screen.getByLabelText(/^Name/);
      const keyInput = screen.getByLabelText(/Unique Key/);

      // Type name first
      await user.type(nameInput, 'Test');

      // Then manually edit key
      await user.clear(keyInput);
      await user.type(keyInput, 'custom-key');

      // Change name again - key should NOT auto-update
      await user.type(nameInput, ' More');

      await waitFor(() => {
        expect((keyInput as HTMLInputElement).value).toBe('custom-key');
      });
    });

    it('validates required fields on submit', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Submit without filling any fields
      await user.click(screen.getByRole('button', { name: /Create Registration/i }));

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Short name is required')).toBeInTheDocument();
        expect(screen.getByText('Key is required')).toBeInTheDocument();
      });
    });

    it('validates key format', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Fill required fields with invalid key
      await user.type(screen.getByLabelText(/^Name/), 'Test');
      await user.type(screen.getByLabelText(/Short Name/), 'T');

      const keyInput = screen.getByLabelText(/Unique Key/);
      await user.clear(keyInput);
      await user.type(keyInput, 'Invalid Key!');

      await user.click(screen.getByRole('button', { name: /Create Registration/i }));

      await waitFor(() => {
        expect(
          screen.getByText(
            'Key must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens'
          )
        ).toBeInTheDocument();
      });
    });

    it('creates registration on valid submit', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.type(screen.getByLabelText(/^Name/), 'Business License');
      await user.type(screen.getByLabelText(/Short Name/), 'BL');
      await user.type(
        screen.getByLabelText('Description'),
        'Apply for a business license'
      );

      await user.click(screen.getByRole('button', { name: /Create Registration/i }));

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith({
          name: 'Business License',
          shortName: 'BL',
          key: 'business-license',
          description: 'Apply for a business license',
        });
      });

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('shows error message on create failure', async () => {
      mockCreateMutateAsync.mockRejectedValue(new Error('Duplicate key'));

      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.type(screen.getByLabelText(/^Name/), 'Test');
      await user.type(screen.getByLabelText(/Short Name/), 'T');

      await user.click(screen.getByRole('button', { name: /Create Registration/i }));

      await waitFor(() => {
        expect(screen.getByText('Duplicate key')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('renders the edit form with correct title', () => {
      render(
        <RegistrationForm
          {...defaultProps}
          registration={existingRegistration}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Edit Registration')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Update the registration details. The unique key cannot be changed.'
        )
      ).toBeInTheDocument();
    });

    it('populates form with existing data', () => {
      render(
        <RegistrationForm
          {...defaultProps}
          registration={existingRegistration}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByDisplayValue('Business License')).toBeInTheDocument();
      expect(screen.getByDisplayValue('BL')).toBeInTheDocument();
      expect(screen.getByDisplayValue('business-license')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('Apply for a business license')
      ).toBeInTheDocument();
    });

    it('disables key field in edit mode', () => {
      render(
        <RegistrationForm
          {...defaultProps}
          registration={existingRegistration}
        />,
        { wrapper: createWrapper() }
      );

      const keyInput = screen.getByLabelText(/Unique Key/);
      expect(keyInput).toBeDisabled();
    });

    it('updates registration on valid submit', async () => {
      const user = userEvent.setup();
      render(
        <RegistrationForm
          {...defaultProps}
          registration={existingRegistration}
        />,
        { wrapper: createWrapper() }
      );

      // Update name
      const nameInput = screen.getByLabelText(/^Name/);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Business License');

      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
          id: 'reg-1',
          data: {
            name: 'Updated Business License',
            shortName: 'BL',
            description: 'Apply for a business license',
          },
        });
      });

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Dialog Behavior', () => {
    it('closes dialog when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('resets form when dialog is reopened', async () => {
      const { rerender } = render(
        <RegistrationForm {...defaultProps} open={false} />,
        { wrapper: createWrapper() }
      );

      // Open dialog
      rerender(<RegistrationForm {...defaultProps} open={true} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/^Name/) as HTMLInputElement;
        expect(nameInput.value).toBe('');
      });
    });
  });
});
