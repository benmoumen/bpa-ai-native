---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
lastStep: 11
completedAt: '2025-12-25'
inputDocuments:
  - _bmad-output/project-planning-artifacts/research/technical-ai-native-bpa-frontend-mvp-2025-12-25.md
  - ../BPA-frontend/docs/BPA-FUNCTIONAL-SPECIFICATIONS.md
documentCounts:
  briefs: 0
  research: 1
  brainstorming: 0
  projectDocs: 1
workflowType: 'prd'
lastStep: 3
project_name: 'bpa-ai-native'
user_name: 'Moulaymehdi'
date: '2025-12-25'
---

# Product Requirements Document - bpa-ai-native

**Author:** Moulaymehdi
**Date:** 2025-12-25

## Executive Summary

**BPA AI-Native** is a strategic replacement of the UNCTAD Business Process Application platform — a complete **government service lifecycle management system** that enables developing countries to digitize permits, licenses, and registrations.

### Vision

Democratize government digitization by transforming how ministry officials configure **complete government services** — not just forms, but workflows, integrations, notifications, and multi-country deployments — through natural language interaction with AI.

### Problem Statement

The current BPA platform requires extensive technical configuration across multiple domains:

| Domain | Current Complexity |
|--------|-------------------|
| **Forms** | 5 form types with custom Formio components, behaviors, validations |
| **Workflows** | Multi-role approval chains with Camunda BPMN integration |
| **Integrations** | Bot configuration with Mule ESB field mappings |
| **Business Rules** | Determinants, formulas, conditional visibility |
| **Notifications** | Message templates with triggers and delays |
| **Publishing** | Multi-instance deployment to country servers |

Each domain requires specialized knowledge, creating bottlenecks where trained experts gate all progress.

### Solution

An AI-native platform where officials describe **complete government services** in natural language:

> "Create a business registration service. Applicants submit company details, upload incorporation documents, and pay a $50 fee. A clerk reviews, then a manager approves or rejects. On approval, generate a certificate and notify the applicant."

The AI translates this into:
- Form schemas for data collection and document upload
- Workflow configuration with roles and transitions
- Cost formulas and payment integration
- Message templates for notifications
- Certificate generation setup

### What Makes This Special

**Full-stack AI assistance:** Not just forms — workflows, integrations, notifications, and publishing are all AI-assisted.

**Same destination, smoother journey:** Every BPA capability preserved, accessed through conversation instead of configuration panels.

**Real-time stakeholder collaboration:** Officials demonstrate complete services live in meetings, not just forms.

**Reduced risk, increased velocity:** AI-validated configuration with preview across all service components.

### Functional Parity Commitment

This is a **replacement project** requiring systematic reverse engineering:

| BPA Module | Parity Target |
|------------|---------------|
| Services & Registrations | Full feature equivalence |
| Forms (5 types) | AI-generated, Formio-compatible schemas |
| Roles & Workflows | Simplified workflow builder |
| Bots & Integrations | Integration configuration UI |
| Classifications | Catalog management |
| Messages & Notifications | Template builder |
| Formulas & Costs | Formula builder |
| Multi-instance Publishing | Publication management |
| Translations | i18n framework |
| Real-time Collaboration | WebSocket support |

**Reference Systems:**
- `../BPA-frontend` — Feature parity target (reverse engineering source)
- `../BPA-backend` — API contracts and data models

### Competitive Positioning

| Alternative | Why Not Sufficient |
|-------------|-------------------|
| **Current BPA** | Functional but creates bottlenecks — 2/10 learning curve |
| **Generic Form Builders** | Easy but incomplete — cannot handle workflows, bots, multi-country |
| **Low-Code Platforms** | Flexible but still requires technical users, expensive licensing |
| **Custom Development** | Not scalable — each country would rebuild from scratch |

**AI-Native BPA uniquely combines:**
- Ease of generic tools (natural language, instant results)
- Completeness of current BPA (full government service lifecycle)
- Scalability across UNCTAD's global deployment footprint

## Project Classification

**Technical Type:** Web Application (SPA) + SaaS B2B Platform
**Domain:** GovTech (Government Services & Digitization)
**Complexity:** High (regulatory context, multi-country deployment, SSO integration)
**Project Context:** Greenfield architecture, functional parity with legacy system

**Target Users:** Business analysts and government officials in developing countries who configure government services and permits.

**Technical Foundation:**

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Next.js 15 |
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL + Prisma |
| LLM Primary | Groq (Llama-3 70B) - 310+ tokens/sec |
| LLM Fallback | Claude API via LiteLLM |
| Form Renderer | JSON Forms |
| Auth | Keycloak SSO (OAuth2 + PKCE) |

## Success Criteria

### User Success

| Metric | Current State | Target | Measurement |
|--------|---------------|--------|-------------|
| **Service configuration time** | Weeks | ≤ 1 day | Time from blank to publishable service |
| **Self-sufficiency rate** | ~10% | 80% | % of changes made without IT support |
| **Training to proficiency** | Weeks | ≤ 1 day | Time for new official to configure first service |
| **Live stakeholder demos** | Not possible | Standard practice | Officials demo changes in real-time meetings |
| **Configuration errors** | Frequent | Rare | Errors caught by AI validation before publish |

**The moment of success:** An official describes a new permit service in a morning meeting, configures it by lunch, and publishes it by end of day — without filing a single IT ticket.

### Business Success

| Metric | Target | Timeline |
|--------|--------|----------|
| **Services launched** | ~10 per country per quarter | Post-launch steady state |
| **Deployment strategy** | New country deployments | No migration of existing |
| **Expert bottleneck** | Reduce dependency from 3 global experts | Officials self-serve 80% |
| **Time to new country** | Faster onboarding | Baseline TBD |

**Strategic positioning:** AI-Native BPA runs parallel to existing BPA — new countries get the modern platform, existing countries continue unchanged until natural upgrade cycles.

### Technical Success

| Metric | Target | Notes |
|--------|--------|-------|
| **AI generation response** | < 10 seconds | For form/workflow generation |
| **AI acceptance rate** | > 70% | Suggestions accepted without major edits |
| **System uptime** | 99.5% | Standard SaaS reliability |
| **LLM cost per service** | < $1.00 | Full service config, not just forms |
| **Functional parity** | Phased | MVP → Phase 2 → Phase 3 |

### Measurable Outcomes

**6-month milestone:**
- First country deployed on AI-Native BPA
- 5+ services configured by officials (not developers)
- 80% self-serve rate validated

**12-month milestone:**
- 3+ countries on AI-Native BPA
- 30+ services launched across deployments
- Phase 2 features (Bots, Notifications) in production

## Product Scope

### MVP - Minimum Viable Product

| Module | Capability |
|--------|------------|
| **Services & Registrations** | Full CRUD, lifecycle management |
| **Forms (Applicant + Guide)** | AI-generated, JSON Forms rendering |
| **Roles & Workflows** | Simple approval chains (linear flows) |
| **Variables/Determinants** | AI-inferred business rules |
| **Preview & Publish** | Local instance deployment |
| **Authentication** | Keycloak SSO integration |

**MVP exit criteria:** One complete government service (e.g., Business Registration) configured end-to-end by a non-technical official in ≤ 1 day.

### Phase 2 - Extended Capabilities

| Module | Capability |
|--------|------------|
| **Forms (Document, Payment, Send File)** | Additional form types |
| **Bots & Integrations** | External system connections (Mule ESB compatible) |
| **Messages & Notifications** | Email templates with triggers |
| **Formulas & Costs** | Fee calculations, cost formulas |
| **Classifications/Catalogs** | Taxonomy management |

### Phase 3 - Scale & Advanced

| Module | Capability |
|--------|------------|
| **Multi-instance Publishing** | Deploy to multiple country servers |
| **Real-time Collaboration** | WebSocket, concurrent editing |
| **Translations** | Multi-language i18n support |
| **Advanced Workflows** | Complex BPMN patterns, parallel flows |

## User Journeys

### Primary User: Service Designer

**Profile:** Frank, UNCTAD consultant who helps governments design their digital services. Highly analytical, spends extensive time in BPA UI. Familiar with the current platform's opacity around internal configuration and frequent bugs.

**Core Need:** Configure complete government services through an intuitive UI that maps to underlying YAML schemas, without seeing or editing raw configuration files.

---

### Journey 1: Frank Creates a New Business Registration Service

**Context:** Frank arrives Monday morning to configure a new Business Registration service for Rwanda.

**Step 1: Service Initialization**
- Frank opens AI-Native BPA dashboard
- Clicks "New Service" → sees **Service Template Gallery** (Business Registration, Import Permit, Professional License...)
- Selects "Business Registration" template as starting point
- **Completeness Dashboard** appears: Forms ⚪ Workflow ⚪ Fees ⚪ Messages ⚪ Preview ⚪

**Step 2: AI-Assisted Configuration**
- Frank opens chat panel: "This registration needs company details, incorporation documents, and a $50 fee. Clerk reviews, manager approves, then generate a certificate."
- AI responds with **structured proposal** (not silent generation):
  - "I'll create an Applicant Form with: Company Name, Registration Number, Address, Upload Document (incorporation)"
  - "I'll set up a 2-step workflow: Clerk Review → Manager Approval"
  - "I'll add a fixed fee of $50 USD"
  - "I'll configure a certificate template"
  - **[Accept All] [Review Each] [Modify]**
- Frank clicks "Review Each" — sees each component with edit capability

**Step 3: Verification Loop**
- Each component shows **AI-generated ↔ Your description** comparison
- Frank notices AI missed "Trade License number" field → types "Add trade license number field"
- AI updates and shows **change diff**
- **Completeness Dashboard** updates: Forms ✅ Workflow ✅ Fees ✅ Messages ⚪ Preview ⚪

**Step 4: Gap Detection**
- AI proactively asks: "You mentioned certificate but no notification. Should I add email notification on approval?"
- Frank confirms → Messages ✅
- Dashboard shows all green except Preview

**Step 5: Final Verification**
- Frank clicks Preview → sees **full applicant journey simulation**
- Tests form fill → workflow simulation → certificate preview
- **Publish Readiness Gate** appears: all checks pass2.1
- Frank publishes → service goes live
- **Time: 45 minutes** (vs weeks in old BPA)

---

### Journey 2: Frank Modifies an Existing Import License Service

**Context:** Kenya's Import License service needs a new document requirement and fee adjustment mid-quarter.

**Step 1: Change Request**
- Frank opens existing Import License service
- Sees current state: 3 forms, 4-step workflow, 2 bots, 5 message templates
- Clicks "Request Change" → chat opens with service context pre-loaded

**Step 2: Impact Analysis**
- Frank types: "Add phytosanitary certificate upload and increase fee to $75"
- AI shows **Change Impact Preview**:
  - ⚠️ Form: Adding field "Phytosanitary Certificate" to Document Form
  - ⚠️ Fee: Changing $50 → $75 (affects: Fee Formula, Payment Step)
  - ℹ️ No workflow changes needed
  - ℹ️ No bot changes needed
  - **[Proceed] [Cancel] [Modify Scope]**

**Step 3: Safe Modification**
- Frank proceeds → AI applies changes to **draft version**
- Published service continues running unchanged
- Frank sees side-by-side: Published vs Draft comparison

**Step 4: Testing**
- Frank tests draft in preview mode
- Notices fee formula wasn't updated in certificate template → AI catches it: "Certificate still shows $50. Update to $75?"
- Frank confirms

**Step 5: Controlled Publication**
- **Publish Readiness Gate**: All checks pass
- Frank sees: "15 in-progress applications will continue with old configuration. New applications will use updated service."
- Frank publishes draft → becomes active
- Old config preserved in version history

---

### Journey 3: Frank Previews and Publishes with Confidence

**Context:** Frank completed a complex Food Safety Permit service and needs to present to the Tanzania Minister of Health.

**Step 1: Pre-Demo Verification**
- Frank opens service, sees **Completeness Dashboard**: All ✅
- Clicks "Full Preview Mode" → enters applicant simulation
- Walks through entire journey: application → review → approval → certificate

**Step 2: Demo Mode**
- Frank shares screen in Ministry meeting
- "Demo Mode" banner indicates this is preview, not production
- Creates test application → shows each workflow step
- Minister asks: "What if the inspector rejects?"
- Frank switches to "Rejection Path" in workflow simulator → shows rejection notification

**Step 3: Live Adjustments**
- Minister: "Can we add a re-application option after rejection?"
- Frank opens chat: "Add option to re-apply after rejection"
- AI shows proposed workflow change **live**
- Frank accepts → preview updates immediately
- Minister sees the change in real-time

**Step 4: Approval & Publish**
- Minister approves the design
- Frank clicks "Publish" → **Publish Readiness Gate** appears:
  - ✅ All forms validated
  - ✅ Workflow has no dead ends
  - ✅ All fees configured
  - ✅ All notifications have templates
  - ✅ Certificate template configured
  - ⚠️ Bot integration pending (optional for MVP)
- Frank acknowledges warning → proceeds
- Service published to Tanzania instance

**Step 5: Post-Publish Monitoring**
- Dashboard shows: "Food Safety Permit - Live since 10:45 AM"
- First application received 14 minutes later
- Frank sees application flow through workflow in real-time activity feed

---

### Key UI Components (from Journey Analysis)

| Component | Purpose | Journey Source |
|-----------|---------|----------------|
| **Service Template Gallery** | Quick-start from common patterns | Journey 1 |
| **Completeness Dashboard** | Visual progress of all service components | All Journeys |
| **AI Structured Proposal** | Transparent AI suggestions with review options | Journey 1 |
| **Change Impact Preview** | Show what modifications will affect | Journey 2 |
| **Draft vs Published** | Safe modification without affecting live services | Journey 2 |
| **Publish Readiness Gate** | Blocking checklist before publication | All Journeys |
| **Demo Mode** | Safe presentation environment | Journey 3 |
| **Version History** | Rollback and audit capability | Journey 2 |

## Domain-Specific Requirements

### GovTech Compliance & Regulatory Overview

AI-Native BPA operates in a unique GovTech context: a **UN agency platform deployed to multiple developing countries**. Unlike US federal software (FedRAMP, Section 508), this platform must navigate:

- Multiple national regulatory frameworks simultaneously
- UN procurement and security requirements
- Varying infrastructure conditions (connectivity, hardware)
- Diverse identity provider ecosystems per country

### Key Domain Concerns

| Concern | Implementation Impact |
|---------|----------------------|
| **Data Sovereignty** | Each country deployment must store data within national boundaries; no cross-border data flow without explicit consent |
| **Multi-tenancy Isolation** | Complete tenant isolation between country instances; no data leakage between deployments |
| **Audit Trail** | All configuration changes logged for government accountability; immutable audit logs |
| **Authentication Federation** | Support for country-specific identity providers (eID, national SSO systems) via Keycloak |
| **Accessibility** | WCAG 2.1 AA compliance; support for right-to-left languages (Arabic, Hebrew) |
| **Offline Resilience** | Graceful degradation when connectivity is limited; queue operations for sync |

### Compliance Requirements

**UN/UNCTAD Specific:**
- Adherence to UN ICT standards
- Procurement through established UNCTAD channels
- Security review per UN OIOS requirements
- Hosting on approved infrastructure (UN or country data centers)

**Per-Country Deployment:**
- Compliance with national data protection laws (varies)
- Integration with national payment systems where required
- Support for national languages and date/currency formats
- Compatibility with country government IT policies

### Industry Standards & Best Practices

| Standard | Application |
|----------|-------------|
| **WCAG 2.1 AA** | Accessibility for all users |
| **OAuth 2.0 + PKCE** | Secure authentication flows |
| **HTTPS Everywhere** | All communications encrypted |
| **CSP Headers** | XSS protection |
| **OWASP Top 10** | Security baseline |

### Required Expertise & Validation

**Expertise Needed:**
- Keycloak/OAuth specialist for identity federation
- i18n/l10n expertise for multi-language support
- Government IT integration experience
- Performance optimization for low-bandwidth environments

**Validation Approach:**
- Security audit before each country deployment
- Accessibility audit using automated + manual testing
- Performance testing under constrained network conditions
- User acceptance testing with actual Service Designers

### Implementation Considerations

**Architecture Implications:**
- Region-specific deployments (not single global instance)
- Database per country with migration tooling
- CDN/edge caching for static assets
- Background job processing for AI operations (queue-based)

**Phased Compliance:**

| Phase | Compliance Focus |
|-------|-----------------|
| MVP | Core security (auth, XSS, injection), basic accessibility |
| Phase 2 | Full WCAG 2.1 AA, audit trail, offline support |
| Phase 3 | Multi-region deployment automation, advanced federation |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. AI-Assisted Full-Stack Service Configuration**

Unlike traditional form builders (Formio, Typeform, JotForm) that focus on form creation, AI-Native BPA uses LLMs to generate **complete government services**:

| Layer | Traditional | AI-Native BPA Innovation |
|-------|-------------|--------------------------|
| Forms | Drag-and-drop builder | Natural language → JSON Schema |
| Workflows | BPMN diagram editor | "Clerk reviews, manager approves" → XState config |
| Integrations | Technical API mapping | "Connect to tax system" → Bot configuration |
| Fees | Formula editor | "50 dollars" → Cost formula |
| Notifications | Template builder | "Notify on approval" → Message templates |

**What makes it novel:** Single natural language input generates coordinated configuration across 5+ subsystems. No existing government digitization platform offers this.

**2. Schema-First with UI-First UX**

The architecture separates concerns:
- **Storage layer:** YAML schemas in Git (version control, audit trail, portability)
- **Interaction layer:** Visual UI that reads/writes YAML (user never sees raw schema)
- **AI layer:** Generates YAML from natural language, updates UI

**What makes it novel:** Combines developer-friendly infrastructure (Git, YAML) with non-developer UX (visual configuration, AI chat). Users get the benefits of schema-first without the complexity.

**3. Real-Time Stakeholder Configuration**

Traditional government IT projects:
1. Requirements meeting → 2. Spec document → 3. Development → 4. Review → 5. Iteration

AI-Native BPA collapses this:
1. Stakeholder meeting → Configure live → Deploy same day

**What makes it novel:** Government officials can demonstrate and modify services in real-time during ministerial meetings. Configuration becomes a collaborative, live activity rather than a back-office IT task.

### Market Context & Competitive Landscape

| Alternative | Why BPA AI-Native is Different |
|-------------|-------------------------------|
| **Form builders** (Formio, Typeform) | Only handle forms, not workflows/integrations |
| **Low-code platforms** (OutSystems, Mendix) | Still require technical users, expensive licensing |
| **Government platforms** (ServiceNow, Salesforce Gov) | Configuration complexity, not AI-native |
| **AI form tools** (emerging) | Focus on individual forms, not service lifecycle |

**Blue ocean position:** AI-Native BPA is the first platform combining:
- Complete government service lifecycle (not just forms)
- Natural language configuration (not drag-and-drop)
- Multi-country deployment capability (not single-tenant)
- Schema-first architecture (not proprietary lock-in)

### Validation Approach

| Innovation | Validation Method | Success Indicator |
|------------|------------------|-------------------|
| **Natural language → service** | Pilot with 3 real services | >70% of AI suggestions accepted |
| **Full-stack generation** | End-to-end service test | Service functional without manual schema editing |
| **Real-time stakeholder demos** | Ministry meeting simulation | Official completes modification during 30-min session |
| **Schema-first portability** | Export/import between instances | Service YAML works across country deployments |

### Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| **AI generates incorrect schemas** | Validation layer before save; required human review for critical fields |
| **Natural language ambiguity** | AI asks clarifying questions; provides structured proposals for confirmation |
| **Over-reliance on AI** | Hybrid mode: AI-assisted + manual editing both available |
| **LLM costs escalate** | Groq as primary (cost-effective), Claude as fallback; budget per-service limits |
| **Innovation ahead of user readiness** | Phased rollout; extensive Service Designer training; familiar UI patterns |

## SaaS B2B Specific Requirements

### Project-Type Overview

AI-Native BPA is a **multi-tenant B2B platform** deployed by UNCTAD to developing countries. Unlike commercial SaaS products with self-service signup and subscription billing, this platform operates as:

- **Deployment model:** One instance per country (not shared multi-tenant)
- **User model:** Government officials and UNCTAD staff (not public signup)
- **Revenue model:** UN-funded, not subscription-based
- **Customization:** Per-country configuration (languages, integrations, branding)

### Technical Architecture Considerations

**Tenant Model:**

| Aspect | Design Decision |
|--------|-----------------|
| **Isolation** | Complete database isolation per country instance |
| **Deployment** | Separate deployments (not schema-based multi-tenancy) |
| **Data residency** | Each country's data stays within national boundaries |
| **Cross-tenant** | No data sharing between country instances |
| **Service templates** | Can be shared/exported between instances |

**RBAC Matrix:**

| Role | Description | Permissions |
|------|-------------|-------------|
| **Service Designer** | UNCTAD consultant configuring services | Full service CRUD, preview, publish to staging |
| **Country Admin** | Government IT administrator | User management, publish to production, instance settings |
| **Operator** | Government clerk processing applications | View services, process workflows (in runtime, not BPA) |
| **UNCTAD Support** | Global UNCTAD technical team | Cross-instance access, template management, diagnostics |

**Authentication Flow:**

```
User → Keycloak (UNCTAD realm)
         ↓
    Country Identity Provider (optional federation)
         ↓
    JWT with roles + country_id claim
         ↓
    AI-Native BPA (validates JWT, enforces RBAC)
```

### Integration Architecture

| Integration | Protocol | Purpose | Phase |
|-------------|----------|---------|-------|
| **Keycloak** | OAuth2 + PKCE | Authentication/SSO | MVP |
| **Country IdP** | SAML/OIDC federation | National identity integration | Phase 2 |
| **Mule ESB** | REST/SOAP | Bot integrations (tax, registry) | Phase 2 |
| **Payment gateways** | Country-specific | Fee collection | Phase 2 |
| **Email/SMS** | SMTP/Twilio | Notifications | MVP |
| **Git** | YAML push/pull | Service schema versioning | MVP |

### Subscription & Licensing

**Not applicable** — AI-Native BPA is a UN-funded platform:

- No per-seat licensing
- No subscription tiers
- No metered billing
- Funded through UNCTAD technical assistance programs

**Cost considerations:**
- LLM API costs (Groq/Claude) budgeted per country
- Hosting costs per instance
- Support costs covered by UNCTAD

### B2B Implementation Patterns

**Enterprise Patterns Required:**

| Pattern | Implementation |
|---------|----------------|
| **Audit logging** | All configuration changes logged with user, timestamp, diff |
| **Role-based access** | Enforced at API level, not just UI |
| **Session management** | Keycloak token refresh, idle timeout |
| **Rate limiting** | Per-user API limits to prevent abuse |
| **Error handling** | User-friendly messages, detailed logs for support |

**B2B-Specific UI Patterns:**

| Pattern | Application |
|---------|-------------|
| **Dashboard-first** | Landing page shows services, recent activity, alerts |
| **Bulk operations** | Multi-select for service management |
| **Search & filter** | Fast filtering across services, forms, workflows |
| **Export/import** | Service templates as YAML files |
| **Activity feed** | Recent changes across all configured services |

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** **Platform MVP** — Build the foundation for AI-native government service configuration with core functionality that proves the concept.

**Why Platform MVP:**
- This is a replacement for an existing system with known requirements
- The innovation is in the UX layer (AI + visual), not the domain
- Foundation must support full feature parity over time
- Early adopters (Service Designers) need real utility, not experiments

**Resource Requirements:**

| Role | Count | Focus |
|------|-------|-------|
| Full-stack Developer | 2 | Next.js + NestJS |
| Frontend Developer | 1 | React, JSON Forms, AI Chat UI |
| AI/LLM Engineer | 1 | Prompt engineering, schema generation |
| DevOps | 0.5 | Keycloak, deployment |
| Product/UX | 1 | Service Designer workflows |

**Timeline Estimate:** 3-4 months to MVP

### MVP Feature Set (Phase 1)

**Core User Journey Supported:** Journey 1 — Frank Creates a New Business Registration Service

**Must-Have Capabilities:**

| Module | MVP Scope | Justification |
|--------|-----------|---------------|
| **Services** | Full CRUD, lifecycle states | Core entity management |
| **Applicant Form** | AI-generated JSON Schema, JSON Forms render | Primary form type for government services |
| **Guide Form** | AI-generated, linked to Applicant Form | Required for operator workflow |
| **Workflow** | Linear approval chains (2-5 steps) | Supports 80% of government services |
| **Determinants** | AI-inferred from form fields | Business rules for conditional logic |
| **Preview** | Full applicant journey simulation | Validation before publish |
| **Publish** | Single-instance deployment | Get services to production |
| **Auth** | Keycloak SSO, Service Designer role | Secure access |
| **AI Chat** | Natural language → service config | Core differentiator |
| **Completeness Dashboard** | Visual status of service components | UX essential from journeys |

**Explicitly Excluded from MVP:**

| Feature | Reason for Deferral |
|---------|---------------------|
| Document Form | Can use Applicant Form with upload fields |
| Payment Form | Fee collection via manual process initially |
| Bots | External integrations are Phase 2 |
| Notifications | Manual email initially |
| Multi-instance | Single country first |
| Real-time collab | Not critical for solo Service Designer |

### Post-MVP Roadmap

**Phase 2 — Extended Capabilities (Months 5-8):**

| Module | Scope | Value Add |
|--------|-------|-----------|
| **Document Form** | Dedicated upload/review form type | Better document handling UX |
| **Payment Form** | Fee collection, payment gateway integration | Revenue-generating services |
| **Send File Form** | Output document delivery | Certificate delivery automation |
| **Bots** | Mule ESB compatible integrations | External system connections |
| **Messages** | Email/SMS templates with triggers | Automated notifications |
| **Formulas** | Fee calculations, cost formulas | Dynamic pricing |
| **Classifications** | Catalog/taxonomy management | Reusable reference data |

**Phase 3 — Scale & Advanced (Months 9-12):**

| Module | Scope | Value Add |
|--------|-------|-----------|
| **Multi-instance** | Deploy to multiple country servers | UNCTAD global rollout |
| **Real-time Collaboration** | WebSocket, concurrent editing | Team configuration |
| **Translations** | Multi-language i18n | Country-specific languages |
| **Advanced Workflows** | Parallel flows, complex BPMN | Sophisticated approval chains |
| **Version History** | Full Git-based versioning UI | Audit and rollback |
| **Change Impact Preview** | Cross-component impact analysis | Safe modifications |

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI generates invalid schemas | Medium | High | Validation layer + required review |
| LLM latency affects UX | Medium | Medium | Groq for speed, streaming responses |
| JSON Forms can't render all field types | Low | High | Custom renderers, fallback to simple types |
| Keycloak integration complexity | Medium | High | Prototype auth flow first |

**Market Risks:**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Service Designers prefer old BPA | Medium | High | Extensive user testing, hybrid mode |
| AI suggestions rejected too often | Medium | High | Fine-tune prompts, learn from rejections |
| Countries won't adopt new platform | Low | High | Pilot with receptive country first |

**Resource Risks:**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Team smaller than planned | Medium | Medium | Prioritize ruthlessly, cut to core |
| LLM costs exceed budget | Low | Medium | Rate limiting, caching, cost monitoring |
| Timeline extends | High | Medium | Ship MVP with smaller scope if needed |

**Minimum Viable Team:** 2 full-stack developers + 1 AI engineer could ship core MVP in 4-5 months

## Functional Requirements

### Service Management

- **FR1:** Service Designer can create a new government service with basic metadata (name, description, category)
- **FR2:** Service Designer can view a list of all services with search and filter capabilities
- **FR3:** Service Designer can edit service metadata and configuration at any time before publication
- **FR4:** Service Designer can delete a draft service that has not been published
- **FR5:** Service Designer can duplicate an existing service as a starting point for a new one
- **FR6:** Service Designer can view a service's current lifecycle state (draft, published, archived)
- **FR7:** Service Designer can transition a service between lifecycle states with appropriate validations
- **FR8:** Service Designer can select a service template from a gallery when creating new services

### Form Configuration

- **FR9:** Service Designer can create an Applicant Form for data collection from citizens
- **FR10:** Service Designer can create a Guide Form for operator workflow steps
- **FR11:** Service Designer can add form fields of various types (text, number, date, select, upload, etc.)
- **FR12:** Service Designer can configure field properties (label, placeholder, required, validation rules)
- **FR13:** Service Designer can organize fields into sections and groups
- **FR14:** Service Designer can configure conditional visibility rules for fields and sections
- **FR15:** Service Designer can preview how a form renders to applicants
- **FR16:** Service Designer can link form fields to determinants for business rule evaluation
- **FR17:** System generates JSON Schema representation of form configuration

### Workflow Configuration

- **FR18:** Service Designer can define workflow steps (roles) for a service
- **FR19:** Service Designer can configure transitions between workflow steps
- **FR20:** Service Designer can specify which actions are available at each step (approve, reject, request info, etc.)
- **FR21:** Service Designer can assign required form(s) to each workflow step
- **FR22:** Service Designer can configure linear approval chains with 2-5 steps
- **FR23:** Service Designer can preview the complete workflow as a visual diagram
- **FR24:** System validates workflow configuration for completeness (no dead ends, all steps reachable)

### AI-Powered Assistance

- **FR25:** Service Designer can describe a service in natural language via chat interface
- **FR26:** AI can generate complete service configuration from natural language description
- **FR27:** AI presents structured proposals with accept/review/modify options
- **FR28:** Service Designer can iteratively refine AI suggestions through conversation
- **FR29:** AI can suggest form fields based on service type and description
- **FR30:** AI can suggest workflow structure based on service requirements
- **FR31:** AI can detect configuration gaps and proactively suggest additions
- **FR32:** AI can infer determinants from form field relationships
- **FR33:** System displays comparison between AI-generated and user-described configurations

### Determinants & Business Rules

- **FR34:** Service Designer can define determinants (variables) derived from form fields
- **FR35:** Service Designer can configure formulas that calculate determinant values
- **FR36:** Service Designer can use determinants in conditional visibility rules
- **FR37:** Service Designer can use determinants in workflow transition conditions
- **FR38:** System validates determinant references for consistency

### Preview & Publishing

- **FR39:** Service Designer can preview the complete applicant journey (forms → workflow → outcome)
- **FR40:** Service Designer can simulate form submission with test data
- **FR41:** Service Designer can simulate workflow progression through all steps
- **FR42:** System displays a Completeness Dashboard showing status of all service components
- **FR43:** System performs validation checks before allowing publication
- **FR44:** Service Designer can publish a service to make it available for applicants
- **FR45:** Service Designer can view a Publish Readiness Gate with pass/fail checklist
- **FR46:** Published services remain unchanged while draft modifications are in progress

### User & Access Management

- **FR47:** User can authenticate via Keycloak SSO
- **FR48:** System enforces role-based access control (Service Designer, Country Admin, UNCTAD Support)
- **FR49:** Service Designer can only access services within their authorized scope
- **FR50:** Country Admin can manage users within their country instance
- **FR51:** UNCTAD Support can access services across country instances for diagnostics

### System Administration

- **FR52:** System logs all configuration changes with user, timestamp, and change details
- **FR53:** Service Designer can view activity feed of recent changes across services
- **FR54:** Service Designer can export service configuration as YAML file
- **FR55:** Service Designer can import service configuration from YAML file
- **FR56:** System validates imported configurations for schema compliance
- **FR57:** Country Admin can configure instance-level settings (branding, languages)

### Demo & Collaboration

- **FR58:** Service Designer can enter Demo Mode for safe presentation of services
- **FR59:** Service Designer can make live configuration changes during stakeholder meetings
- **FR60:** Changes made in preview do not affect published services until explicitly saved

### Error Handling & Recovery

- **FR61:** Service Designer can view detailed error messages when configuration validation fails
- **FR62:** System auto-saves draft configuration periodically to prevent data loss

### AI Interaction

- **FR63:** System displays AI response streaming in real-time during generation
- **FR64:** Service Designer can cancel an in-progress AI generation

### Accessibility

- **FR65:** All configuration functions are accessible via keyboard navigation

### Change Management

- **FR66:** Service Designer can view impact analysis before saving changes to published services

## Non-Functional Requirements

### Performance

| NFR | Metric | Target | Context |
|-----|--------|--------|---------|
| **NFR1** | AI generation response time | < 10 seconds | From initial prompt to complete service skeleton |
| **NFR2** | AI streaming first token | < 1 second | User sees activity immediately |
| **NFR3** | Form preview render time | < 2 seconds | After configuration change |
| **NFR4** | Service list load time | < 1 second | For up to 100 services |
| **NFR5** | Auto-save interval | Every 30 seconds | While user is actively editing |
| **NFR6** | Publish operation | < 30 seconds | From click to confirmation |

### Security

| NFR | Requirement | Rationale |
|-----|-------------|-----------|
| **NFR7** | All data encrypted in transit (TLS 1.3) | Government data protection |
| **NFR8** | All data encrypted at rest (AES-256) | Data sovereignty compliance |
| **NFR9** | Session timeout after 30 minutes of inactivity | Prevent unauthorized access |
| **NFR10** | OAuth 2.0 + PKCE for authentication | Modern secure auth flow |
| **NFR11** | JWT tokens expire after 1 hour | Limit token exposure window |
| **NFR12** | All API endpoints require authentication | No unauthenticated access |
| **NFR13** | Audit log retention for 2 years | Government accountability |
| **NFR14** | OWASP Top 10 compliance | Security baseline |
| **NFR15** | No cross-tenant data access | Country instance isolation |

### Reliability

| NFR | Metric | Target | Context |
|-----|--------|--------|---------|
| **NFR16** | System uptime | 99.5% | Standard SaaS reliability |
| **NFR17** | Data backup frequency | Daily | Full database backup |
| **NFR18** | Recovery Point Objective (RPO) | < 24 hours | Maximum data loss window |
| **NFR19** | Recovery Time Objective (RTO) | < 4 hours | Time to restore service |
| **NFR20** | Auto-save success rate | 99.9% | Draft configurations preserved |

### Accessibility

| NFR | Requirement | Standard |
|-----|-------------|----------|
| **NFR21** | WCAG 2.1 Level AA compliance | Full compliance |
| **NFR22** | Keyboard navigation for all functions | No mouse-only features |
| **NFR23** | Color contrast ratio minimum 4.5:1 | Text readability |
| **NFR24** | Screen reader compatible | ARIA labels on all interactive elements |
| **NFR25** | No content relying solely on color | Use icons + text |
| **NFR26** | Focus indicators visible | Clear keyboard focus state |

### Integration

| NFR | Requirement | Context |
|-----|-------------|---------|
| **NFR27** | Keycloak connection timeout | < 5 seconds with graceful failure |
| **NFR28** | LLM API fallback | Auto-switch Groq → Claude on failure |
| **NFR29** | LLM API timeout | 30 seconds max, then graceful error |
| **NFR30** | Git sync for YAML schemas | Atomic commits, conflict detection |
| **NFR31** | Email notification delivery | < 5 minutes after trigger |

### Cost Efficiency

| NFR | Metric | Target | Context |
|-----|--------|--------|---------|
| **NFR32** | LLM cost per service configuration | < $1.00 | Full service from scratch |
| **NFR33** | LLM cost per refinement | < $0.10 | Iterative AI suggestions |
| **NFR34** | Monthly hosting cost per country | Budget TBD | Sustainable deployment |

### Browser & Device Support

| NFR | Requirement | Context |
|-----|-------------|---------|
| **NFR35** | Chrome, Firefox, Safari, Edge (last 2 versions) | Modern browser support |
| **NFR36** | Minimum screen width 1024px | Desktop-first for configuration work |
| **NFR37** | Stable on 5 Mbps connection | Developing country infrastructure |
