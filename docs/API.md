# ECG Patch Monitor API

Base URL (development): `http://localhost:4004`

Authentication uses an HTTP-only session cookie (`ecg_session`) returned by `POST /api/login`. Protected routes require an active session.

Optional gateway ingest protection: set `INGEST_API_KEY` and send header `x-ingest-key`.

## Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/login` | POST | Public | Authenticate clinician user |
| `/api/logout` | POST | Session | Clear session |
| `/api/patients` | GET | Session | List patients with device metrics and recent events |
| `/api/patients/{id}/ecg` | GET | Session | Query historical ECG points (`from`, `to`, `limit`) |
| `/api/ecg` | POST | Ingest key* | Ingest ECG packet (JSON or plain text line) |
| `/api/events` | GET | Session | List rhythm change events |
| `/api/events` | POST | Ingest key* | Log rhythm change event (creates event window) |
| `/api/events/{id}/ecg-window` | GET | Session | Fetch pre/event/post ECG window |
| `/api/stream` | GET | Session | Server-Sent Events stream for live updates |
| `/api/seed` | POST | Public (dev only) | Seed demo user, patient, device, sample events |

\*If `INGEST_API_KEY` is unset in development, ingest endpoints accept requests without the header.

## Login

```bash
curl -c cookies.txt -X POST http://localhost:4004/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"doctor@ecg.local","password":"doctor123"}'
```

## Ingest JSON packet

```bash
curl -X POST http://localhost:4004/api/ecg \
  -H 'Content-Type: application/json' \
  -d '{
    "deviceId":"ECG_001",
    "sequenceNumber":10234,
    "timestamp":1726570937,
    "samplingRate":250,
    "samples":[0.12,0.15,0.11],
    "eventFlag":0,
    "changePointScore":0.82,
    "signalQuality":"GOOD",
    "batteryLevel":78
  }'
```

## Ingest ESP32 line format

```bash
curl -X POST http://localhost:4004/api/ecg \
  -H 'Content-Type: text/plain' \
  --data 'ECG_001, 10234, 1726570937, 250, SYNTH, 1, 0.82, GOOD, 78'
```

## Real-time stream (SSE)

```bash
curl -b cookies.txt -N http://localhost:4004/api/stream
```

Event types:

- `ecg` — live samples for waveform rendering
- `rhythm_event` — rhythm change notification payload
- `device_status` — battery / BLE / ECG status updates

## Database entities

- `User` — clinician login accounts
- `Patient` — patient ID, display name, linked device
- `Device` — battery, connection status, sampling rate, last sequence number
- `EcgRecord` — timestamped sample batches (`normal` or `event_window` tier)
- `RhythmEvent` — algorithm score, signal quality, event type
- `EventEcgWindow` — pre/event/post high-resolution segments
