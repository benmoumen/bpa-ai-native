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
import type { JWT } from 'next-auth/jwt';

// Inactivity timeout in seconds (NFR9: 30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60;

// Refresh token 5 minutes before expiry
const TOKEN_REFRESH_BUFFER = 5 * 60;

/**
 * Centralized protected route patterns
 * Used by both middleware and authorized callback
 */
export const PROTECTED_PATHS = ['/dashboard', '/services', '/admin'];

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const keycloakUrl = process.env.KEYCLOAK_URL;
    const keycloakRealm = process.env.KEYCLOAK_REALM;
    const tokenEndpoint = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`;

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw new Error(refreshedTokens.error || 'Failed to refresh token');
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
      error: undefined, // Clear any previous errors
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshTokenError',
    };
  }
}

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
        return token;
      }

      // Update last activity on session update (client-side activity refresh)
      if (trigger === 'update') {
        token.lastActivity = now;
      }

      // Check for inactivity timeout (NFR9: 30 minutes)
      const lastActivity = (token.lastActivity as number) || now;
      if (now - lastActivity > INACTIVITY_TIMEOUT) {
        return { ...token, error: 'SessionInactive' };
      }

      // Check if token needs refresh (5 minutes before expiry)
      const expiresAt = token.expiresAt as number;
      if (expiresAt && now >= expiresAt - TOKEN_REFRESH_BUFFER) {
        // Token expired or about to expire - attempt refresh
        if (token.refreshToken) {
          return await refreshAccessToken(token);
        }
        return { ...token, error: 'TokenExpired' };
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
        session.idToken = token.idToken as string;

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
      const hasError = !!auth?.error;
      const isProtectedRoute = PROTECTED_PATHS.some((path) =>
        nextUrl.pathname.startsWith(path)
      );

      if (isProtectedRoute) {
        // If user has session error, force re-authentication
        if (hasError) {
          const signOutUrl = new URL('/api/auth/signout', nextUrl);
          signOutUrl.searchParams.set('callbackUrl', nextUrl.pathname);
          return Response.redirect(signOutUrl);
        }
        if (isLoggedIn) return true;
        // Redirect to login, preserving the intended destination
        const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
        return Response.redirect(new URL(`/api/auth/signin?callbackUrl=${callbackUrl}`, nextUrl));
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

/**
 * Get Keycloak end-session URL for complete logout
 * This logs out from both NextAuth and Keycloak
 */
export function getKeycloakLogoutUrl(idToken?: string, postLogoutRedirectUri?: string): string {
  const keycloakUrl = process.env.KEYCLOAK_URL;
  const keycloakRealm = process.env.KEYCLOAK_REALM;
  const logoutUrl = new URL(
    `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/logout`
  );

  if (idToken) {
    logoutUrl.searchParams.set('id_token_hint', idToken);
  }

  if (postLogoutRedirectUri) {
    logoutUrl.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
  }

  return logoutUrl.toString();
}
