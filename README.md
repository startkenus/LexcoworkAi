# LexCowork AI - MVP

A Cowork-style, jurisdiction-aware legal productivity platform for India and the USA, powered by agentic workers, RAG-grounded intelligence, and strict legal guardrails.

## Overview

LexCowork AI is a legal-only productivity platform that enables users to perform structured legal tasks such as contract review, policy drafting, compliance checklists, and legal research using AI-powered workers under strict governance controls.

### Key Features

- **Jurisdiction-Aware**: Supports US (Federal + TX, CA, NY) and India (Central Laws)
- **Agentic Workers**: Orchestrator and Contract Review workers with tool-calling capabilities
- **RAG-Grounded**: pgvector-based knowledge base with jurisdiction-scoped retrieval
- **Strict Guardrails**: 3-layer gate system (Policy, Tool, Output) to ensure legal compliance
- **Super Admin Governance**: Full platform control with worker management and audit logs
- **Cowork-Style UI**: Clean task canvas with left sidebar (task list), main area, and right sidebar (details/sources)

## Tech Stack

- **Frontend**: Next.js 13 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Postgres, RLS, Edge Functions, Realtime)
- **Database**: PostgreSQL with pgvector for embeddings
- **AI**: Anthropic Claude API (for worker orchestration and tool calling)
- **Auth**: Supabase Auth with role-based access (super_admin, user)

## Database Schema

### Core Tables

1. **tenants** - Multi-tenancy support
2. **profiles** - User profiles with role-based access
3. **tasks** - Task management with jurisdiction tracking
4. **task_steps** - Granular worker execution steps
5. **documents** - Document storage metadata
6. **document_versions** - Version control for documents
7. **rag_sources** - RAG knowledge base sources
8. **rag_chunks** - Chunked content with embeddings
9. **citations** - Source citations for outputs
10. **recipes** - Saved workflows/templates
11. **audit_logs** - Immutable audit trail
12. **worker_configs** - Worker enable/disable controls

### Task Lifecycle

```
DRAFT → QUEUED → RUNNING → REVIEW_REQUIRED → COMPLETED → ARCHIVED
```

### Jurisdiction Structure

Every task must resolve jurisdiction:

```json
{
  "country": "US | IN",
  "state": "TX | CA | NY | null"
}
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Anthropic API key (for Claude)

### Step 1: Clone and Install

```bash
npm install
```

### Step 2: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration (already provided in .env)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Anthropic Claude API (required for workers - Phase 2)
ANTHROPIC_API_KEY=your_anthropic_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=LexCowork AI
```

### Step 3: Database Setup

The database schema has been applied via Supabase migrations. The following has been set up:

1. All tables with Row Level Security (RLS) enabled
2. Helper functions for super admin checks
3. Automatic profile creation on user signup
4. Demo data including:
   - Demo tenant: "Acme Legal"
   - Worker configurations (Orchestrator, Contract Review)
   - Sample recipes
   - Sample RAG sources

### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 5: Create First User (Super Admin)

1. Navigate to the login page
2. Sign up with any email and password
3. The first user automatically becomes a **super_admin**
4. Subsequent users will be regular **users**

## User Roles

### Super Admin

- Full governance access
- Enable/disable workers
- Upload/approve/revoke RAG sources
- Manage recipes (saved workflows)
- View immutable audit logs
- Emergency kill-switch (pause tasks, freeze writes)
- **Cannot** bypass legal guardrails or enable legal advice

### User

- Execute legal tasks via workers
- Access jurisdiction-scoped RAG sources
- Create and manage tasks
- View task history and citations

## Guardrails System

### 3-Layer Gates

1. **Policy Gate**: Blocks legal advice, court strategy, illegal activity
2. **Tool Gate**: Allowlist tools, approval required for write actions
3. **Output Gate**: Must include jurisdiction tag + "informational only, not legal advice" disclaimer + citations

### Safe Actions (Tool Calls)

Allowed actions with user approval:
- `create_document`
- `insert_redlines` (diff-only)
- `generate_summary`
- `generate_checklist`
- `compare_versions`

**Forbidden**: Silent edits, deletes without admin override

## Workers (Phase 2 - To Be Implemented)

### Orchestrator Worker (Mandatory)

Responsibilities:
- Route jurisdiction
- Select appropriate workers
- Run multi-step pipelines
- Merge outputs
- Enforce safety gates
- Stop at human review for write actions

### Contract Review Worker

Functions:
- Extract clauses
- Flag risks (low/medium/high/critical)
- Propose redlines as unified diff
- Generate plain-English summary
- **No legal advice**

## RAG Architecture (Phase 2 - To Be Implemented)

### Objectives

- Eliminate hallucinations
- Ensure jurisdiction correctness
- Support enterprise knowledge

### Source Types

**Primary (Admin-managed)**:
- Templates, clauses, policies, playbooks

**Reference (read-only)**:
- Indian statutes & case law
- US federal/state references

### Segmentation (Hard Rule)

```
/rag/us/federal
/rag/us/state/tx
/rag/in/central
```

No cross-jurisdiction retrieval unless explicitly requested.

### Retrieval Flow

1. Jurisdiction resolved
2. Scoped retrieval from pgvector
3. Verification pass
4. Citations attached
5. **No source = no legal claim**

## Project Structure

```
lexcowork-ai/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/          # Main dashboard
│   │   └── admin/              # Super Admin console
│   ├── login/                  # Authentication
│   ├── layout.tsx              # Root layout with AuthProvider
│   └── page.tsx                # Landing/redirect page
├── components/
│   ├── auth/
│   │   └── login-form.tsx      # Login form component
│   ├── layout/
│   │   └── dashboard-layout.tsx # Cowork-style layout
│   ├── tasks/
│   │   ├── task-list.tsx       # Task list sidebar
│   │   └── task-details.tsx    # Task details panel
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── auth/
│   │   └── auth-context.tsx    # Auth provider & hooks
│   ├── supabase/
│   │   ├── client.ts           # Supabase client
│   │   └── types.ts            # TypeScript types
│   └── utils.ts                # Utility functions
└── supabase/                   # Future Edge Functions location
```

## API Endpoints (Phase 2)

Edge Functions to be implemented:

- `/functions/v1/orchestrator` - Main worker orchestration
- `/functions/v1/contract-review` - Contract analysis worker
- `/functions/v1/rag-query` - RAG retrieval with jurisdiction scoping
- `/functions/v1/guardrails` - 3-gate validation system

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies enforcing:
- Tenant isolation
- Role-based access control
- Super admin full access (except bypassing guardrails)
- Immutable audit logs

### Authentication

- Supabase Auth with email/password
- Automatic profile creation via database trigger
- First user becomes super_admin
- Session management with auto-refresh

### Data Protection

- No API keys or secrets in client code
- All sensitive operations server-side
- Audit trail for all actions
- Version control for all documents

## Building for Production

```bash
npm run build
npm run start
```

## Deployment

### Recommended: Netlify (configured)

1. Connect your Git repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main

### Alternative: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` and follow prompts
3. Set environment variables in Vercel dashboard

## Current Implementation Status

### ✅ Completed (MVP Phase 1)

- [x] Database schema with all tables and RLS
- [x] Supabase Auth integration
- [x] User authentication (signup/login/logout)
- [x] Role-based access control (super_admin, user)
- [x] Cowork-style dashboard layout
- [x] Task management UI (list, details, status)
- [x] Super Admin console (placeholder)
- [x] Jurisdiction data structure
- [x] Auto-profile creation on signup
- [x] Demo data seeding

### 🚧 Phase 2 (Worker Implementation)

- [ ] Orchestrator Worker (Edge Function)
- [ ] Contract Review Worker (Edge Function)
- [ ] Anthropic Claude API integration
- [ ] Tool calling implementation
- [ ] Guardrails system (3 gates)
- [ ] RAG ingestion pipeline
- [ ] pgvector similarity search
- [ ] Citation system
- [ ] Task execution engine
- [ ] Real-time status updates

### 📋 Phase 3 (Enterprise Features)

- [ ] Additional workers (Policy Drafting, Compliance, Research)
- [ ] Legal API integrations (Indian Kanoon, vLex)
- [ ] Document versioning and diff viewer
- [ ] Recipe (workflow) builder
- [ ] Advanced audit log viewer
- [ ] Emergency kill-switch functionality
- [ ] Email notifications
- [ ] Export functionality (PDF/DOCX)

## Disclaimer

**IMPORTANT**: LexCowork AI is a productivity tool designed for informational and research purposes only. It does **NOT** provide legal advice, court strategy, or guaranteed legal outcomes.

- All outputs must include jurisdiction tags and disclaimers
- Users must consult qualified legal professionals for specific legal matters
- This system is not a replacement for licensed legal counsel
- Super Admins cannot bypass legal guardrails or enable legal advice features

## Support & Documentation

For questions or issues:
1. Check the PRD (Product Requirements Document v3.0)
2. Review the database schema in Supabase dashboard
3. Examine the source code and inline comments

## License

Proprietary - All rights reserved

---

**Built with**: Next.js, Supabase, Anthropic Claude, TypeScript, Tailwind CSS

**Jurisdiction Support**: 🇺🇸 United States (Federal, TX, CA, NY) | 🇮🇳 India (Central Laws)
