import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RolesList } from './RolesList';
import type { Role } from '@/lib/api/roles';

// Mock the hooks
const mockDeleteMutateAsync = vi.fn();
const mockSetStartMutateAsync = vi.fn();
const mockReorderMutateAsync = vi.fn();

vi.mock('@/hooks/use-roles', () => ({
  useRoles: vi.fn(),
  useDeleteRole: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
  useSetStartRole: () => ({
    mutateAsync: mockSetStartMutateAsync,
    isPending: false,
  }),
  useReorderRole: () => ({
    mutateAsync: mockReorderMutateAsync,
    isPending: false,
  }),
  useCreateRole: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useUpdateRole: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

vi.mock('@/hooks/use-transitions', () => ({
  useTransitions: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

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

import { useRoles } from '@/hooks/use-roles';

const mockUseRoles = vi.mocked(useRoles);

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

describe('RolesList', () => {
  const mockRoles: Role[] = [
    {
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
    },
    {
      id: 'role-2',
      serviceId: 'service-1',
      roleType: 'USER',
      name: 'Manager Approval',
      shortName: null,
      description: null,
      isStartRole: false,
      sortOrder: 1,
      isActive: true,
      conditions: null,
      formId: null,
      retryEnabled: null,
      retryIntervalMinutes: null,
      timeoutMinutes: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'role-3',
      serviceId: 'service-1',
      roleType: 'BOT',
      name: 'Payment Processing',
      shortName: 'Payment',
      description: 'Automated payment verification',
      isStartRole: false,
      sortOrder: 2,
      isActive: true,
      conditions: null,
      formId: null,
      retryEnabled: true,
      retryIntervalMinutes: 5,
      timeoutMinutes: 30,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRoles.mockReturnValue({
      data: { data: mockRoles },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useRoles>);
    mockDeleteMutateAsync.mockResolvedValue({});
    mockSetStartMutateAsync.mockResolvedValue({});
    mockReorderMutateAsync.mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('renders the section header', () => {
      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Workflow Steps')).toBeInTheDocument();
      expect(
        screen.getByText('Define the processing steps and their sequence')
      ).toBeInTheDocument();
    });

    it('renders add step button when editable', () => {
      render(<RolesList serviceId="service-1" isEditable={true} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByRole('button', { name: /Add Step/i })
      ).toBeInTheDocument();
    });

    it('hides add step button when not editable', () => {
      render(<RolesList serviceId="service-1" isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /Add Step/i })
      ).not.toBeInTheDocument();
    });

    it('renders all roles in the table', () => {
      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Initial Review')).toBeInTheDocument();
      expect(screen.getByText('Manager Approval')).toBeInTheDocument();
      expect(screen.getByText('Payment Processing')).toBeInTheDocument();
    });

    it('shows role type icons correctly', () => {
      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      // Check that Human and Bot labels are shown
      expect(screen.getAllByText('Human')).toHaveLength(2);
      expect(screen.getAllByText('Bot')).toHaveLength(1);
    });

    it('displays start role badge for the start role', () => {
      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    it('shows short name in parentheses when available', () => {
      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('(Review)')).toBeInTheDocument();
      expect(screen.getByText('(Payment)')).toBeInTheDocument();
    });

    it('shows description when available', () => {
      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('First review step')).toBeInTheDocument();
      expect(
        screen.getByText('Automated payment verification')
      ).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no roles exist', () => {
      mockUseRoles.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useRoles>);

      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('No workflow steps yet')).toBeInTheDocument();
      expect(
        screen.getByText('Define the processing steps for this service workflow.')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Add your first step/i })
      ).toBeInTheDocument();
    });

    it('hides add button in empty state when not editable', () => {
      mockUseRoles.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useRoles>);

      render(<RolesList serviceId="service-1" isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /Add your first step/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows skeleton while loading', () => {
      mockUseRoles.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof useRoles>);

      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      // Should not show empty state or roles
      expect(screen.queryByText('No workflow steps yet')).not.toBeInTheDocument();
      expect(screen.queryByText('Initial Review')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message on failure', () => {
      mockUseRoles.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch'),
      } as unknown as ReturnType<typeof useRoles>);

      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByText('Failed to load workflow steps')
      ).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('opens create dialog when Add Step is clicked', async () => {
      const user = userEvent.setup();
      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole('button', { name: /Add Step/i }));

      await waitFor(() => {
        expect(screen.getByText('Add Workflow Step')).toBeInTheDocument();
      });
    });

    it('opens edit dialog when Edit Step is clicked', async () => {
      const user = userEvent.setup();
      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      // Find the actions menu for the first role
      const actionButtons = screen.getAllByRole('button', {
        name: /Actions for/i,
      });
      await user.click(actionButtons[0]);

      await user.click(screen.getByText('Edit Step'));

      await waitFor(() => {
        expect(screen.getByText('Edit Workflow Step')).toBeInTheDocument();
      });
    });

    it('shows confirmation before deleting', async () => {
      const user = userEvent.setup();
      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      const actionButtons = screen.getAllByRole('button', {
        name: /Actions for/i,
      });
      await user.click(actionButtons[0]);

      await user.click(screen.getByText('Delete'));

      expect(window.confirm).toHaveBeenCalled();
    });

    it('deletes role when confirmed', async () => {
      const user = userEvent.setup();
      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      const actionButtons = screen.getAllByRole('button', {
        name: /Actions for/i,
      });
      await user.click(actionButtons[0]);

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith('role-1');
      });
    });

    it('does not delete when cancelled', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      const user = userEvent.setup();
      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      const actionButtons = screen.getAllByRole('button', {
        name: /Actions for/i,
      });
      await user.click(actionButtons[0]);

      await user.click(screen.getByText('Delete'));

      expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
    });

    it('sets role as start when Set as Start is clicked', async () => {
      const user = userEvent.setup();
      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      // Click actions for a non-start role
      const actionButtons = screen.getAllByRole('button', {
        name: /Actions for/i,
      });
      await user.click(actionButtons[1]); // Second role is not start

      await user.click(screen.getByText('Set as Start'));

      await waitFor(() => {
        expect(mockSetStartMutateAsync).toHaveBeenCalledWith('role-2');
      });
    });

    it('hides Set as Start for current start role', async () => {
      const user = userEvent.setup();
      render(<RolesList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      // Click actions for the start role
      const actionButtons = screen.getAllByRole('button', {
        name: /Actions for/i,
      });
      await user.click(actionButtons[0]); // First role is start

      // Should not have "Set as Start" option
      expect(screen.queryByText('Set as Start')).not.toBeInTheDocument();
    });
  });

  describe('Reordering', () => {
    it('shows up/down buttons when editable', () => {
      render(<RolesList serviceId="service-1" isEditable={true} />, {
        wrapper: createWrapper(),
      });

      // Should have up and down buttons for each row
      const upButtons = screen.getAllByRole('button', { name: /Move up/i });
      const downButtons = screen.getAllByRole('button', { name: /Move down/i });

      expect(upButtons).toHaveLength(3);
      expect(downButtons).toHaveLength(3);
    });

    it('disables up button for first role', () => {
      render(<RolesList serviceId="service-1" isEditable={true} />, {
        wrapper: createWrapper(),
      });

      const upButtons = screen.getAllByRole('button', { name: /Move up/i });
      expect(upButtons[0]).toBeDisabled();
    });

    it('disables down button for last role', () => {
      render(<RolesList serviceId="service-1" isEditable={true} />, {
        wrapper: createWrapper(),
      });

      const downButtons = screen.getAllByRole('button', { name: /Move down/i });
      expect(downButtons[2]).toBeDisabled();
    });

    it('reorders roles when up button is clicked', async () => {
      const user = userEvent.setup();
      render(<RolesList serviceId="service-1" isEditable={true} />, {
        wrapper: createWrapper(),
      });

      // Click up on second role
      const upButtons = screen.getAllByRole('button', { name: /Move up/i });
      await user.click(upButtons[1]);

      await waitFor(() => {
        expect(mockReorderMutateAsync).toHaveBeenCalled();
      });
    });

    it('reorders roles when down button is clicked', async () => {
      const user = userEvent.setup();
      render(<RolesList serviceId="service-1" isEditable={true} />, {
        wrapper: createWrapper(),
      });

      // Click down on first role
      const downButtons = screen.getAllByRole('button', { name: /Move down/i });
      await user.click(downButtons[0]);

      await waitFor(() => {
        expect(mockReorderMutateAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Non-editable Mode', () => {
    it('hides action buttons when not editable', () => {
      render(<RolesList serviceId="service-1" isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /Actions for/i })
      ).not.toBeInTheDocument();
    });

    it('shows order numbers instead of reorder buttons when not editable', () => {
      render(<RolesList serviceId="service-1" isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /Move up/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Move down/i })
      ).not.toBeInTheDocument();
    });
  });
});
