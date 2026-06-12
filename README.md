# 0Brain Dashboard

Local operations console for the shared 0Brain / OB1 memory backend.

It lets you inspect the real memory state for Hermes and OpenClaw agents, search each agent workspace semantically, inspect extracted metadata, edit memory summary/content, and run safe diagnostics against the live backend.

## Run

```powershell
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

The API proxy runs on:

```text
http://127.0.0.1:8787
```

## Configuration

Create `.env.local`, or let the proxy read the local Hermes env file at:

```text
\\wsl.localhost\Ubuntu\root\.hermes\.env
```

Required:

```text
OBRAIN_API_KEY=...
OBRAIN_API_BASE=https://guvkubaqeojncfwnnccf.supabase.co/functions/v1/agent-memory-api
```

The browser never receives the key. All OB1 calls go through the local Express proxy.

## Agents

The dashboard currently knows these workspaces:

- Sam: `agent-sam`, Hermes, `hermes-0brain-memory`
- Tank: `agent-tank`, Hermes, `hermes-0brain-memory`
- Dean: `agent-dean`, OpenClaw, `ob1-agent-memory`
- Cass: `agent-cass`, OpenClaw, `ob1-agent-memory`
- Crowley: `agent-crowley`, OpenClaw, `ob1-agent-memory`
- Bobby: `agent-bobby`, OpenClaw, `ob1-agent-memory`
- `agent-main`: unknown/suspect fallback bucket

## Views

- `Memories`: latest memories for the selected workspace.
- `Semantic Recall`: sends a real `/recall` request for the selected workspace.
- `Diagnostics`: checks safe backend functions and labels which provider path uses each function.
- `Review Queue`: shows memories waiting for confirmation/review.
- `Memory Detail`: full content, workspace identity, review state, extracted metadata, and raw metadata JSON.

## Actions

The detail panel exposes live backend actions:

- Confirm
- Edit summary/content
- Evidence
- Reject
- Stale
- Restrict
- Delete

Edit and delete require typing the exact memory ID. Extracted metadata is read-only because the OB1 backend currently exposes a controlled content/summary edit action, not a free-form metadata update action.

## Verification

```powershell
npm test
npm run build
npm run test:e2e
```

`test:e2e` uses Playwright against the local dev server and live OB1 backend. It verifies dashboard load, live counts, agent switching, semantic recall, metadata detail visibility, and that secret names are not rendered in the page.



