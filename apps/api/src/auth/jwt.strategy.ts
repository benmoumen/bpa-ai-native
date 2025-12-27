/**
 * JWT Strategy for Keycloak Token Validation
 *
 * Validates JWT tokens against Keycloak JWKS endpoint
 * Extracts user roles and info from token claims
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import type { KeycloakJwtPayload, AuthUser, UserRole } from '@bpa/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService) {
    const keycloakUrl = configService.get<string>('KEYCLOAK_URL');
    const keycloakRealm = configService.get<string>('KEYCLOAK_REALM');
    const issuerUrl = `${keycloakUrl}/realms/${keycloakRealm}`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer: issuerUrl,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuerUrl}/protocol/openid-connect/certs`,
        // NFR27: Connection timeout < 5 seconds
        timeout: 5000,
      }),
    });
  }

  /**
   * Validate JWT payload and extract user information
   * Called after token signature is verified
   */
  async validate(payload: KeycloakJwtPayload): Promise<AuthUser> {
    try {
      // Check token expiration (additional safety check)
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new UnauthorizedException('Token has expired');
      }

      // Extract roles from realm_access and resource_access
      const roles = this.extractRoles(payload);

      const user: AuthUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.preferred_username,
        keycloakId: payload.sub,
        roles,
      };

      this.logger.debug(`User authenticated: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error('Token validation failed', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Extract and map roles from Keycloak token claims
   */
  private extractRoles(payload: KeycloakJwtPayload): UserRole[] {
    const validRoles: UserRole[] = ['SERVICE_DESIGNER', 'COUNTRY_ADMIN', 'UNCTAD_SUPPORT'];
    const roles: UserRole[] = [];

    // Extract from realm_access
    if (payload.realm_access?.roles) {
      for (const role of payload.realm_access.roles) {
        const upperRole = role.toUpperCase().replace(/-/g, '_') as UserRole;
        if (validRoles.includes(upperRole)) {
          roles.push(upperRole);
        }
      }
    }

    // Extract from resource_access (client-specific roles)
    if (payload.resource_access) {
      for (const [, clientAccess] of Object.entries(payload.resource_access)) {
        const clientRoles = clientAccess as { roles?: string[] };
        if (clientRoles?.roles) {
          for (const role of clientRoles.roles) {
            const upperRole = role.toUpperCase().replace(/-/g, '_') as UserRole;
            if (validRoles.includes(upperRole) && !roles.includes(upperRole)) {
              roles.push(upperRole);
            }
          }
        }
      }
    }

    return roles;
  }
}
