# ECG Dashboard Knowledge Base

Use this document as the canonical product + engineering context for the ECG Wearable Patch dashboard.

## Product intent

- Display **live ECG** from ESP32/BLE gateway ingestion without manual refresh.
- Surface **Rhythm Change Events** (algorithm indications, never diagnoses).
- Persist patients, devices, ECG batches, events, and event windows in MongoDB.
- Support historical review with zoom/pan and jump-to-event navigation.

## Architecture

```text
ESP32 Patch -> BLE Gateway -> POST /api/ecg | /api/events
                                |
                                v
                         MongoDB (Docker)
                                |
                     SSE /api/stream + REST
                                |
                           Next.js App Router UI
```

## Conventions

- App Router under `app/`; route group `(dashboard)` for authenticated pages.
- Shared server logic in `lib/` (`db`, `auth`, `services`, `ecg`, `realtime`).
- Tailwind CSS v4 via `app/globals.css`.
- Session auth: JWT in HTTP-only cookie (`lib/auth/session.ts`).
- Real-time: in-process pub/sub (`lib/realtime/bus.ts`) + SSE (`app/api/stream/route.ts`).

## Terminology (required copy)

- Use **Rhythm Change Event** / **rhythm change indication**.
- Avoid diagnostic language (e.g., arrhythmia confirmed, AF detected).

## Demo data

- User: `doctor@ecg.local` / `doctor123` (seeded via `POST /api/seed` in dev)
- Patient: `P001`
- Device: `ECG_001`
- Sampling rate: 250 Hz
- Event window: ~10s pre + ~10s post (synthetic until firmware provides real windows)

## Local development

```bash
docker compose up -d
cp .env.example .env.local
npm install
npm run dev
npm run seed
npm run simulate
```

Open `http://localhost:4004/login`.

## Priority mapping (requirements doc)

| Priority | Implemented |
|---|---|
| P1 Backend, live graph, events, event visualization | Mongo models, ingest APIs, SSE, live + event pages |
| P2 History, device status, realtime, auth | History/patients pages, session middleware, SSE |
| P3 NFC, push/email, analytics | NFC deep link route `/device/[deviceId]`; notifications UI popup only |

## Out of scope (by design)

- On-device ECG filtering, R-peak detection, RR intervals, change-point algorithms on dashboard/server.

## Extension points

- Set `INGEST_API_KEY` for gateway authentication.
- Replace synthetic event windows with firmware-provided samples in ingest payload.
- Add email/push providers behind new workers without changing UI event contract.
