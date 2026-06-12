# 0Brain Dashboard Design

Date: 2026-06-08

## Goal

Build a local dashboard for inspecting, querying, editing, and debugging the shared 0Brain memory backend across Hermes and OpenClaw agents.

The dashboard must make it obvious what each agent remembers, which provider path it uses, what metadata exists under each memory, and whether backend functions such as semantic recall, writeback, stats, inventory, review, delete, and metadata extraction are working.

## Users

Primary user: Nik, auditing and managing agent memory.

Agents currently in scope:

- Hermes via `hermes-0brain-memory`: `agent-sam`, `agent-tank`
- OpenClaw via `ob1-agent-memory`: `agent-dean`, `agent-cass`, `agent-crowley`, `agent-bobby`
- Suspicious/default namespace: `agent-main`

`agent-hermes` is not treated as a real agent. It is only a safe default namespace from the Hermes provider package and should appear as a warning if it contains memories.

## Recommended Product Shape

Use an Operations Console as the main dashboard, with a Brain Map diagnostics tab.

The first screen should not be a landing page. It should be the working console.

## Main Views

### 1. Agents Overview

Purpose: show memory health at a glance.

Each agent row/card shows:

- Display name
- Workspace ID
- Runtime family: Hermes, OpenClaw, or Unknown
- Provider repo/source: `hermes-0brain-memory`, `ob1-agent-memory`, or unresolved
- Total memories
- Counts by memory type
- Unconfirmed count
- Instruction-eligible count
- Last write time
- Warning badges for empty agents, `agent-main`, or unknown workspace

### 2. Memory Browser

Purpose: inspect and manage memories for the selected workspace.

Controls:

- Workspace selector
- Semantic query input using `/recall`
- Inventory list using `/memories`
- Filters for memory type, review status, lifecycle status, runtime, and task ID prefix
- Toggle between inventory results and semantic recall results

Table columns:

- Created time
- Memory type
- Summary
- Review status
- Lifecycle status
- Runtime/source
- Similarity/retrieval strategy when shown from recall
- Metadata indicators

### 3. Memory Detail and Editor

Purpose: see exactly what a memory contains and fix bad memories.

Panels:

- Full content
- Metadata JSON
- Extracted people
- Extracted topics
- Extracted type
- Action items
- Dates mentioned
- Source refs
- Models used
- Retention
- Review/lifecycle state
- Recall trace links when available

Actions:

- Save edited content/summary/metadata where backend support exists
- Review actions: confirm, reject, stale, restrict scope, evidence only
- Delete memory with confirmation
- Copy memory ID

For the first implementation, editing may be limited to review actions and delete if the backend lacks a general memory edit endpoint. The UI should clearly mark unsupported edit fields as read-only instead of faking edit support.

### 4. Semantic Recall Tester

Purpose: prove each agent has semantic search.

Controls:

- Workspace selector
- Query field
- Result limit
- Include unconfirmed toggle
- Project-only toggle when project ID is available

Results show:

- Returned memories
- Similarity score
- Retrieval strategy: vector or recency fallback
- Ranking score if returned
- Request ID
- Link to recall trace

### 5. Brain Map Diagnostics

Purpose: show what backend functions do and whether they work for the selected agent.

Function cards:

- `/health`: backend status
- `/stats`: exact counts
- `/memories`: inventory listing
- `/recall`: semantic search
- `/writeback`: embed + GPT-4o-mini metadata extraction
- `/delete`: workspace-scoped delete
- `/memories/review`: review queue
- `/memories/:id/review`: review actions
- `/recall-traces/:request_id`: trace inspection
- `/admin/reembed`: repair/admin only

Each card shows:

- What it does
- Which UI feature uses it
- Last test status
- Required parameters
- Whether Hermes uses it, OpenClaw uses it, both use it, or admin-only

### 6. Workspace Misrouting Audit

Purpose: catch memory written to the wrong workspace.

Must highlight:

- `agent-main` memories
- empty expected agents: Dean/Crowley currently
- any non-roster workspace with memories
- memories with runtime/source that does not match the expected provider family

The dashboard should not auto-move memories in v1. It should report suspects and allow manual inspection.

## Data Sources

Primary API: `https://guvkubaqeojncfwnnccf.supabase.co/functions/v1/agent-memory-api`

Auth:

- Local dashboard reads `OBRAIN_API_KEY` from a local `.env` or user-provided config.
- The key must never be exposed in browser logs or stored in localStorage.

Backend endpoints:

- `POST /stats`
- `GET /memories`
- `GET /memories/:id`
- `POST /recall`
- `GET /recall-traces/:request_id`
- `GET /memories/review`
- `PATCH /memories/:id/review`
- `POST /delete`
- `GET /health`

Optional/admin endpoint:

- `POST /admin/reembed` with dry-run support

## Architecture

Build a local web app in `C:\Users\kango\OneDrive\Desktop\0brain dash`.

Recommended stack:

- Vite + React + TypeScript
- Local Node API proxy for OB1 calls
- No external deployment required

Reason: browser code should not hold the brain key. A local API proxy can load secrets from `.env`, call OB1, and return safe JSON to the frontend.

## UX Principles

- Dense, operational, scan-first UI
- No marketing page
- First screen is the console
- Clear difference between semantic recall and inventory list
- Clear difference between Hermes provider and OpenClaw plugin
- Every backend function should be inspectable from the diagnostics tab
- Unsafe actions such as delete require confirmation

## Error Handling

- If `/stats` fails, show backend unavailable state.
- If a workspace is empty, show "no memories in this workspace" and suggest checking `agent-main`.
- If semantic recall falls back to recency, show the retrieval strategy visibly.
- If metadata fields are missing, show "not extracted" and indicate whether the memory predates metadata restoration.
- If edit actions are unsupported by backend, keep fields read-only.

## Testing

Minimum verification before calling v1 complete:

- App starts locally.
- Agents overview loads counts for all known workspaces.
- Memory browser lists memories for Sam, Tank, Cass, Bobby, and agent-main.
- Semantic recall returns vector results for a known query.
- Detail view shows metadata fields.
- Diagnostics tab checks `/health`, `/stats`, `/memories`, and `/recall`.
- Delete is tested only on a temporary audit workspace memory.
- Browser smoke test verifies desktop layout has no overlapping UI.

## V1 Scope

Included:

- Agents overview
- Workspace memory inventory
- Semantic recall tester
- Memory detail inspector
- Metadata tag display
- Provider/source labeling
- Diagnostics function map
- Review action support if backend endpoint works
- Delete support with confirmation

Deferred:

- Bulk move between workspaces
- Full content editing if backend does not support safe patching
- Historical backfill UI for old metadata
- Multi-user auth
- Cloud deployment

## V1 Decisions

- Initialize this folder as a git repository during implementation so dashboard changes are trackable.
- Do not add a general memory content edit endpoint in v1. Content and metadata are read-only except for existing review actions and delete.
- Do not add one-click metadata backfill in v1. Show missing metadata clearly and keep backfill as an admin/manual workflow.
