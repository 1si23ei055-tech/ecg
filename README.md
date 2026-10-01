# ECG Wearable Patch Dashboard

Web dashboard for ESP32 ECG patch monitoring: live waveform, rhythm change events, historical review, and patient/device status.

## Stack

- Next.js App Router (`app/`)
- Tailwind CSS v4
- MongoDB (Docker) + Mongoose
- Session auth (JWT cookie) + SSE realtime updates

## Quick start

```bash
docker compose up -d
cp .env.example .env.local
npm install
npm run dev
```

In another terminal:

```bash
npm run seed
npm run simulate
```

Open [http://localhost:4004/login](http://localhost:4004/login)

Demo login: `doctor@ecg.local` / `doctor123`

## Documentation

- [API reference](docs/API.md)
- [Knowledge base / architecture](docs/KNOWLEDGE_BASE.md)
- Requirements source: `ECG_Wearable_Patch_Dashboard_Developer_Work.md`

## Production notes

- Set strong `AUTH_SECRET` and `INGEST_API_KEY`.
- Terminate TLS at your reverse proxy (HTTPS required for production deployments).
- Replace synthetic event windows with firmware-provided samples when available.



----------

next js -> fronten (css tailwind css) backend

mongo db -> database