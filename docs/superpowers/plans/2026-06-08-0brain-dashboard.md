# 0Brain Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local operational dashboard for viewing, searching, inspecting, reviewing, and deleting 0Brain memories across Hermes and OpenClaw agent workspaces.

**Architecture:** A Vite React frontend talks only to a local Express API proxy. The proxy reads the 0Brain key from `.env.local`, environment variables, or the local Hermes `.env`, then calls the shared OB1 Supabase Edge Function. The frontend provides an operations console with agent overview, memory browser, semantic recall tester, detail inspector, and backend diagnostics.

**Tech Stack:** Vite, React, TypeScript, Express, Vitest, Testing Library, Playwright.

---

### Task 1: Project Scaffold and Secret-Safe Proxy

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `server/index.ts`
- Create: `server/config.ts`
- Create: `server/ob1Client.ts`
- Test: `server/ob1Client.test.ts`

- [ ] Initialize git in `C:\Users\kango\OneDrive\Desktop\0brain dash`.
- [ ] Install dependencies: `vite`, `react`, `react-dom`, `typescript`, `tsx`, `express`, `dotenv`, `concurrently`, `@vitejs/plugin-react`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `playwright`.
- [ ] Add scripts:
  - `dev`: run API proxy and Vite together.
  - `test`: run Vitest.
  - `build`: type-check and build frontend.
- [ ] Implement `server/config.ts` so it loads `OBRAIN_API_KEY` and `OBRAIN_API_BASE` from `.env.local`, process env, or `\\wsl.localhost\Ubuntu\root\.hermes\.env`.
- [ ] Implement `server/ob1Client.ts` with typed methods for `/health`, `/stats`, `/memories`, `/memories/:id`, `/recall`, `/recall-traces/:id`, `/memories/review`, `/memories/:id/review`, and `/delete`.
- [ ] Implement `server/index.ts` Express routes under `/api/ob1/*`.
- [ ] Test that the client builds URLs correctly and never returns the API key.

### Task 2: Shared Types and Data Model

**Files:**
- Create: `src/types.ts`
- Create: `src/agents.ts`
- Test: `src/agents.test.ts`

- [ ] Define known agents:
  - Sam: `agent-sam`, Hermes, `hermes-0brain-memory`
  - Tank: `agent-tank`, Hermes, `hermes-0brain-memory`
  - Dean: `agent-dean`, OpenClaw, `ob1-agent-memory`
  - Cass: `agent-cass`, OpenClaw, `ob1-agent-memory`
  - Crowley: `agent-crowley`, OpenClaw, `ob1-agent-memory`
  - Bobby: `agent-bobby`, OpenClaw, `ob1-agent-memory`
  - Agent Main: `agent-main`, Unknown/Suspect, fallback bucket
- [ ] Define memory, stats, recall result, review action, and diagnostics types.
- [ ] Add tests for provider labels and warning labels.

### Task 3: API Hooks

**Files:**
- Create: `src/api.ts`
- Create: `src/hooks.ts`
- Test: `src/api.test.ts`

- [ ] Implement frontend fetch wrappers for `/api/ob1/*`.
- [ ] Implement hooks:
  - `useAgentStats`
  - `useMemories`
  - `useMemoryDetail`
  - `useRecall`
  - `useDiagnostics`
- [ ] Add loading/error states and request cancellation via `AbortController`.
- [ ] Test URL/query construction and error handling.

### Task 4: Operations Console UI

**Files:**
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `src/styles.css`
- Create: `src/components/AgentSidebar.tsx`
- Create: `src/components/MemoryTable.tsx`
- Create: `src/components/MemoryDetail.tsx`
- Create: `src/components/SearchPanel.tsx`
- Create: `src/components/DiagnosticsPanel.tsx`
- Create: `src/components/Tabs.tsx`
- Test: `src/App.test.tsx`

- [ ] Build a dense app shell with left agent sidebar, center table/search, and right detail inspector.
- [ ] Add tabs for `Memories`, `Semantic Recall`, `Diagnostics`, and `Review Queue`.
- [ ] Show provider family and warning badges for `agent-main`, empty expected agents, and unknown workspaces.
- [ ] Show metadata sections: people, topics, type, action items, dates, raw JSON.
- [ ] Test rendering of agents and tab switching.

### Task 5: Actions and Safety

**Files:**
- Modify: `src/components/MemoryDetail.tsx`
- Modify: `src/api.ts`
- Modify: `server/index.ts`
- Test: `src/actions.test.ts`

- [ ] Add delete action with confirmation text matching memory ID.
- [ ] Add review actions: confirm, reject, stale, restrict scope, evidence-only.
- [ ] Keep content and metadata read-only in v1.
- [ ] Refresh memory lists after successful action.
- [ ] Test that delete requires exact confirmation.

### Task 6: Diagnostics and Function Map

**Files:**
- Modify: `src/components/DiagnosticsPanel.tsx`
- Create: `src/functionMap.ts`
- Test: `src/functionMap.test.ts`

- [ ] Add cards for `/health`, `/stats`, `/memories`, `/recall`, `/writeback`, `/delete`, `/memories/review`, `/memories/:id/review`, `/recall-traces/:id`, `/admin/reembed`.
- [ ] Label each function as Hermes-used, OpenClaw-used, shared, or admin-only.
- [ ] Add live checks for safe endpoints.
- [ ] Keep writeback/delete tests manual and temporary-workspace only.

### Task 7: Verification

**Files:**
- Create: `tests/dashboard-smoke.spec.ts`

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Start `npm run dev`.
- [ ] Use Playwright to load the dashboard, verify counts render, agent switching works, semantic recall returns results, and detail panel shows metadata.
- [ ] Verify no API key appears in frontend bundle or rendered DOM.
