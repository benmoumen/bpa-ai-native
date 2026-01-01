import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransitionsList } from './TransitionsList';
import type { Role } from '@/lib/api/roles';
import type { WorkflowTransition } from '@/hooks/use-transitions';

// Mock the hooks
const mockDeleteMutateAsync = vi.fn();

vi.mock('@/hooks/use-transitions', () => ({
  useTransitions: vi.fn(),
  useDeleteTransition: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
  useCreateTransition: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useUpdateTransition: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useRoleStatuses: () => ({
    data: [],
    isLoading: false,
    refetch: vi.fn(),
  }),
  useCreateDefaultStatuses: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

vi.mock('@/hooks/use-roles', () => ({
  useRoles: vi.fn(),
}));

import { useTransitions } from '@/hooks/use-transitions';
import { useRoles } from '@/hooks/use-roles';

const mockUseTransitions = vi.mocked(useTransitions);
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

describe('TransitionsList', () => {
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
  ];

  const mockTransitions: WorkflowTransition[] = [
    {
      id: 'trans-1',
      fromStatusId: 'status-1',
      toRoleId: 'role-2',
      sortOrder: 0,
      conditions: null,
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
    it('renders the section header', () => {
      render(<TransitionsList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Workflow Transitions')).toBeInTheDocument();
      expect(
        screen.getByText('Define how applications flow between steps based on outcomes')
      ).toBeInTheDocument();
    });

    it('renders add transition button when editable', () => {
      render(<TransitionsList serviceId="service-1" isEditable={true} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByRole('button', { name: /Add Transition/i })
      ).toBeInTheDocument();
    });

    it('hides add transition button when not editable', () => {
      render(<TransitionsList serviceId="service-1" isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /Add Transition/i })
      ).not.toBeInTheDocument();
    });

    it('renders transitions in the table', () => {
      render(<TransitionsList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      // Check that target role is displayed
      expect(screen.getByText('Manager Approval')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no transitions exist', () => {
      mockUseTransitions.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useTransitions>);

      render(<TransitionsList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('No transitions configured')).toBeInTheDocument();
    });

    it('returns null when no roles exist', () => {
      mockUseRoles.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useRoles>);

      const { container } = render(<TransitionsList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('shows skeleton while loading transitions', () => {
      mockUseTransitions.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useTransitions>);

      render(<TransitionsList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      // Should not show empty state or transitions
      expect(screen.queryByText('No transitions configured')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message on failure', () => {
      mockUseTransitions.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch'),
      } as unknown as ReturnType<typeof useTransitions>);

      render(<TransitionsList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByText('Failed to load workflow transitions')
      ).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('opens create dialog when Add Transition is clicked', async () => {
      const user = userEvent.setup();
      render(<TransitionsList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole('button', { name: /Add Transition/i }));

      await waitFor(() => {
        // Dialog title appears in addition to the button text
        expect(screen.getAllByText('Add Transition').length).toBeGreaterThanOrEqual(2);
      });
    });

    it('shows confirmation before deleting', async () => {
      const user = userEvent.setup();
      render(<TransitionsList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      // Find the actions menu for the transition
      const actionButton = screen.getByRole('button', {
        name: /Actions for transition/i,
      });
      await user.click(actionButton);

      await user.click(screen.getByText('Delete'));

      expect(window.confirm).toHaveBeenCalled();
    });

    it('deletes transition when confirmed', async () => {
      const user = userEvent.setup();
      render(<TransitionsList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      const actionButton = screen.getByRole('button', {
        name: /Actions for transition/i,
      });
      await user.click(actionButton);

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith('trans-1');
      });
    });

    it('does not delete when cancelled', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      const user = userEvent.setup();
      render(<TransitionsList serviceId="service-1" />, {
        wrapper: createWrapper(),
      });

      const actionButton = screen.getByRole('button', {
        name: /Actions for transition/i,
      });
      await user.click(actionButton);

      await user.click(screen.getByText('Delete'));

      expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('Non-editable Mode', () => {
    it('hides action buttons when not editable', () => {
      render(<TransitionsList serviceId="service-1" isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /Actions for transition/i })
      ).not.toBeInTheDocument();
    });
  });
});
