import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegistrationList } from './RegistrationList';

// Mock the hooks
const mockRegistrations = [
  {
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
  },
  {
    id: 'reg-2',
    serviceId: 'service-1',
    name: 'Import Permit',
    shortName: 'IP',
    key: 'import-permit',
    description: null,
    isActive: true,
    sortOrder: 1,
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
];

const mockUseRegistrations = vi.fn();
const mockUseCreateRegistration = vi.fn();
const mockUseUpdateRegistration = vi.fn();
const mockUseDeleteRegistration = vi.fn();

vi.mock('@/hooks/use-registrations', () => ({
  useRegistrations: () => mockUseRegistrations(),
  useCreateRegistration: () => mockUseCreateRegistration(),
  useUpdateRegistration: () => mockUseUpdateRegistration(),
  useDeleteRegistration: () => mockUseDeleteRegistration(),
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

describe('RegistrationList', () => {
  const defaultProps = {
    serviceId: 'service-1',
    isEditable: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseRegistrations.mockReturnValue({
      data: { data: mockRegistrations, meta: { total: 2, page: 1, perPage: 20, hasNext: false } },
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseCreateRegistration.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    mockUseUpdateRegistration.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    mockUseDeleteRegistration.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  describe('Rendering', () => {
    it('renders the registration list header', () => {
      render(<RegistrationList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Registrations')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Authorization types applicants can apply for within this service'
        )
      ).toBeInTheDocument();
    });

    it('renders the Add Registration button when editable', () => {
      render(<RegistrationList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByRole('button', { name: /add registration/i })
      ).toBeInTheDocument();
    });

    it('does not render the Add Registration button when not editable', () => {
      render(<RegistrationList {...defaultProps} isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /add registration/i })
      ).not.toBeInTheDocument();
    });

    it('renders registrations in a table', () => {
      render(<RegistrationList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Business License')).toBeInTheDocument();
      expect(screen.getByText('Import Permit')).toBeInTheDocument();
      expect(screen.getByText('BL')).toBeInTheDocument();
      expect(screen.getByText('IP')).toBeInTheDocument();
      expect(screen.getByText('business-license')).toBeInTheDocument();
      expect(screen.getByText('import-permit')).toBeInTheDocument();
    });

    it('displays description or placeholder', () => {
      render(<RegistrationList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByText('Apply for a business license')
      ).toBeInTheDocument();
      expect(screen.getByText('---')).toBeInTheDocument(); // null description placeholder
    });
  });

  describe('Loading State', () => {
    it('renders loading skeleton when loading', () => {
      mockUseRegistrations.mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<RegistrationList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Check for skeleton elements (animate-pulse class)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('renders error message when there is an error', () => {
      mockUseRegistrations.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch'),
      });

      render(<RegistrationList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByText('Failed to load registrations')
      ).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no registrations exist', () => {
      mockUseRegistrations.mockReturnValue({
        data: { data: [], meta: { total: 0, page: 1, perPage: 20, hasNext: false } },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RegistrationList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('No registrations yet')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Add your first registration to define what applicants can apply for.'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /add your first registration/i })
      ).toBeInTheDocument();
    });

    it('does not show add button in empty state when not editable', () => {
      mockUseRegistrations.mockReturnValue({
        data: { data: [], meta: { total: 0, page: 1, perPage: 20, hasNext: false } },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<RegistrationList {...defaultProps} isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /add your first registration/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders Add Registration button when editable', () => {
      render(<RegistrationList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByRole('button', { name: /add registration/i })
      ).toBeInTheDocument();
    });

    it('renders action buttons for each registration', () => {
      render(<RegistrationList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const actionButtons = screen.getAllByRole('button', {
        name: /actions for/i,
      });
      expect(actionButtons.length).toBe(2);
    });

    it('does not show actions column when not editable', () => {
      render(<RegistrationList {...defaultProps} isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /actions for/i })
      ).not.toBeInTheDocument();
    });
  });
});
