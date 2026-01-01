/**
 * Sign In Page
 *
 * Handles redirecting users to Keycloak for authentication
 * Respects callbackUrl for post-login redirect
 */

import { signIn } from '@/auth';

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || '/dashboard';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 overflow-y-auto">
      <div className="w-full max-w-[28rem] space-y-8 p-8 bg-white rounded-lg shadow-md my-8 mx-4">
        <div className="w-full">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            BPA Service Designer
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in with your organization credentials
          </p>
        </div>

        <form
          className="mt-8 space-y-6"
          action={async () => {
            'use server';
            await signIn('keycloak', { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Sign in with Keycloak
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 mt-6">
          <p>Secure authentication via OAuth 2.0 + PKCE</p>
        </div>
      </div>
    </div>
  );
}
