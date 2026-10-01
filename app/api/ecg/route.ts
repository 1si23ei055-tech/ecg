import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyIngestRequest } from "@/lib/auth/ingest";
import { ecgIngestBodySchema, parseEcgLine } from "@/lib/ecg/packet";
import { normalizeIngestDeviceId } from "@/lib/ecg/device-id";
import { ingestEcgPacket } from "@/lib/services/ecg-ingest";

export async function POST(request: Request) {
  const denied = verifyIngestRequest(request);
  if (denied) return denied;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let body;

    if (contentType.includes("text/plain")) {
      const line = (await request.text()).trim();
      const parsed = parseEcgLine(line);
      if (!parsed) {
        return NextResponse.json({ error: "Invalid ECG line" }, { status: 400 });
      }
      body = ecgIngestBodySchema.parse(parsed);
    } else {
      body = ecgIngestBodySchema.parse(await request.json());
    }

    body = normalizeIngestDeviceId(body);

    const result = await ingestEcgPacket(body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", details: error.flatten() },
        { status: 400 },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Ingest failed" }, { status: 500 });
  }
}
