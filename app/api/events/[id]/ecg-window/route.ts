import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { EventEcgWindow } from "@/lib/db/models";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  await connectDb();

  const window = await EventEcgWindow.findOne({ eventId: id }).lean();
  if (!window) {
    return NextResponse.json({ error: "Event window not found" }, { status: 404 });
  }

  return NextResponse.json({
    eventId: window.eventId,
    deviceId: window.deviceId,
    patientId: window.patientId,
    samplingRate: window.samplingRate,
    preSeconds: window.preSeconds,
    postSeconds: window.postSeconds,
    changePointIndex: window.changePointIndex,
    preEventSamples: window.preEventSamples,
    postEventSamples: window.postEventSamples,
  });
}
