# DischargeGuard — Codebase Index

Quick reference for navigating the repo. All paths are relative to `DischargeGuard/`.

---

## Repo layout

```
DischargeGuard/
├── dashboard/          ← Next.js 15 frontend (deploys to Vercel)
├── agents/             ← Python ADK backend (deploys to Cloud Run)
├── demo/               ← Pre-recorded scenarios + audio for demo mode
├── scripts/            ← Utility / CI scripts
├── .env.example        ← All required env vars listed here
├── turbo.json          ← Turborepo config (optional monorepo task runner)
├── pyproject.toml      ← Root Python project config
├── requirements.txt    ← Root Python deps (shared)
├── README.md
└── INDEX.md            ← You are here
```

---

## dashboard/ — Next.js app

Entry point: `dashboard/app/layout.tsx`

```
dashboard/
├── app/
│   ├── layout.tsx                  ← Root layout, fonts, global providers
│   ├── page.tsx                    ← Landing page / demo selector
│   ├── dashboard/
│   │   └── page.tsx                ← Live call dashboard (main UI)
│   └── api/
│       ├── trigger-call/
│       │   └── route.ts            ← POST → starts agent pipeline on Cloud Run
│       └── call-stream/
│           └── route.ts            ← GET  → SSE proxy, relays agent events to browser
├── components/
│   ├── CallPanel.tsx               ← Audio waveform + live subtitles
│   ├── ChecklistPanel.tsx          ← Per-medication comprehension tracker
│   ├── AgentGraph.tsx              ← D3 force-directed graph of A2A agent comms
│   ├── AlertPanel.tsx              ← Escalation alerts (RED flags)
│   ├── SummaryCard.tsx             ← Post-call summary card
│   └── DemoSelector.tsx            ← Pick scenario: Maria / Wei / James
├── lib/
│   ├── useCallStream.ts            ← React hook — consumes SSE from /api/call-stream
│   └── types.ts                    ← Shared TypeScript types (events, scenarios, agents)
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

### Key data flow (frontend)

```
DemoSelector → POST /api/trigger-call
                        ↓
             Cloud Run orchestrator starts
                        ↓
             agents emit events → event_bus.py SSE
                        ↓
             GET /api/call-stream (SSE proxy)
                        ↓
             useCallStream hook → React state
                        ↓
   CallPanel  ChecklistPanel  AgentGraph  AlertPanel
```

---

## agents/ — Python ADK backend

Entry point: `agents/care_coordinator/__main__.py`

```
agents/
├── care_coordinator/
│   ├── __main__.py                 ← A2A server entry point, orchestrates sub-agents
│   └── agent.py                   ← LlmAgent definition + RemoteA2aAgent references
├── discharge_reader/
│   ├── __main__.py                 ← A2A server (port 8081)
│   └── agent.py                   ← Parses discharge instructions, extracts med list
├── comprehension_check/
│   ├── __main__.py                 ← A2A server (port 8082)
│   └── agent.py                   ← Scores patient comprehension per medication
├── escalation/
│   ├── __main__.py                 ← A2A server (port 8083)
│   └── agent.py                   ← Detects RED flags, triggers nurse alert
├── voice_coach/
│   ├── __main__.py                 ← A2A server (port 8084)
│   ├── agent.py                   ← Adapts language/pace for patient profile
│   └── elevenlabs_client.py       ← ElevenLabs API wrapper (TTS + conversational AI)
├── event_bus.py                    ← SSE endpoint; all agents push events here
├── start_all.sh                    ← Dev: launches all 5 agents locally (supervisord alt)
├── Dockerfile                      ← Single container, all agents on separate ports
├── pyproject.toml
└── requirements.txt
```

### Agent responsibilities

| Agent | Port | Responsibility |
|---|---|---|
| care_coordinator | 8080 | Orchestrator — routes tasks to sub-agents via A2A |
| discharge_reader | 8081 | Reads + structures discharge instructions |
| comprehension_check | 8082 | Scores patient understanding (GREEN / YELLOW / RED) |
| escalation | 8083 | Fires alerts when comprehension is RED or symptom is critical |
| voice_coach | 8084 | Controls ElevenLabs voice, language, pacing |

### A2A communication pattern

```
care_coordinator
    ├── → discharge_reader      (extract meds + instructions)
    ├── → comprehension_check   (score each med after patient response)
    ├── → escalation            (if score RED or critical symptom detected)
    └── → voice_coach           (adjust delivery based on patient profile)
```

All agents emit structured events to `event_bus.py` which streams them via SSE to the Next.js proxy.

---

## demo/ — Demo mode assets

```
demo/
├── scenarios/
│   ├── maria_garcia.json           ← Spanish-speaking, post-surgery patient
│   ├── wei_chen.json               ← Mandarin-speaking, headache escalation scenario
│   └── james_wilson.json           ← English-speaking, elderly patient
├── audio/
│   ├── maria_call.mp3              ← Pre-recorded call audio (generated via ElevenLabs)
│   ├── maria_events.json           ← Timed agent events synced to maria_call.mp3
│   └── wei_call.mp3                ← Pre-recorded call audio for Wei scenario
└── generate_audio.py               ← Script to regenerate audio via ElevenLabs API
```

Demo mode vs live mode is toggled in `DemoSelector.tsx`. In demo mode, audio plays from `demo/audio/` and events fire from the matching `*_events.json` file — no API calls needed.

---

## Environment variables

See `.env.example` for the full list. Key vars:

| Variable | Used by |
|---|---|
| `GOOGLE_CLOUD_PROJECT` | All ADK agents |
| `GOOGLE_APPLICATION_CREDENTIALS` | Cloud Run auth |
| `ELEVENLABS_API_KEY` | `voice_coach/elevenlabs_client.py` |
| `NEXT_PUBLIC_AGENTS_URL` | `dashboard/app/api/` routes |
| `GEMINI_MODEL` | All LlmAgent definitions (default: `gemini-2.0-flash`) |

---

## Where to start for common tasks

| Task | File |
|---|---|
| Change dashboard UI | `dashboard/app/dashboard/page.tsx` |
| Add a new agent event type | `dashboard/lib/types.ts` → `agents/event_bus.py` |
| Modify agent logic | `agents/<agent_name>/agent.py` |
| Add a demo scenario | `demo/scenarios/<name>.json` + `demo/audio/` |
| Update voice/language behavior | `agents/voice_coach/agent.py` + `elevenlabs_client.py` |
| Change escalation rules | `agents/escalation/agent.py` |
| Run all agents locally | `agents/start_all.sh` |
| Deploy frontend | Push to main → Vercel auto-deploys `dashboard/` |
| Deploy backend | `docker build` from `agents/Dockerfile` → Cloud Run |
