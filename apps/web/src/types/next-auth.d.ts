/**
 * NextAuth.js Type Extensions
 *
 * Extends the default NextAuth types with Keycloak-specific fields
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      keycloakId?: string;
      roles?: string[];
    };
    accessToken?: string;
    idToken?: string;
    error?: string;
  }

  interface User {
    id: string;
    keycloakId?: string;
    roles?: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    keycloakId?: string;
    roles?: string[];
    error?: string;
    lastActivity?: number;
  }
}
