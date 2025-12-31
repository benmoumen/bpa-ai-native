import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FormList } from './FormList';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock the hooks
const mockForms = [
  {
    id: 'form-1',
    serviceId: 'service-1',
    type: 'APPLICANT' as const,
    name: 'Business Registration Form',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'form-2',
    serviceId: 'service-1',
    type: 'GUIDE' as const,
    name: 'Application Review Form',
    isActive: true,
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
  {
    id: 'form-3',
    serviceId: 'service-1',
    type: 'APPLICANT' as const,
    name: 'Inactive Form',
    isActive: false,
    createdAt: '2025-01-03T00:00:00Z',
    updatedAt: '2025-01-03T00:00:00Z',
  },
];

const mockUseForms = vi.fn();
const mockUseCreateForm = vi.fn();
const mockUseDeleteForm = vi.fn();

vi.mock('@/hooks/use-forms', () => ({
  useForms: () => mockUseForms(),
  useCreateForm: () => mockUseCreateForm(),
  useDeleteForm: () => mockUseDeleteForm(),
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

describe('FormList', () => {
  const defaultProps = {
    serviceId: 'service-1',
    isEditable: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseForms.mockReturnValue({
      data: {
        data: mockForms,
        meta: { total: 3, page: 1, perPage: 20, hasNext: false },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseCreateForm.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    mockUseDeleteForm.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  describe('Rendering', () => {
    it('renders the form list header', () => {
      render(<FormList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Forms')).toBeInTheDocument();
      expect(
        screen.getByText('Data collection forms for applicants and operators')
      ).toBeInTheDocument();
    });

    it('renders both Add Applicant Form and Add Guide Form buttons when editable', () => {
      render(<FormList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByRole('button', { name: /add applicant form/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /add guide form/i })
      ).toBeInTheDocument();
    });

    it('does not render Add buttons when not editable', () => {
      render(<FormList {...defaultProps} isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /add applicant form/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /add guide form/i })
      ).not.toBeInTheDocument();
    });

    it('renders forms in a table', () => {
      render(<FormList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Business Registration Form')).toBeInTheDocument();
      expect(screen.getByText('Application Review Form')).toBeInTheDocument();
      expect(screen.getByText('Inactive Form')).toBeInTheDocument();
    });

    it('displays form type badges', () => {
      render(<FormList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Two APPLICANT forms and one GUIDE form
      const applicantBadges = screen.getAllByText('Applicant');
      const guideBadges = screen.getAllByText('Guide');

      expect(applicantBadges.length).toBe(2);
      expect(guideBadges.length).toBe(1);
    });

    it('displays form status (Active/Inactive)', () => {
      render(<FormList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Two active forms and one inactive
      const activeLabels = screen.getAllByText('Active');
      const inactiveLabels = screen.getAllByText('Inactive');

      expect(activeLabels.length).toBe(2);
      expect(inactiveLabels.length).toBe(1);
    });
  });

  describe('Loading State', () => {
    it('renders loading skeleton when loading', () => {
      mockUseForms.mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<FormList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Check for skeleton elements (animate-pulse class)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('renders error message when there is an error', () => {
      mockUseForms.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch forms'),
      });

      render(<FormList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Failed to load forms')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch forms')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no forms exist', () => {
      mockUseForms.mockReturnValue({
        data: { data: [], meta: { total: 0, page: 1, perPage: 20, hasNext: false } },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<FormList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('No forms yet')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Create forms to collect data from applicants and operators.'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /add your first applicant form/i })
      ).toBeInTheDocument();
    });

    it('does not show add button in empty state when not editable', () => {
      mockUseForms.mockReturnValue({
        data: { data: [], meta: { total: 0, page: 1, perPage: 20, hasNext: false } },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<FormList {...defaultProps} isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /add your first applicant form/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders action buttons for each form when editable', () => {
      render(<FormList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const actionButtons = screen.getAllByRole('button', {
        name: /actions for/i,
      });
      expect(actionButtons.length).toBe(3);
    });

    it('does not show actions column when not editable', () => {
      render(<FormList {...defaultProps} isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /actions for/i })
      ).not.toBeInTheDocument();
    });
  });
});
