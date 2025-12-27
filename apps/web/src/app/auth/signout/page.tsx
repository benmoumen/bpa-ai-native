/**
 * Sign Out Page
 *
 * Handles user sign out
 */

import { signOut } from '@/auth';

export default function SignOutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sign Out</h2>
          <p className="mt-2 text-sm text-gray-600">
            Are you sure you want to sign out?
          </p>
        </div>

        <div className="space-y-4">
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Sign Out
            </button>
          </form>

          <a
            href="/dashboard"
            className="block w-full text-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  );
}
