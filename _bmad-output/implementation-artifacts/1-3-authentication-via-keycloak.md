# Story 1.3: Authentication via Keycloak

Status: ready-for-dev

---

## Story

As a **User**,
I want to authenticate via Keycloak SSO using OAuth 2.0 + PKCE,
So that I can securely access the Service Designer with my organization credentials.

---

## Acceptance Criteria

1. **Given** a user is not authenticated, **When** the user accesses a protected route in the web app, **Then** the user is redirected to Keycloak login page **And** the OAuth 2.0 + PKCE flow is initiated (NFR10)

2. **Given** a user completes Keycloak authentication, **When** Keycloak redirects back to the application, **Then** the user receives a valid JWT access token (NFR11: expires in 1 hour) **And** a session is created in the database **And** the user is redirected to their original destination

3. **Given** an authenticated user's session, **When** the user is inactive for 30 minutes, **Then** the session is invalidated (NFR9) **And** the user must re-authenticate on next request

4. **Given** the API receives a request, **When** the request includes a valid JWT in Authorization header, **Then** the API validates the token with Keycloak **And** the request proceeds with user context **And** Keycloak connection timeout is < 5 seconds (NFR27)

5. **Given** the API receives a request without authentication, **When** the endpoint requires authentication (NFR12), **Then** the API responds with 401 Unauthorized **And** no data is leaked in the error response

---

## Tasks / Subtasks

- [ ] Task 1: Configure Keycloak environment variables and types (AC: #1, #4)
  - [ ] Create Keycloak configuration types in @bpa/types
  - [ ] Add KEYCLOAK_* environment variables to .env.example files
  - [ ] Create shared auth config package or module

- [ ] Task 2: Implement NextAuth.js with Keycloak provider (AC: #1, #2)
  - [ ] Install next-auth in apps/web
  - [ ] Configure KeycloakProvider with PKCE
  - [ ] Set up auth API routes in Next.js App Router
  - [ ] Implement session callback to include user data

- [ ] Task 3: Create session persistence in database (AC: #2, #3)
  - [ ] Add NextAuth Prisma adapter
  - [ ] Update schema.prisma with NextAuth models (Account, VerificationToken)
  - [ ] Run db:generate and db:push

- [ ] Task 4: Implement protected route middleware (AC: #1)
  - [ ] Create auth middleware for Next.js
  - [ ] Configure protected route patterns
  - [ ] Handle redirect to original destination after login

- [ ] Task 5: Implement NestJS JWT validation (AC: #4, #5)
  - [ ] Install @nestjs/passport and passport-jwt
  - [ ] Create JwtAuthGuard for protected endpoints
  - [ ] Configure Keycloak JWKS endpoint for token validation
  - [ ] Add timeout handling (< 5 seconds)

- [ ] Task 6: Session timeout handling (AC: #3)
  - [ ] Configure 30-minute session inactivity timeout
  - [ ] Implement session refresh logic
  - [ ] Handle expired session redirect

- [ ] Task 7: Test authentication flow (AC: all)
  - [ ] Verify login redirect to Keycloak
  - [ ] Verify callback and session creation
  - [ ] Verify protected route access
  - [ ] Verify API JWT validation
  - [ ] Verify 401 response for unauthenticated requests

---

## Dev Notes

### Critical Architecture Constraints

- **Package Manager**: Use pnpm ONLY - npm/yarn are NOT supported
- **OAuth Flow**: PKCE required (NFR10) - prevents CSRF attacks
- **Token Expiry**: JWT expires in 1 hour (NFR11)
- **Session Timeout**: 30 minutes inactivity (NFR9)
- **Keycloak Timeout**: Connection must be < 5 seconds (NFR27)

### Version Matrix

| Technology | Version | Critical Notes |
|------------|---------|----------------|
| next-auth | 5.x (Auth.js) | NextAuth v5 for Next.js 15+ App Router |
| @auth/prisma-adapter | Latest | Database session storage |
| @nestjs/passport | Latest | NestJS auth integration |
| passport-jwt | Latest | JWT strategy |
| jwks-rsa | Latest | Keycloak JWKS validation |

### Keycloak Configuration (Development)

```
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=bpa
KEYCLOAK_CLIENT_ID=bpa-web
KEYCLOAK_CLIENT_SECRET=<from-keycloak>
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-random-secret>
```

### Auth Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │     │  Next.js    │     │  Keycloak   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                    │
       │ Access /dashboard │                    │
       │──────────────────>│                    │
       │                   │                    │
       │ 302 → /auth/login │                    │
       │<──────────────────│                    │
       │                   │                    │
       │ Redirect to Keycloak (PKCE)           │
       │───────────────────────────────────────>│
       │                   │                    │
       │ Login Page        │                    │
       │<───────────────────────────────────────│
       │                   │                    │
       │ Submit credentials│                    │
       │───────────────────────────────────────>│
       │                   │                    │
       │ Redirect with code│                    │
       │<───────────────────────────────────────│
       │                   │                    │
       │ /auth/callback    │                    │
       │──────────────────>│                    │
       │                   │                    │
       │                   │ Exchange code      │
       │                   │───────────────────>│
       │                   │                    │
       │                   │ JWT tokens         │
       │                   │<───────────────────│
       │                   │                    │
       │ Session cookie    │                    │
       │<──────────────────│                    │
       │                   │                    │
       │ 302 → /dashboard  │                    │
       │<──────────────────│                    │
```

### Testing Requirements

- [ ] Login flow redirects to Keycloak
- [ ] Successful login creates database session
- [ ] Protected routes require authentication
- [ ] API validates JWT tokens
- [ ] Expired tokens return 401
- [ ] Session timeout after 30min inactivity
- [ ] Keycloak connection timeout < 5s

---

## References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 1.6]
- [Source: _bmad-output/architecture.md#Authentication]
- [NextAuth.js Documentation](https://authjs.dev/)
- [NestJS Passport](https://docs.nestjs.com/security/authentication)
- [Keycloak OIDC](https://www.keycloak.org/docs/latest/securing_apps/)

---

## Dev Agent Record

### Agent Model Used

_(To be filled after implementation)_

### Debug Log References

_(To be filled after implementation)_

### Completion Notes List

_(To be filled after implementation)_

### File List

_(To be filled after implementation)_
