import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateRoleDialog } from './CreateRoleDialog';
import type { Role } from '@/lib/api/roles';

// Mock the hooks
const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();

vi.mock('@/hooks/use-roles', () => ({
  useCreateRole: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
  useUpdateRole: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
}));

// Mock useForms hook
vi.mock('@/hooks/use-forms', () => ({
  useForms: () => ({
    data: {
      data: [
        { id: 'form-1', name: 'Application Form', type: 'APPLICANT', serviceId: 'service-1', isActive: true, createdAt: '', updatedAt: '' },
        { id: 'form-2', name: 'Operator Guide', type: 'GUIDE', serviceId: 'service-1', isActive: true, createdAt: '', updatedAt: '' },
      ],
    },
    isLoading: false,
    isError: false,
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

describe('CreateRoleDialog', () => {
  const mockOnOpenChange = vi.fn();

  const defaultProps = {
    serviceId: 'service-1',
    open: true,
    onOpenChange: mockOnOpenChange,
  };

  const mockRole: Role = {
    id: 'role-1',
    serviceId: 'service-1',
    roleType: 'USER',
    name: 'Initial Review',
    shortName: 'Review',
    description: 'First review step',
    isStartRole: true,
    sortOrder: 0,
    isActive: true,
    conditions: null,
    formId: null,
    retryEnabled: null,
    retryIntervalMinutes: null,
    timeoutMinutes: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutateAsync.mockResolvedValue({});
    mockUpdateMutateAsync.mockResolvedValue({});
  });

  describe('Create Mode', () => {
    it('renders the dialog with create title', () => {
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Add Workflow Step')).toBeInTheDocument();
      expect(
        screen.getByText('Define a new step in the workflow process.')
      ).toBeInTheDocument();
    });

    it('shows role type selector in create mode', () => {
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Step Type')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('defaults to USER role type', () => {
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByText('Step processed by human operators (staff/approvers)')
      ).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('renders the dialog with edit title', () => {
      render(<CreateRoleDialog {...defaultProps} editRole={mockRole} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Edit Workflow Step')).toBeInTheDocument();
      expect(
        screen.getByText('Update the step configuration for this workflow.')
      ).toBeInTheDocument();
    });

    it('shows role type as non-editable in edit mode', () => {
      render(<CreateRoleDialog {...defaultProps} editRole={mockRole} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByText('Step type cannot be changed after creation.')
      ).toBeInTheDocument();
    });

    it('pre-fills form with existing role data', () => {
      render(<CreateRoleDialog {...defaultProps} editRole={mockRole} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByDisplayValue('Initial Review')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Review')).toBeInTheDocument();
      expect(screen.getByDisplayValue('First review step')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required name field on submit', async () => {
      const user = userEvent.setup();
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole('button', { name: /Add Step/i }));

      await waitFor(() => {
        expect(screen.getByText('Step name is required')).toBeInTheDocument();
      });
    });

    it('validates name is not just whitespace', async () => {
      const user = userEvent.setup();
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.type(screen.getByLabelText(/Step Name/), '   ');
      await user.click(screen.getByRole('button', { name: /Add Step/i }));

      await waitFor(() => {
        expect(screen.getByText('Step name is required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('creates USER role on valid submit', async () => {
      const user = userEvent.setup();
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.type(
        screen.getByLabelText(/Step Name/),
        'Initial Review'
      );
      await user.type(
        screen.getByLabelText(/Short Name/),
        'Review'
      );
      await user.type(
        screen.getByLabelText(/Description/),
        'First review step'
      );
      await user.click(screen.getByRole('button', { name: /Add Step/i }));

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith({
          name: 'Initial Review',
          roleType: 'USER',
          shortName: 'Review',
          description: 'First review step',
          formId: undefined,
        });
      });

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('updates role on valid edit submit', async () => {
      const user = userEvent.setup();
      render(<CreateRoleDialog {...defaultProps} editRole={mockRole} />, {
        wrapper: createWrapper(),
      });

      // Clear and update name
      const nameInput = screen.getByLabelText(/Step Name/);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Review');
      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
          roleId: 'role-1',
          data: {
            name: 'Updated Review',
            shortName: 'Review',
            description: 'First review step',
            formId: undefined,
          },
        });
      });

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('shows error message on create failure', async () => {
      mockCreateMutateAsync.mockRejectedValue(
        new Error('Role name already exists')
      );

      const user = userEvent.setup();
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.type(screen.getByLabelText(/Step Name/), 'Duplicate Role');
      await user.click(screen.getByRole('button', { name: /Add Step/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Role name already exists')
        ).toBeInTheDocument();
      });
    });

    it('trims whitespace from fields before submitting', async () => {
      const user = userEvent.setup();
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.type(screen.getByLabelText(/Step Name/), '  My Step  ');
      await user.click(screen.getByRole('button', { name: /Add Step/i }));

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith({
          name: 'My Step',
          roleType: 'USER',
          shortName: undefined,
          description: undefined,
          formId: undefined,
        });
      });
    });
  });

  describe('Dialog Behavior', () => {
    it('closes dialog when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('resets form when dialog is reopened', async () => {
      const { rerender } = render(
        <CreateRoleDialog {...defaultProps} open={false} />,
        { wrapper: createWrapper() }
      );

      rerender(<CreateRoleDialog {...defaultProps} open={true} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Step Name/) as HTMLInputElement;
        expect(nameInput.value).toBe('');
      });
    });

    it('auto-focuses name input when dialog opens', () => {
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const nameInput = screen.getByLabelText(/Step Name/);
      expect(nameInput).toHaveFocus();
    });
  });

  describe('Character Counter', () => {
    it('displays character count for name field', () => {
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('0/255 characters')).toBeInTheDocument();
    });

    it('updates character count as user types', async () => {
      const user = userEvent.setup();
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.type(screen.getByLabelText(/Step Name/), 'My Test Step');

      await waitFor(() => {
        expect(screen.getByText('12/255 characters')).toBeInTheDocument();
      });
    });
  });

  describe('Form Assignment', () => {
    it('shows form selector for USER role type', () => {
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Assigned Form')).toBeInTheDocument();
      expect(screen.getByText('Optional form to display at this workflow step')).toBeInTheDocument();
    });

    it('shows available forms in the selector', async () => {
      const user = userEvent.setup();
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Open the form selector (second combobox, first is role type)
      const comboboxes = screen.getAllByRole('combobox');
      const formSelector = comboboxes[1]; // Second combobox is form selector
      await user.click(formSelector);

      await waitFor(() => {
        expect(screen.getByText('No form')).toBeInTheDocument();
        expect(screen.getByText('Application Form')).toBeInTheDocument();
        expect(screen.getByText('Operator Guide')).toBeInTheDocument();
      });
    });

    it('includes formId in create payload when form is selected', async () => {
      const user = userEvent.setup();
      render(<CreateRoleDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Fill in required name field
      await user.type(screen.getByLabelText(/Step Name/), 'New Step');

      // Select a form
      const comboboxes = screen.getAllByRole('combobox');
      const formSelector = comboboxes[1];
      await user.click(formSelector);
      await user.click(screen.getByText('Operator Guide'));

      await user.click(screen.getByRole('button', { name: /Add Step/i }));

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Step',
            formId: 'form-2',
          })
        );
      });
    });
  });
});
