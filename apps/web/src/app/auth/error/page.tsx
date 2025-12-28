/**
 * Auth Error Page
 *
 * Displays authentication errors
 */

import Link from 'next/link';

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const error = params.error;

  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to access this resource.',
    Verification: 'The verification link may have expired or already been used.',
    OAuthSignin: 'Error during OAuth sign-in. Please try again.',
    OAuthCallback: 'Error during OAuth callback. Please try again.',
    OAuthCreateAccount: 'Could not create user account.',
    EmailCreateAccount: 'Could not create user account.',
    Callback: 'Authentication callback error.',
    OAuthAccountNotLinked: 'This account is already linked to another user.',
    EmailSignin: 'Error sending verification email.',
    CredentialsSignin: 'Sign in failed. Check the details you provided.',
    SessionRequired: 'Please sign in to access this page.',
    Default: 'An authentication error occurred.',
  };

  const message = error ? errorMessages[error] ?? errorMessages.Default : errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
          {error && (
            <p className="mt-1 text-xs text-gray-400">Error code: {error}</p>
          )}
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full text-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="block w-full text-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
