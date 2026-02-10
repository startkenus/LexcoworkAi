# LexCoworkAI Agent Orchestration - Cursor AI Implementation Guide

**Date:** February 10, 2026  
**IDE:** Cursor AI  
**Approach:** Pragmatic MVP (8-week implementation)  
**Stack:** Next.js 14, TypeScript, Supabase, Anthropic API  

---

## 🎯 Overview: Building with Cursor AI

This guide provides **step-by-step Cursor AI prompts** to build the simplified agent orchestration system.

### **Cursor AI Advantages:**
- ✅ AI-powered code completion (understands context)
- ✅ Multi-file editing (edit orchestrator + workers simultaneously)
- ✅ Natural language → Code (describe what you want)
- ✅ Debugging assistance (understands your architecture)

### **How to Use This Guide:**
1. Copy the prompts from each section
2. Paste into Cursor AI chat (Cmd/Ctrl + L)
3. Review generated code
4. Iterate with follow-up prompts
5. Test thoroughly before moving to next section

---

## 📁 Project Structure

```
lexcowork-ai/
├── app/
│   ├── api/
│   │   ├── orchestrate/
│   │   │   └── route.ts              # Main orchestration endpoint
│   │   ├── workers/
│   │   │   ├── contract-review/
│   │   │   │   └── route.ts          # Contract Review Worker
│   │   │   ├── compliance-check/
│   │   │   │   └── route.ts          # Compliance Worker
│   │   │   └── legal-research/
│   │   │       └── route.ts          # Research Worker
│   │   └── knowledge-base/
│   │       └── route.ts              # Knowledge base queries
│   ├── dashboard/
│   │   └── page.tsx                  # User dashboard
│   └── layout.tsx
├── lib/
│   ├── orchestrator/
│   │   ├── orchestrator.ts           # Core orchestration logic
│   │   ├── execution-planner.ts      # Task decomposition
│   │   └── synthesizer.ts            # Result synthesis
│   ├── workers/
│   │   ├── base-worker.ts            # Base worker class
│   │   ├── contract-review.ts        # Contract Review Worker
│   │   ├── compliance-check.ts       # Compliance Worker
│   │   └── legal-research.ts         # Research Worker
│   ├── knowledge-base/
│   │   ├── query-engine.ts           # KB query logic
│   │   └── types.ts                  # KB type definitions
│   ├── anthropic/
│   │   ├── client.ts                 # Anthropic API wrapper
│   │   ├── prompts.ts                # System prompts
│   │   └── compliance.ts             # Anthropic usage policy compliance
│   └── supabase/
│       ├── client.ts                 # Supabase client
│       └── types.ts                  # Database types
├── supabase/
│   └── migrations/
│       ├── 001_orchestration_tables.sql
│       └── 002_knowledge_base_seed.sql
└── types/
    ├── orchestration.ts              # Orchestration types
    └── workers.ts                    # Worker types
```

---

## 🚀 Phase 1: Setup & Foundation (Day 1-2)

### Step 1: Initialize Project Structure

**Cursor AI Prompt:**
```
Create a Next.js 14 project structure for LexCoworkAI agent orchestration system with:

1. App router structure with API routes for:
   - /api/orchestrate (main endpoint)
   - /api/workers/contract-review
   - /api/workers/compliance-check
   - /api/workers/legal-research
   - /api/knowledge-base

2. Lib folder with:
   - orchestrator/ (orchestration logic)
   - workers/ (worker implementations)
   - knowledge-base/ (KB query engine)
   - anthropic/ (API wrapper)
   - supabase/ (database client)

3. Types folder with TypeScript definitions for:
   - Orchestration flow
   - Worker interfaces
   - Knowledge base structures

Use TypeScript strict mode, include proper error handling, and follow Next.js 14 best practices.
```

### Step 2: Setup Environment Variables

**Cursor AI Prompt:**
```
Create a .env.local file with necessary environment variables for:

1. Anthropic API:
   - ANTHROPIC_API_KEY (commercial API)
   - ANTHROPIC_MODEL (claude-sonnet-4-5-20250929)

2. Supabase:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

3. Application:
   - NODE_ENV
   - NEXT_PUBLIC_APP_URL

Also create a .env.example file with placeholder values and comments explaining each variable.
```

### Step 3: Install Dependencies

**Cursor AI Prompt:**
```
Update package.json with dependencies for:

1. Core:
   - next (14.x)
   - react (18.x)
   - typescript (5.x)

2. Anthropic:
   - @anthropic-ai/sdk (latest)

3. Supabase:
   - @supabase/supabase-js (latest)
   - @supabase/ssr (latest)

4. UI:
   - @radix-ui/react-* (for shadcn/ui components)
   - tailwindcss (latest)
   - lucide-react (icons)

5. Utilities:
   - zod (validation)
   - date-fns (date handling)

Include appropriate dev dependencies and scripts for development.
```

---

## 🧠 Phase 2: Core Type Definitions (Day 2)

### Step 4: Define Core Types

**Cursor AI Prompt:**
```typescript
Create TypeScript type definitions in types/orchestration.ts for the agent orchestration system:

1. TaskRequest interface:
   - id: string
   - organization_id: string
   - user_id: string
   - description: string (user's request)
   - document_text?: string (optional uploaded document)
   - document_url?: string (optional document URL)
   - jurisdiction: string (e.g., 'US_Federal', 'IN_Central')
   - doc_type?: string (e.g., 'vendor_agreement', 'nda')
   - priority: 'high' | 'normal' | 'low'
   - created_at: Date

2. ExecutionPlan interface:
   - task_id: string
   - steps: ExecutionStep[]
   - estimated_duration_seconds: number
   - estimated_cost: number

3. ExecutionStep interface:
   - worker: WorkerType
   - purpose: string (why this worker is needed)
   - depends_on?: number[] (indices of steps that must complete first)
   - estimated_tokens: number

4. WorkerOutput interface:
   - worker: WorkerType
   - output: any (worker-specific output structure)
   - confidence: number (0-1)
   - token_usage: { input: number; output: number }
   - duration_ms: number
   - success: boolean
   - error?: string

5. TaskResult interface:
   - task_id: string
   - execution_plan: ExecutionPlan
   - worker_outputs: WorkerOutput[]
   - final_output: string (synthesized result)
   - confidence_score: number
   - requires_attorney_review: boolean
   - ai_disclosure: string
   - total_tokens: number
   - total_cost: number
   - duration_ms: number
   - status: 'completed' | 'failed' | 'requires_review'

6. WorkerType enum:
   - 'contract_review'
   - 'compliance_check'
   - 'legal_research'

Include comprehensive JSDoc comments explaining each field and providing examples.
```

### Step 5: Define Worker Types

**Cursor AI Prompt:**
```typescript
Create TypeScript definitions in types/workers.ts for worker implementations:

1. BaseWorkerConfig interface:
   - name: string
   - description: string
   - system_prompt: string
   - typical_token_usage: number
   - knowledge_base_query_types: string[]

2. WorkerContext interface:
   - task: TaskRequest
   - knowledge_base_results: KnowledgeBaseResult[]
   - previous_worker_outputs?: WorkerOutput[]
   - organization_preferences?: Record<string, any>

3. ContractReviewOutput interface:
   - summary: string
   - key_terms: { term: string; value: string; location: string }[]
   - risks: { severity: 'high' | 'medium' | 'low'; issue: string; location: string; recommendation: string }[]
   - missing_clauses: string[]
   - recommendations: string[]
   - confidence: number

4. ComplianceCheckOutput interface:
   - compliant: boolean
   - applicable_regulations: { name: string; jurisdiction: string; requirement: string }[]
   - violations: { regulation: string; issue: string; severity: 'critical' | 'major' | 'minor'; remediation: string }[]
   - recommendations: string[]
   - confidence: number

5. LegalResearchOutput interface:
   - query: string
   - cases: { citation: string; summary: string; relevance: number; jurisdiction: string }[]
   - statutes: { citation: string; text: string; relevance: number; jurisdiction: string }[]
   - analysis: string
   - confidence: number

Include detailed JSDoc comments with usage examples.
```

---

## 🗄️ Phase 3: Database Setup (Day 3)

### Step 6: Create Database Schema

**Cursor AI Prompt:**
```sql
Create a Supabase migration in supabase/migrations/001_orchestration_tables.sql with:

1. task_executions table:
   - id (UUID, primary key)
   - task_id (UUID, references tasks table)
   - organization_id (UUID, references organizations)
   - user_id (UUID, references profiles)
   - execution_plan (JSONB, stores ExecutionPlan)
   - worker_sequence (TEXT[], array of worker names)
   - worker_outputs (JSONB, stores WorkerOutput[])
   - final_output (TEXT, synthesized result)
   - confidence_score (DECIMAL(3,2), 0.00 to 1.00)
   - requires_attorney_review (BOOLEAN)
   - total_input_tokens (INTEGER)
   - total_output_tokens (INTEGER)
   - total_cost (DECIMAL(10,4))
   - started_at (TIMESTAMPTZ, default NOW())
   - completed_at (TIMESTAMPTZ)
   - duration_seconds (INTEGER)
   - status (TEXT, CHECK constraint: 'planning' | 'executing' | 'completed' | 'failed')

2. knowledge_base_content table:
   - id (UUID, primary key)
   - content_type (TEXT, CHECK: 'template' | 'clause' | 'precedent')
   - title (TEXT, not null)
   - content (TEXT, not null)
   - jurisdiction (TEXT)
   - doc_type (TEXT)
   - tags (TEXT[])
   - metadata (JSONB, for flexible additional data)
   - approved_by (TEXT, default 'system')
   - is_active (BOOLEAN, default TRUE)
   - usage_count (INTEGER, default 0)
   - created_at (TIMESTAMPTZ, default NOW())
   - updated_at (TIMESTAMPTZ, default NOW())

3. Create appropriate indexes:
   - task_executions: (organization_id, status), (task_id), (user_id)
   - knowledge_base_content: (content_type), (jurisdiction), (is_active), (tags using GIN)

4. Create RLS policies:
   - task_executions: Users can only see their own org's executions
   - knowledge_base_content: Read-only for all authenticated users

Include comments explaining each table's purpose and constraints.
```

### Step 7: Seed Knowledge Base

**Cursor AI Prompt:**
```sql
Create a seed migration in supabase/migrations/002_knowledge_base_seed.sql with:

1. Standard contract templates (10-15 templates):
   - Vendor Agreement (US Federal)
   - Vendor Agreement (India)
   - Mutual NDA (US Federal)
   - Mutual NDA (India)
   - Employment Agreement (US)
   - Consulting Agreement (US)
   - Software License Agreement
   - Service Level Agreement (SLA)
   - Data Processing Agreement (DPA)
   - Master Services Agreement (MSA)

2. Common clauses (50-100 clauses):
   - Indemnification (various types)
   - Limitation of Liability (various caps)
   - Confidentiality
   - Intellectual Property
   - Termination
   - Force Majeure
   - Governing Law
   - Dispute Resolution
   - Payment Terms
   - Warranties

3. Example precedents (20-30 items):
   - Key US Federal case citations
   - Key India Supreme Court cases
   - Important statutes (references only, not full text)

For each item, include:
- Proper jurisdiction tagging
- Doc type categorization
- Relevant tags for searchability
- Realistic content (templates should be 1000-2000 words)

Structure as INSERT statements with proper escaping.
```

---

## 🤖 Phase 4: Anthropic API Integration (Day 4)

### Step 8: Create Anthropic Client Wrapper

**Cursor AI Prompt:**
```typescript
Create an Anthropic API wrapper in lib/anthropic/client.ts with:

1. AnthropicClient class that:
   - Initializes with API key from environment
   - Implements retry logic (3 attempts with exponential backoff)
   - Implements timeout handling (60 seconds default)
   - Tracks token usage for cost monitoring
   - Handles rate limiting (with queue if needed)
   - Supports prompt caching for cost optimization

2. Key methods:
   - createMessage(params): Makes API call with retry logic
   - streamMessage(params): Streaming support for long responses
   - calculateCost(tokens): Calculates cost based on Sonnet 4.5 pricing
   - validateCommercialAPI(): Verifies API key is commercial (not consumer)

3. Error handling:
   - Custom error types for different failure modes
   - Structured error responses
   - Logging for debugging

4. Usage policy compliance:
   - Flag high-risk legal use cases
   - Require human-in-loop for specific scenarios
   - Add AI disclosure to all outputs

Use TypeScript classes, include comprehensive error handling, add JSDoc comments, and follow SOLID principles.
```

### Step 9: Define System Prompts

**Cursor AI Prompt:**
```typescript
Create system prompts in lib/anthropic/prompts.ts with:

1. ORCHESTRATOR_SYSTEM_PROMPT:
   - Explains role as task decomposer and router
   - Lists available workers (contract_review, compliance_check, legal_research)
   - Provides workflow instructions (analyze → plan → execute → synthesize)
   - Includes output format specification (JSON with execution_plan)
   - Emphasizes legal compliance (no advice, only information)
   - Requires confidence scoring and attorney review flagging
   - Includes Anthropic usage policy compliance (human-in-loop, AI disclosure)

2. CONTRACT_REVIEW_WORKER_PROMPT:
   - Defines role as contract analyzer
   - Specifies analysis process (read → query KB → analyze → report)
   - Includes output format (summary, risks, missing clauses, recommendations)
   - Requires citation of specific contract sections
   - Flags high-risk items for attorney review

3. COMPLIANCE_CHECK_WORKER_PROMPT:
   - Defines role as regulatory compliance checker
   - Specifies verification process (identify regulations → check compliance → report)
   - Includes output format (compliant yes/no, violations, recommendations)
   - Requires citation of specific regulations
   - Emphasizes jurisdiction-specific rules

4. LEGAL_RESEARCH_WORKER_PROMPT:
   - Defines role as legal research assistant
   - Specifies research process (query → search KB → analyze → cite)
   - Includes output format (cases, statutes, analysis)
   - Requires proper legal citations
   - Emphasizes "I don't know" over guessing

For each prompt:
- Include CRITICAL RULES section
- Add examples of good vs bad outputs
- Specify token limits
- Include legal disclaimers

Use template literals with proper escaping. Include comments explaining prompt design choices.
```

---

## 🎼 Phase 5: Orchestrator Implementation (Day 5-6)

### Step 10: Build Execution Planner

**Cursor AI Prompt:**
```typescript
Create an execution planner in lib/orchestrator/execution-planner.ts that:

1. Analyzes a TaskRequest and determines which workers are needed
2. Creates an ExecutionPlan with sequential steps
3. Estimates token usage and cost

Key function: planExecution(task: TaskRequest): Promise<ExecutionPlan>

Logic:
- Use Anthropic API to analyze the task
- Prompt orchestrator to determine worker sequence
- Parse response into structured ExecutionPlan
- Estimate costs based on typical token usage
- Handle edge cases (invalid requests, unclear requirements)

Example decision logic:
- "Review this contract" → contract_review worker
- "Check GDPR compliance" → compliance_check worker
- "Find cases about X" → legal_research worker
- "Review vendor agreement for GDPR compliance" → contract_review + compliance_check

Include:
- Comprehensive error handling
- Logging for debugging
- Token usage estimation
- Cost calculation
- Validation of execution plan

Use async/await, implement proper TypeScript types, add JSDoc comments.
```

### Step 11: Build Worker Executor

**Cursor AI Prompt:**
```typescript
Create a worker executor in lib/orchestrator/worker-executor.ts that:

1. Executes workers sequentially according to ExecutionPlan
2. Passes context between workers (previous outputs)
3. Queries knowledge base before each worker
4. Tracks token usage and timing
5. Handles worker failures gracefully

Key function: executeWorkers(plan: ExecutionPlan, task: TaskRequest): Promise<WorkerOutput[]>

Process:
1. For each step in execution plan:
   a. Query knowledge base for relevant context
   b. Build worker prompt with context + KB results + previous outputs
   c. Call appropriate worker via Anthropic API
   d. Parse and validate worker output
   e. Track tokens and timing
   f. Store result

2. If worker fails:
   - Retry once
   - If still fails, mark as failed but continue with other workers
   - Flag final result as requiring review

3. Return array of WorkerOutput objects

Include:
- Progress callbacks (for UI updates)
- Comprehensive error handling
- Token tracking
- Performance monitoring
- Validation of worker outputs

Implement with async/await, proper error boundaries, and detailed logging.
```

### Step 12: Build Result Synthesizer

**Cursor AI Prompt:**
```typescript
Create a result synthesizer in lib/orchestrator/synthesizer.ts that:

1. Takes multiple WorkerOutput objects and synthesizes into coherent final result
2. Calculates overall confidence score
3. Determines if attorney review is required
4. Adds mandatory AI disclosure
5. Formats output for user consumption

Key function: synthesizeResults(outputs: WorkerOutput[], task: TaskRequest): Promise<TaskResult>

Logic:
- Use Anthropic API to synthesize worker outputs
- Prompt orchestrator to create unified response
- Calculate confidence as weighted average of worker confidences
- Flag for attorney review if:
  - Any worker confidence < 0.85
  - High-risk document type (court filing, >$100K contract)
  - User specified high-stakes
- Add Anthropic-required AI disclosure

Output format:
- Executive summary
- Key findings from each worker
- Consolidated recommendations
- Risk assessment
- What attorney should verify
- Confidence score
- AI disclosure

Include proper error handling, token tracking, and validation.
```

### Step 13: Build Main Orchestrator

**Cursor AI Prompt:**
```typescript
Create the main orchestrator in lib/orchestrator/orchestrator.ts that ties everything together:

1. Main function: orchestrateTask(task: TaskRequest): Promise<TaskResult>

2. Full workflow:
   - Validate task request
   - Check Anthropic usage policy compliance
   - Plan execution (which workers needed)
   - Execute workers sequentially
   - Synthesize results
   - Store execution in database
   - Return final result

3. Include:
   - Progress tracking (emit events for UI)
   - Comprehensive error handling (try/catch at each step)
   - Database persistence (store execution details)
   - Token usage tracking
   - Cost calculation
   - Performance monitoring (log duration at each step)

4. Handle failure modes:
   - Planning fails → Return error with helpful message
   - Worker fails → Continue with other workers, flag for review
   - Synthesis fails → Return raw worker outputs
   - Database save fails → Log error but still return result

5. Anthropic compliance:
   - Verify commercial API usage
   - Add AI disclosure to all outputs
   - Flag high-risk tasks for human review
   - Log all interactions for audit trail

Implement as a class with proper encapsulation, use async/await throughout, include comprehensive JSDoc comments.
```

---

## 👷 Phase 6: Worker Implementations (Day 7-8)

### Step 14: Base Worker Class

**Cursor AI Prompt:**
```typescript
Create a base worker class in lib/workers/base-worker.ts that:

1. Defines common worker functionality
2. Handles knowledge base queries
3. Manages Anthropic API calls
4. Tracks token usage

Abstract class BaseWorker with:
- abstract name: string
- abstract systemPrompt: string
- abstract knowledgeBaseQueryTypes: string[]

Methods:
- queryKnowledgeBase(task): Queries KB for relevant content
- callAnthropicAPI(prompt): Makes API call with error handling
- execute(context): Main execution method (abstract)
- validateOutput(output): Validates worker output structure
- calculateConfidence(output): Calculates confidence score

Include:
- Prompt caching support (cache system prompt)
- Error handling with retries
- Token usage tracking
- Performance logging

Use TypeScript abstract classes, implement proper error boundaries.
```

### Step 15: Contract Review Worker

**Cursor AI Prompt:**
```typescript
Create Contract Review Worker in lib/workers/contract-review.ts extending BaseWorker:

1. Implement execute(context: WorkerContext): Promise<ContractReviewOutput>

2. Process:
   - Extract contract text from task
   - Query knowledge base for:
     - Similar contracts in same jurisdiction
     - Standard clauses for this contract type
     - Known red flags
   - Build comprehensive prompt with:
     - Contract text
     - Knowledge base context
     - User's specific questions
   - Call Anthropic API with CONTRACT_REVIEW_WORKER_PROMPT
   - Parse structured response
   - Validate output structure
   - Calculate confidence score

3. Output structure (ContractReviewOutput):
   - summary: Brief overview of contract purpose and parties
   - key_terms: Array of important terms with locations
   - risks: Array of identified risks with severity levels
   - missing_clauses: List of recommended clauses not present
   - recommendations: Specific actionable suggestions
   - confidence: Score 0-1

4. Special considerations:
   - Flag contracts over $100K as high-stakes
   - Identify jurisdiction-specific issues
   - Cite specific contract sections (e.g., "Section 3.2")
   - Recommend attorney review for unusual terms

Include comprehensive error handling, token tracking, and validation.
```

### Step 16: Compliance Check Worker

**Cursor AI Prompt:**
```typescript
Create Compliance Check Worker in lib/workers/compliance-check.ts extending BaseWorker:

1. Implement execute(context: WorkerContext): Promise<ComplianceCheckOutput>

2. Process:
   - Identify document type and jurisdiction
   - Query knowledge base for:
     - Applicable regulations (GDPR, CCPA, etc.)
     - Jurisdiction-specific requirements
     - Industry-specific compliance rules
   - Build prompt with:
     - Document text
     - Specific regulations to check
     - Knowledge base context
   - Call Anthropic API with COMPLIANCE_CHECK_WORKER_PROMPT
   - Parse structured response
   - Validate compliance status

3. Output structure (ComplianceCheckOutput):
   - compliant: Boolean overall compliance status
   - applicable_regulations: List of regulations checked
   - violations: Array of specific non-compliance issues
   - recommendations: Remediation steps
   - confidence: Score 0-1

4. Key regulations to check:
   - GDPR (EU data privacy)
   - CCPA (California privacy)
   - HIPAA (US healthcare)
   - SOC 2 (security compliance)
   - India IT Act 2000
   - Contract-specific requirements

Include proper jurisdiction handling, comprehensive checks, and clear remediation guidance.
```

### Step 17: Legal Research Worker

**Cursor AI Prompt:**
```typescript
Create Legal Research Worker in lib/workers/legal-research.ts extending BaseWorker:

1. Implement execute(context: WorkerContext): Promise<LegalResearchOutput>

2. Process:
   - Parse research query from task
   - Query knowledge base for:
     - Relevant case law
     - Applicable statutes
     - Legal precedents
   - Integrate with Indian Kanoon API for India-specific research
   - Build prompt with:
     - Research question
     - Knowledge base results
     - Previous worker outputs (if any)
   - Call Anthropic API with LEGAL_RESEARCH_WORKER_PROMPT
   - Parse and structure response
   - Validate citations

3. Output structure (LegalResearchOutput):
   - query: Original research question
   - cases: Array of relevant cases with citations
   - statutes: Array of relevant statutes
   - analysis: Synthesized legal analysis
   - confidence: Score 0-1

4. Citation requirements:
   - Verify all case citations exist (check Indian Kanoon API)
   - Format citations properly (Bluebook style for US, Indian citation style for India)
   - Include relevance scores
   - Flag if citation cannot be verified

5. Special handling:
   - If query is ambiguous, ask clarifying questions
   - If no relevant law found, clearly state "No directly applicable precedent found"
   - Distinguish between binding and persuasive authority
   - Note jurisdiction limitations

Include integration with Indian Kanoon API, comprehensive citation validation, proper error handling.
```

---

## 🔌 Phase 7: API Routes (Day 9)

### Step 18: Main Orchestration Endpoint

**Cursor AI Prompt:**
```typescript
Create main orchestration API route in app/api/orchestrate/route.ts:

1. POST endpoint that:
   - Accepts TaskRequest in request body
   - Validates user authentication (Supabase)
   - Checks organization token limits
   - Calls orchestrateTask() function
   - Returns TaskResult
   - Handles errors gracefully

2. Request validation:
   - Required fields: description, jurisdiction
   - Optional fields: document_text, document_url, doc_type
   - Validate jurisdiction format
   - Check document size limits (max 100KB text)

3. Authentication & authorization:
   - Verify user is authenticated
   - Check user belongs to organization
   - Verify organization has sufficient token allocation
   - Log token usage

4. Response format:
   - Success: Return TaskResult with 200 status
   - Validation error: Return error message with 400 status
   - Auth error: Return 401 status
   - Server error: Return 500 status with safe error message

5. Error handling:
   - Catch all exceptions
   - Log errors for debugging (but don't expose to client)
   - Return user-friendly error messages
   - Track failed requests for monitoring

6. Rate limiting:
   - Check organization daily task limit
   - Return 429 if limit exceeded
   - Include retry-after header

Use Next.js 14 App Router conventions, implement proper TypeScript types, add comprehensive error handling.
```

### Step 19: Knowledge Base Query Endpoint

**Cursor AI Prompt:**
```typescript
Create knowledge base query API route in app/api/knowledge-base/route.ts:

1. GET endpoint that:
   - Accepts query parameters: query, jurisdiction, content_type, limit
   - Searches knowledge_base_content table
   - Returns relevant content ranked by relevance
   - Supports filtering by jurisdiction and content type

2. Query logic:
   - Full-text search on title and content
   - Filter by jurisdiction (if provided)
   - Filter by content_type (if provided)
   - Order by relevance (usage_count + text match)
   - Limit results (default 10, max 50)

3. Response format:
   - Array of knowledge base items with:
     - id, title, content (truncated if >1000 chars)
     - content_type, jurisdiction, tags
     - relevance_score

4. Performance:
   - Implement caching for common queries (Redis or in-memory)
   - Use database indexes for fast searches
   - Limit content field length in responses

5. Access control:
   - Require authentication
   - Read-only endpoint (no POST/PUT/DELETE)

Use Supabase client with RLS policies, implement proper caching, add rate limiting.
```

---

## 🧪 Phase 8: Testing & Validation (Day 10-11)

### Step 20: Create Test Scenarios

**Cursor AI Prompt:**
```typescript
Create comprehensive test scenarios in tests/orchestration.test.ts:

1. Unit tests for each component:
   - ExecutionPlanner.planExecution()
   - WorkerExecutor.executeWorkers()
   - ResultSynthesizer.synthesizeResults()
   - Each worker's execute() method

2. Integration tests:
   - Full orchestration flow (end-to-end)
   - Database persistence
   - Knowledge base queries
   - Anthropic API interactions (with mocks)

3. Test scenarios (10 real legal use cases):

   Scenario 1: Simple Contract Review
   - Input: Standard vendor agreement
   - Expected: Contract review worker only
   - Validation: Identifies key terms, no high risks

   Scenario 2: GDPR Compliance Check
   - Input: Privacy policy text
   - Expected: Compliance check worker
   - Validation: Checks GDPR requirements, flags issues

   Scenario 3: Complex Multi-Worker Task
   - Input: "Review this vendor agreement for GDPR compliance"
   - Expected: Contract review → Compliance check → Synthesis
   - Validation: Both workers execute, results combined

   Scenario 4: Legal Research Query
   - Input: "Find cases about force majeure in pandemic"
   - Expected: Legal research worker
   - Validation: Returns relevant cases, proper citations

   Scenario 5: High-Stakes Contract (>$100K)
   - Input: $500K contract
   - Expected: All workers, flagged for attorney review
   - Validation: requires_attorney_review = true

   Scenario 6: Ambiguous Request
   - Input: Unclear request
   - Expected: Orchestrator asks clarifying questions
   - Validation: Returns need-more-info response

   Scenario 7: Missing Document
   - Input: Task without document text
   - Expected: Error handling
   - Validation: Clear error message

   Scenario 8: Invalid Jurisdiction
   - Input: Unknown jurisdiction
   - Expected: Validation error
   - Validation: Helpful error message

   Scenario 9: Token Limit Exceeded
   - Input: Task that would exceed org token limit
   - Expected: Rejection
   - Validation: Clear limit exceeded message

   Scenario 10: Worker Failure
   - Input: Valid task but one worker fails
   - Expected: Continue with other workers
   - Validation: Partial results returned, flagged for review

4. Performance tests:
   - Measure execution time for each scenario
   - Track token usage accuracy
   - Verify cost calculations

Use Jest or Vitest, implement proper mocks for Anthropic API, include assertions for all expected outputs.
```

### Step 21: Create Debug Dashboard

**Cursor AI Prompt:**
```typescript
Create a debug dashboard in app/dashboard/debug/page.tsx for testing orchestration:

1. UI Components:
   - Task input form with:
     - Text area for request description
     - File upload for documents
     - Jurisdiction selector
     - Document type selector
     - Priority selector
   
   - Execution progress display:
     - Real-time status updates
     - Worker execution steps
     - Token usage tracking
     - Cost calculation
   
   - Results display:
     - Execution plan
     - Worker outputs (expandable)
     - Final synthesized result
     - Confidence scores
     - Attorney review flag

2. Features:
   - Save/load test scenarios
   - View execution history
   - Export results as JSON
   - Share test cases

3. Real-time updates:
   - Use Server-Sent Events or polling
   - Show progress as workers execute
   - Display token usage live

4. Developer tools:
   - View raw API requests/responses
   - Inspect prompts sent to Claude
   - Debug worker outputs
   - Performance metrics

Use Next.js 14 with server components where possible, implement shadcn/ui components, add proper TypeScript types.
```

---

## 📊 Phase 9: Monitoring & Compliance (Day 12)

### Step 22: Add Anthropic Compliance Layer

**Cursor AI Prompt:**
```typescript
Create Anthropic usage policy compliance module in lib/anthropic/compliance.ts:

1. Function: checkAnthropicCompliance(task: TaskRequest): ComplianceCheck

2. High-risk use case detection:
   - Legal advice (vs legal information)
   - Court filings
   - Regulatory submissions
   - Consumer-facing outputs
   - High-value contracts (>$100K)

3. Required safeguards:
   - Human-in-the-loop: Flag tasks requiring attorney review
   - AI disclosure: Add mandatory disclosure to all outputs
   - Usage policy: Block prohibited use cases

4. Prohibited use cases (per Anthropic Usage Policy):
   - Legal advice (only legal information allowed)
   - Deceptive content
   - Assistance with illegal activities
   - Voter/campaign targeting

5. Implementation:
   interface ComplianceCheck {
     allowed: boolean
     requires_human_review: boolean
     requires_ai_disclosure: boolean
     risk_level: 'low' | 'medium' | 'high' | 'critical'
     safeguards_required: string[]
     blocked_reason?: string
   }

6. Disclosure text:
   "This document was generated with assistance from Claude AI 
   (Anthropic PBC). It is provided for informational purposes only 
   and does not constitute legal advice. This output may contain 
   errors and should be reviewed by a licensed attorney before use."

Include detailed logging, clear error messages, and proper enforcement of Anthropic's requirements.
```

### Step 23: Add Token Usage Monitoring

**Cursor AI Prompt:**
```typescript
Create token usage monitoring system in lib/monitoring/token-tracker.ts:

1. TokenTracker class that:
   - Tracks token usage per organization
   - Tracks token usage per user
   - Tracks token usage per worker
   - Calculates costs in real-time
   - Enforces limits
   - Sends alerts

2. Key methods:
   - recordUsage(orgId, userId, taskId, tokens, cost)
   - checkLimit(orgId): Returns remaining tokens
   - getUsageStats(orgId, timeRange): Returns usage statistics
   - predictMonthlyUsage(orgId): Forecasts based on current usage

3. Limit enforcement:
   - Daily limits per user
   - Monthly limits per organization
   - Alert at 80%, 90%, 95% thresholds
   - Block at 100% (with override for super admin)

4. Database integration:
   - Update organizations.current_token_usage
   - Insert token_usage_logs records
   - Update user-level tracking

5. Alerting:
   - Email alerts to org admin at thresholds
   - In-app notifications
   - Dashboard warnings

6. Cost optimization tracking:
   - Monitor prompt caching effectiveness
   - Identify expensive queries
   - Suggest optimizations

Implement with proper error handling, real-time updates, and comprehensive logging.
```

---

## 🚀 Phase 10: Deployment Preparation (Day 13-14)

### Step 24: Environment-Specific Configuration

**Cursor AI Prompt:**
```typescript
Create environment-specific configuration in lib/config/index.ts:

1. Development config:
   - Use development Anthropic API key
   - Enable verbose logging
   - Disable rate limiting
   - Use local Supabase instance
   - Mock external APIs (optional)

2. Staging config:
   - Use staging API keys
   - Enable moderate logging
   - Enable rate limiting (relaxed)
   - Use staging Supabase project
   - Test with real APIs

3. Production config:
   - Use production API keys
   - Enable error logging only
   - Enable strict rate limiting
   - Use production Supabase
   - All safeguards enabled

4. Configuration structure:
   interface Config {
     env: 'development' | 'staging' | 'production'
     anthropic: {
       apiKey: string
       model: string
       timeout: number
       retries: number
     }
     supabase: {
       url: string
       anonKey: string
       serviceRoleKey: string
     }
     features: {
       enableDebugDashboard: boolean
       enableVerboseLogging: boolean
       enableRateLimiting: boolean
       enablePromptCaching: boolean
     }
     limits: {
       maxTasksPerDay: number
       maxTokensPerTask: number
       maxDocumentSizeMB: number
     }
   }

5. Load from environment variables with validation
6. Export typed config object

Use zod for validation, implement proper type safety, add helpful error messages.
```

### Step 25: Error Handling & Logging

**Cursor AI Prompt:**
```typescript
Create comprehensive error handling system in lib/errors/index.ts:

1. Custom error classes:
   - OrchestrationError (base class)
   - ValidationError (invalid inputs)
   - WorkerError (worker execution failure)
   - APIError (Anthropic API issues)
   - DatabaseError (Supabase issues)
   - RateLimitError (limits exceeded)
   - ComplianceError (Anthropic policy violations)

2. Error handling utilities:
   - logError(error, context): Logs with context
   - formatErrorForUser(error): User-friendly messages
   - shouldRetry(error): Determines if retry is appropriate
   - notifyAdmin(error): Alerts for critical errors

3. Logging system:
   - Development: Console logs (verbose)
   - Production: Structured JSON logs
   - Include context: userId, orgId, taskId, timestamp
   - Log levels: debug, info, warn, error, critical

4. Error responses:
   - Never expose sensitive information
   - Provide actionable error messages
   - Include support contact info for critical errors
   - Track error rates for monitoring

5. Integration with monitoring tools:
   - Sentry (for error tracking)
   - Or custom logging to Supabase
   - Alert on error rate spikes

Implement proper error hierarchies, include stack traces for debugging (but not in user responses), add comprehensive logging.
```

### Step 26: Documentation

**Cursor AI Prompt:**
```markdown
Create comprehensive documentation in docs/ folder:

1. docs/ARCHITECTURE.md:
   - System overview
   - Component diagram
   - Data flow diagrams
   - Technology stack
   - Design decisions and rationale

2. docs/API.md:
   - All API endpoints
   - Request/response formats
   - Authentication
   - Error codes
   - Rate limits
   - Examples

3. docs/ORCHESTRATION.md:
   - How orchestration works
   - Worker architecture
   - Execution flow
   - Knowledge base structure
   - Token usage and costs

4. docs/DEVELOPMENT.md:
   - Setup instructions
   - Running locally
   - Testing
   - Debugging
   - Common issues

5. docs/DEPLOYMENT.md:
   - Environment setup
   - Configuration
   - Database migrations
   - Monitoring
   - Rollback procedures

6. docs/COMPLIANCE.md:
   - Anthropic usage policy compliance
   - UPL (Unauthorized Practice of Law) considerations
   - Data privacy (GDPR, CCPA)
   - Required disclaimers
   - Attorney review requirements

Include diagrams (Mermaid syntax), code examples, troubleshooting guides, and FAQs.
```

---

## ✅ Final Checklist

**Cursor AI Prompt:**
```
Create a pre-launch checklist in CHECKLIST.md:

ARCHITECTURE:
[ ] All type definitions created and exported
[ ] Database schema deployed to Supabase
[ ] Knowledge base seeded with initial content
[ ] All environment variables configured

IMPLEMENTATION:
[ ] Anthropic client wrapper implemented with retry logic
[ ] System prompts for orchestrator and all workers
[ ] Execution planner working correctly
[ ] Worker executor handling sequential execution
[ ] Result synthesizer combining outputs properly
[ ] All 3 workers (contract review, compliance, research) implemented
[ ] Knowledge base query function working
[ ] Main orchestration API endpoint functional

COMPLIANCE:
[ ] Anthropic commercial API verified (not consumer)
[ ] High-risk use case detection implemented
[ ] Human-in-the-loop gates for attorney review
[ ] AI disclosure added to all outputs
[ ] Usage policy compliance checks active

MONITORING:
[ ] Token usage tracking working
[ ] Cost calculation accurate
[ ] Organization limit enforcement active
[ ] Alerting configured (80%, 90%, 95%, 100%)
[ ] Error logging implemented

TESTING:
[ ] All 10 test scenarios passing
[ ] Integration tests passing
[ ] Performance tests showing acceptable latency
[ ] Token usage estimates accurate within 10%
[ ] Cost calculations verified

SECURITY:
[ ] RLS policies active on all tables
[ ] Authentication required for all endpoints
[ ] Rate limiting implemented
[ ] Input validation on all endpoints
[ ] Sensitive data not exposed in logs

DOCUMENTATION:
[ ] Architecture documentation complete
[ ] API documentation complete
[ ] Setup instructions written
[ ] Compliance guide created

DEPLOYMENT:
[ ] Staging environment tested
[ ] Production environment configured
[ ] Database migrations ready
[ ] Monitoring dashboards set up
[ ] Rollback plan documented

LEGAL:
[ ] Terms of Service reference Anthropic
[ ] Privacy Policy updated for data processing
[ ] Disclaimers added to all outputs
[ ] Legal counsel review completed
[ ] Insurance obtained

READY FOR LAUNCH:
[ ] All checklist items completed
[ ] Stakeholders approved
[ ] Launch plan documented
```

---

## 🎓 Pro Tips for Cursor AI

### Using Cursor AI Effectively:

1. **Composer Mode (Cmd/Ctrl + Shift + I):**
   - Use for multi-file edits
   - Example: "Update orchestrator.ts and all worker files to use new error handling"

2. **Chat Mode (Cmd/Ctrl + L):**
   - Use for single file edits
   - Example: "Add error handling to this function"

3. **Inline Edit (Cmd/Ctrl + K):**
   - Select code, describe changes
   - Example: Select function, "Add try/catch and logging"

4. **Ask Follow-up Questions:**
   - "Why did you implement it this way?"
   - "What are the edge cases I should test?"
   - "How can I optimize this for performance?"

5. **Iterative Refinement:**
   - Start with basic implementation
   - Then: "Add error handling"
   - Then: "Add logging"
   - Then: "Add tests"

### Best Practices:

1. **Start with Types:**
   - Define TypeScript types first
   - Cursor AI will auto-complete based on types

2. **One Component at a Time:**
   - Build orchestrator → workers → API routes
   - Test each component before moving to next

3. **Use Comments as Instructions:**
   ```typescript
   // TODO: Add retry logic with exponential backoff (max 3 attempts)
   ```
   - Cursor AI will implement based on comment

4. **Reference Existing Code:**
   - "Make this worker similar to the contract review worker"
   - Cursor AI understands your codebase context

5. **Ask for Explanations:**
   - "@workspace explain how orchestration flow works"
   - Cursor AI will explain based on your code

---

## 📈 Expected Timeline

**Total: 8-10 Weeks from Start to MVP Launch**

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Setup & Types | 2 days | Project structure, types, environment |
| Database | 1 day | Schema, migrations, seed data |
| Anthropic Integration | 1 day | Client wrapper, prompts |
| Orchestrator Core | 2 days | Planner, executor, synthesizer |
| Workers | 2 days | 3 worker implementations |
| API Routes | 1 day | Endpoints and validation |
| Testing | 2 days | Test scenarios, debug dashboard |
| Compliance & Monitoring | 1 day | Anthropic compliance, token tracking |
| Deployment Prep | 2 days | Config, error handling, docs |
| **Buffer** | 2 days | Unexpected issues, refinement |

---

## 🎯 Success Criteria

**MVP is ready when:**

1. ✅ User can submit task via API
2. ✅ Orchestrator correctly routes to appropriate workers
3. ✅ Workers execute sequentially with context passing
4. ✅ Knowledge base queries return relevant content
5. ✅ Final result is synthesized and properly formatted
6. ✅ Token usage is tracked and limits enforced
7. ✅ Anthropic compliance safeguards are active
8. ✅ All 10 test scenarios pass
9. ✅ Performance is acceptable (<60 seconds per task)
10. ✅ Legal disclaimers are present on all outputs

---

**Ready to start building? Copy the prompts from each step into Cursor AI and let's ship this! 🚀**
