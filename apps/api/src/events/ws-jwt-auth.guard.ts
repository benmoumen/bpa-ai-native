import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

interface JwtPayload {
  sub: string;
  email?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: Record<string, { roles: string[] }>;
}

/**
 * WebSocket JWT Authentication Guard
 *
 * Story 6-1d: Backend Event Stream
 *
 * Validates JWT tokens from WebSocket handshake for Keycloak SSO.
 */
@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtAuthGuard.name);
  private jwksClient: JwksClient | null = null;

  constructor(private configService: ConfigService) {
    const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
    const keycloakRealm = this.configService.get<string>('KEYCLOAK_REALM');

    if (keycloakUrl && keycloakRealm) {
      this.jwksClient = new JwksClient({
        jwksUri: `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/certs`,
        cache: true,
        cacheMaxAge: 600000, // 10 minutes
      });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip auth in development if no Keycloak configured
    if (!this.jwksClient) {
      this.logger.warn('JWKS client not configured, skipping WebSocket auth');
      return true;
    }

    const client: Socket = context.switchToWs().getClient();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Missing authentication token');
    }

    try {
      const decoded = await this.verifyToken(token);
      // Attach user to socket data for later use

      (client.data as Record<string, unknown>).user = {
        id: decoded.sub,
        email: decoded.email,
        roles: decoded.realm_access?.roles || [],
      };
      return true;
    } catch (error) {
      this.logger.debug(`WebSocket auth failed: ${String(error)}`);
      throw new WsException('Invalid authentication token');
    }
  }

  private extractToken(client: Socket): string | null {
    // Check Authorization header in handshake
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // Check query parameter (fallback for browsers)
    const queryToken = client.handshake.query.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    // Check auth object in handshake
    const auth = client.handshake.auth as Record<string, unknown> | undefined;
    const authToken = auth?.token;
    if (typeof authToken === 'string') {
      return authToken;
    }

    return null;
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    // Decode header to get kid
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new Error('Invalid token structure');
    }

    const kid = decoded.header.kid;
    if (!kid) {
      throw new Error('Token missing key ID');
    }

    // Get signing key from JWKS
    const key = await this.jwksClient!.getSigningKey(kid);
    const publicKey = key.getPublicKey();

    // Verify token
    const verified = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
    }) as JwtPayload;

    return verified;
  }
}
