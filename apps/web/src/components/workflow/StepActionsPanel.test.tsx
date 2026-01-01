import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StepActionsPanel } from './StepActionsPanel';
import type { Role } from '@/lib/api/roles';
import type { RoleStatus } from '@/hooks/use-transitions';

// Mock the hooks
const mockDeleteMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();

vi.mock('@/hooks/use-transitions', () => ({
  useRoleStatuses: vi.fn(),
  useTransitions: vi.fn(),
  useDeleteRoleStatus: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
  useUpdateRoleStatus: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
}));

import { useRoleStatuses, useTransitions } from '@/hooks/use-transitions';

const mockUseRoleStatuses = vi.mocked(useRoleStatuses);
const mockUseTransitions = vi.mocked(useTransitions);

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

describe('StepActionsPanel', () => {
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

  const mockStatuses: RoleStatus[] = [
    {
      id: 'status-1',
      roleId: 'role-1',
      code: 'PENDING',
      name: 'Pending',
      isDefault: true,
      sortOrder: 0,
      conditions: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'status-2',
      roleId: 'role-1',
      code: 'PASSED',
      name: 'Approved',
      isDefault: true,
      sortOrder: 1,
      conditions: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'status-3',
      roleId: 'role-1',
      code: 'RETURNED',
      name: 'Returned',
      isDefault: true,
      sortOrder: 2,
      conditions: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'status-4',
      roleId: 'role-1',
      code: 'REJECTED',
      name: 'Rejected',
      isDefault: true,
      sortOrder: 3,
      conditions: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ];

  const mockTransitions = [
    {
      id: 'trans-1',
      fromStatusId: 'status-2',
      toRoleId: 'role-2',
      sortOrder: 0,
      conditions: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRoleStatuses.mockReturnValue({
      data: mockStatuses,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useRoleStatuses>);
    mockUseTransitions.mockReturnValue({
      data: mockTransitions,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useTransitions>);
    mockDeleteMutateAsync.mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('renders section header', () => {
      render(<StepActionsPanel role={mockRole} serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Available Actions')).toBeInTheDocument();
      expect(
        screen.getByText('Actions that operators can take at this step')
      ).toBeInTheDocument();
    });

    it('renders all status types with correct badges', () => {
      render(<StepActionsPanel role={mockRole} serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      // Check for status type badges - use getAllByText since there may be multiple instances
      expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Approved').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Returned').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Rejected').length).toBeGreaterThanOrEqual(1);
    });

    it('shows transition destinations for statuses with transitions', () => {
      render(<StepActionsPanel role={mockRole} serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      // PASSED status has a transition
      // Check that the transition is displayed (shows role ID suffix)
      expect(screen.getByText(/role-2/)).toBeInTheDocument();
    });

    it('shows "No transitions" for statuses without transitions', () => {
      render(<StepActionsPanel role={mockRole} serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      // Multiple statuses without transitions
      const noTransitionTexts = screen.getAllByText('No transitions');
      expect(noTransitionTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('shows message when no statuses exist', () => {
      mockUseRoleStatuses.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useRoleStatuses>);

      render(<StepActionsPanel role={mockRole} serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByText('No actions configured. Create default statuses first.')
      ).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows skeleton while loading', () => {
      mockUseRoleStatuses.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useRoleStatuses>);

      render(<StepActionsPanel role={mockRole} serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      // Should not show empty message
      expect(
        screen.queryByText('No actions configured. Create default statuses first.')
      ).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message on failure', () => {
      mockUseRoleStatuses.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch'),
      } as unknown as ReturnType<typeof useRoleStatuses>);

      render(<StepActionsPanel role={mockRole} serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Failed to load actions')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('opens edit dialog when Edit Label is clicked', async () => {
      const user = userEvent.setup();
      render(<StepActionsPanel role={mockRole} serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      // Find actions menu for the first status
      const actionButtons = screen.getAllByRole('button', {
        name: /Actions for/i,
      });
      await user.click(actionButtons[0]);

      await user.click(screen.getByText('Edit Label'));

      await waitFor(() => {
        expect(screen.getByText('Edit Action Label')).toBeInTheDocument();
      });
    });

    it('does not show delete for default statuses', async () => {
      const user = userEvent.setup();
      render(<StepActionsPanel role={mockRole} serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      // All mock statuses have isDefault: true
      const actionButtons = screen.getAllByRole('button', {
        name: /Actions for/i,
      });
      await user.click(actionButtons[0]);

      // Delete should not be present for default statuses
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('shows delete for custom statuses', async () => {
      // Add a custom status
      const customStatus: RoleStatus = {
        id: 'status-custom',
        roleId: 'role-1',
        code: 'PASSED',
        name: 'Custom Approval',
        isDefault: false, // Non-default
        sortOrder: 5,
        conditions: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      mockUseRoleStatuses.mockReturnValue({
        data: [customStatus],
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useRoleStatuses>);

      const user = userEvent.setup();
      render(<StepActionsPanel role={mockRole} serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      const actionButton = screen.getByRole('button', {
        name: /Actions for Custom Approval/i,
      });
      await user.click(actionButton);

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('confirms before deleting custom status', async () => {
      const customStatus: RoleStatus = {
        id: 'status-custom',
        roleId: 'role-1',
        code: 'PASSED',
        name: 'Custom Approval',
        isDefault: false,
        sortOrder: 5,
        conditions: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      mockUseRoleStatuses.mockReturnValue({
        data: [customStatus],
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useRoleStatuses>);

      const user = userEvent.setup();
      render(<StepActionsPanel role={mockRole} serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      const actionButton = screen.getByRole('button', {
        name: /Actions for Custom Approval/i,
      });
      await user.click(actionButton);
      await user.click(screen.getByText('Delete'));

      expect(window.confirm).toHaveBeenCalled();
      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith('status-custom');
      });
    });
  });

  describe('Non-editable Mode', () => {
    it('hides action buttons when not editable', () => {
      render(
        <StepActionsPanel
          role={mockRole}
          serviceId="service-1"
          isEditable={false}
        />,
        {
          wrapper: createWrapper(),
        }
      );

      expect(
        screen.queryByRole('button', { name: /Actions for/i })
      ).not.toBeInTheDocument();
    });
  });
});
