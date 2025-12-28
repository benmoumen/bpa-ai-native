# Story 1.4: Developer Environment Setup

Status: done

---

## Story

As a **Developer**,
I want Docker Compose configuration for local infrastructure services,
So that I can run the complete development environment with a single command.

---

## Acceptance Criteria

1. **Given** a developer clones the repository, **When** the developer runs `docker compose up -d`, **Then** PostgreSQL, Redis, and Keycloak services start **And** are accessible on their default ports

2. **Given** Docker Compose services are running, **When** the developer runs `pnpm dev`, **Then** the web and API apps connect to the local services **And** authentication flow works end-to-end

3. **Given** the root directory, **When** the developer inspects `.env.example`, **Then** all required environment variables are documented **And** default values for local development are provided

4. **Given** the apps need containerization, **When** the developer builds production images, **Then** Dockerfiles in apps/web and apps/api produce optimized images **And** multi-stage builds minimize image size

5. **Given** a new developer joins the project, **When** the developer reads the README, **Then** clear setup instructions guide them through the complete environment setup **And** troubleshooting tips are provided for common issues

---

## Tasks / Subtasks

- [x] Task 1: Create Docker Compose for infrastructure services (AC: #1)
  - [x] Create docker-compose.yml with PostgreSQL, Redis, Keycloak
  - [x] Configure persistent volumes for data
  - [x] Set up healthchecks for service readiness
  - [x] Create Keycloak realm import file

- [x] Task 2: Create root environment configuration (AC: #3)
  - [x] Create .env.example at project root
  - [x] Document all environment variables with comments
  - [x] Provide default values for local development

- [x] Task 3: Create production Dockerfiles (AC: #4)
  - [x] Create Dockerfile for apps/web with multi-stage build
  - [x] Create Dockerfile for apps/api with multi-stage build
  - [x] Optimize for minimal image size

- [x] Task 4: Update README with setup instructions (AC: #5)
  - [x] Add prerequisites section (Docker, Node.js, pnpm)
  - [x] Add step-by-step development setup
  - [x] Add troubleshooting section
  - [x] Add available commands reference

- [x] Task 5: Build verification (AC: all)
  - [x] Build passes with no errors

---

## Dev Notes

### Critical Architecture Constraints

- **Package Manager**: Use pnpm ONLY - npm/yarn are NOT supported
- **Node.js**: Version 20.9+ required
- **Docker**: Required for local infrastructure services
- **Per-country deployment**: Each country gets isolated Docker stack

### Version Matrix

| Technology | Version | Critical Notes |
|------------|---------|----------------|
| Docker | Latest | Docker Compose V2 |
| PostgreSQL | 16 | Latest stable |
| Redis | 7.x | Alpine image for size |
| Keycloak | 26.x | Latest stable |
| Node.js | 20.9+ | LTS version |

### Service Ports (Development)

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| Keycloak | 8080 | Authentication |
| Web App | 3000 | Frontend |
| API | 4000 | Backend |

### Keycloak Bootstrap

Keycloak requires initial realm setup. The docker-compose includes:
- bpa realm import file
- Default admin credentials for development
- Pre-configured client for bpa-web

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-28 | Story created | Development |
