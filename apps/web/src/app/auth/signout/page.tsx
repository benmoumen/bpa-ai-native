/**
 * Sign Out Page
 *
 * Handles user sign out from both NextAuth and Keycloak
 */

import { redirect } from 'next/navigation';
import { auth, signOut, getKeycloakLogoutUrl } from '@/auth';

interface SignOutPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignOutPage({ searchParams }: SignOutPageProps) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || '/';

  async function handleSignOut() {
    'use server';

    // Get the current session to retrieve idToken
    const currentSession = await auth();
    const idToken = currentSession?.idToken;

    // Clear NextAuth session first
    await signOut({ redirect: false });

    // Build the Keycloak logout URL with idToken hint
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const keycloakLogoutUrl = getKeycloakLogoutUrl(idToken, baseUrl);

    // Redirect to Keycloak logout
    redirect(keycloakLogoutUrl);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sign Out</h2>
          <p className="mt-2 text-sm text-gray-600">
            {session?.user?.email
              ? `Signed in as ${session.user.email}`
              : 'Are you sure you want to sign out?'}
          </p>
        </div>

        <div className="space-y-4">
          <form action={handleSignOut}>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Sign Out
            </button>
          </form>

          <a
            href={callbackUrl}
            className="block w-full text-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  );
}
