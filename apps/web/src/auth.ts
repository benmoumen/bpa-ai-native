/**
 * NextAuth.js (Auth.js v5) Configuration
 *
 * Implements Keycloak SSO with OAuth2 + PKCE flow
 * NFR10: PKCE required
 * NFR11: JWT expires in 1 hour
 * NFR9: 30 minutes inactivity timeout
 */

import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';
import type { NextAuthConfig } from 'next-auth';

// Inactivity timeout in seconds (NFR9: 30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60;

/**
 * Keycloak provider configuration with PKCE
 */
const keycloakProvider = Keycloak({
  clientId: process.env.KEYCLOAK_CLIENT_ID!,
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
  issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
  authorization: {
    params: {
      // Force PKCE for enhanced security (NFR10)
      code_challenge_method: 'S256',
    },
  },
});

/**
 * Auth.js configuration
 */
const authConfig: NextAuthConfig = {
  providers: [keycloakProvider],

  // Use JWT strategy for stateless sessions
  session: {
    strategy: 'jwt',
    // Session max age: 1 hour (NFR11)
    maxAge: 60 * 60, // 1 hour in seconds
  },

  callbacks: {
    /**
     * JWT callback - runs when JWT is created or updated
     */
    async jwt({ token, account, profile, trigger }) {
      const now = Math.floor(Date.now() / 1000);

      // Initial sign in - add Keycloak data to token
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.expiresAt = account.expires_at;
        token.keycloakId = profile.sub ?? undefined;
        token.lastActivity = now;

        // Extract roles from Keycloak token
        const keycloakProfile = profile as {
          realm_access?: { roles: string[] };
          resource_access?: Record<string, { roles: string[] }>;
        };

        token.roles = keycloakProfile.realm_access?.roles ?? [];
      }

      // Update last activity on session update (client-side activity refresh)
      if (trigger === 'update') {
        token.lastActivity = now;
      }

      // Check for inactivity timeout (NFR9: 30 minutes)
      const lastActivity = (token.lastActivity as number) || now;
      if (now - lastActivity > INACTIVITY_TIMEOUT) {
        token.error = 'SessionInactive';
      }

      // Check if token has expired (NFR11: 1 hour)
      if (token.expiresAt && now >= (token.expiresAt as number)) {
        token.error = 'TokenExpired';
      }

      return token;
    },

    /**
     * Session callback - runs when session is checked
     */
    async session({ session, token }) {
      // Add custom fields to session
      if (token) {
        session.user.id = token.sub as string;
        session.user.keycloakId = token.keycloakId as string;
        session.user.roles = (token.roles as string[]) ?? [];
        session.accessToken = token.accessToken as string;

        // Check for session errors
        if (token.error) {
          session.error = token.error as string;
        }
      }

      return session;
    },

    /**
     * Authorized callback - controls access to protected routes
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = nextUrl.pathname.startsWith('/dashboard') ||
                               nextUrl.pathname.startsWith('/services') ||
                               nextUrl.pathname.startsWith('/admin');

      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        // Redirect to login, preserving the intended destination
        return Response.redirect(new URL('/api/auth/signin', nextUrl));
      }

      return true;
    },
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Exported auth handlers and utilities
 */
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
