import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { Device, Patient, RhythmEvent } from "@/lib/db/models";

export async function GET() {
  await connectDb();

  const patients = await Patient.find().sort({ patientId: 1 }).lean();
  const devices = await Device.find().lean();
  const deviceById = new Map(devices.map((d) => [d.deviceId, d]));

  const enriched = await Promise.all(
    patients.map(async (patient) => {
      const device = deviceById.get(patient.deviceId);
      const eventCount = await RhythmEvent.countDocuments({
        patientId: patient.patientId,
      });
      const recentEvents = await RhythmEvent.find({
        patientId: patient.patientId,
      })
        .sort({ timestamp: -1 })
        .limit(5)
        .lean();

      return {
        patientId: patient.patientId,
        displayName: patient.displayName,
        deviceId: patient.deviceId,
        device: device
          ? {
              batteryLevel: device.batteryLevel,
              connectionStatus: device.connectionStatus,
              ecgStatus: device.ecgStatus,
              lastSeen: device.lastSeen,
              firmwareVersion: device.firmwareVersion,
              samplingRate: device.samplingRate,
            }
          : null,
        eventCount,
        recentEvents: recentEvents.map((e) => ({
          eventId: e.eventId,
          timestamp: e.timestamp,
          type: e.type,
          algorithmScore: e.algorithmScore,
          signalQuality: e.signalQuality,
        })),
      };
    }),
  );

  return NextResponse.json({ patients: enriched });
}
