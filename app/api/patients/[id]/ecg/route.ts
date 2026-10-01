import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { EcgRecord, Patient } from "@/lib/db/models";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Math.min(Number(searchParams.get("limit") ?? 500), 2000);

  await connectDb();

  const patient = await Patient.findOne({
    $or: [{ patientId: id }, { _id: id }],
  }).lean();

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const query: Record<string, unknown> = { patientId: patient.patientId };
  if (from || to) {
    query.timestamp = {};
    if (from) (query.timestamp as Record<string, Date>).$gte = new Date(from);
    if (to) (query.timestamp as Record<string, Date>).$lte = new Date(to);
  }

  const records = await EcgRecord.find(query)
    .sort({ timestamp: 1 })
    .limit(limit)
    .lean();

  const points = records.flatMap((record) =>
    record.samples.map((sample, index) => ({
      t:
        record.timestamp.getTime() / 1000 +
        index / record.samplingRate,
      v: sample,
      sequenceNumber: record.sequenceNumber,
      deviceId: record.deviceId,
    })),
  );

  return NextResponse.json({
    patientId: patient.patientId,
    deviceId: patient.deviceId,
    samplingRate: records.at(-1)?.samplingRate ?? 250,
    points,
    recordCount: records.length,
  });
}
