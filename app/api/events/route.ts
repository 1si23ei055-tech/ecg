import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { RhythmEvent } from "@/lib/db/models";
import { verifyIngestRequest } from "@/lib/auth/ingest";
import { ecgIngestBodySchema } from "@/lib/ecg/packet";
import { ingestEcgPacket } from "@/lib/services/ecg-ingest";

const eventPostSchema = z.object({
  deviceId: z.string(),
  patientId: z.string().optional(),
  timestamp: z.number().int().positive(),
  algorithmScore: z.number().min(0).max(1),
  signalQuality: z.string(),
  type: z.string().default("Rhythm Change"),
  samplingRate: z.number().int().positive().default(250),
  batteryLevel: z.number().optional(),
});

export async function GET(request: Request) {
  await connectDb();
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const deviceId = searchParams.get("deviceId");
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);

  const query: Record<string, string> = {};
  if (patientId) query.patientId = patientId;
  if (deviceId) query.deviceId = deviceId;

  const events = await RhythmEvent.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({
    events: events.map((e) => ({
      eventId: e.eventId,
      deviceId: e.deviceId,
      patientId: e.patientId,
      timestamp: e.timestamp,
      type: e.type,
      algorithmScore: e.algorithmScore,
      signalQuality: e.signalQuality,
    })),
  });
}

export async function POST(request: Request) {
  const denied = verifyIngestRequest(request);
  if (denied) return denied;

  try {
    const payload = eventPostSchema.parse(await request.json());
    const ingestBody = ecgIngestBodySchema.parse({
      deviceId: payload.deviceId,
      sequenceNumber: Math.floor(Date.now() / 1000),
      timestamp: payload.timestamp,
      samplingRate: payload.samplingRate,
      samples: [0],
      eventFlag: 1,
      changePointScore: payload.algorithmScore,
      signalQuality: payload.signalQuality,
      batteryLevel: payload.batteryLevel ?? 78,
    });

    const result = await ingestEcgPacket(ingestBody);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Event create failed" }, { status: 500 });
  }
}
