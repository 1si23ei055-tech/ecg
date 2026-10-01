import { randomUUID } from "crypto";
import { connectDb } from "@/lib/db/connect";
import {
  Device,
  EcgRecord,
  EventEcgWindow,
  Patient,
  RhythmEvent,
} from "@/lib/db/models";
import {
  generateSyntheticWindow,
  type EcgIngestBody,
} from "@/lib/ecg/packet";
import { normalizeIngestDeviceId } from "@/lib/ecg/device-id";
import { publishRealtime } from "@/lib/realtime/bus";

export type IngestResult = {
  ok: true;
  sequenceWarning?: string;
  eventId?: string;
};

export async function ingestEcgPacket(
  body: EcgIngestBody,
): Promise<IngestResult> {
  body = normalizeIngestDeviceId(body);
  await connectDb();

  const patient =
    (await Patient.findOne({ deviceId: body.deviceId })) ??
    (await Patient.findOne({ patientId: body.deviceId }));

  const patientId = patient?.patientId ?? "UNKNOWN";
  const ts = new Date(body.timestamp * 1000);

  const device = await Device.findOne({ deviceId: body.deviceId });
  let sequenceWarning: string | undefined;

  if (device && device.lastSequenceNumber >= 0) {
    const expected = device.lastSequenceNumber + 1;
    if (body.sequenceNumber < expected) {
      sequenceWarning = "duplicate_sequence";
    } else if (body.sequenceNumber > expected) {
      sequenceWarning = `missing_packets:${expected}-${body.sequenceNumber - 1}`;
    }
  }

  await EcgRecord.create({
    deviceId: body.deviceId,
    patientId,
    timestamp: ts,
    samplingRate: body.samplingRate,
    sequenceNumber: body.sequenceNumber,
    samples: body.samples,
    batteryLevel: body.batteryLevel,
    storageTier: "normal",
  });

  await Device.findOneAndUpdate(
    { deviceId: body.deviceId },
    {
      deviceId: body.deviceId,
      patientId,
      batteryLevel: body.batteryLevel ?? device?.batteryLevel ?? 0,
      connectionStatus: "Connected",
      ecgStatus: "Receiving",
      lastSeen: ts,
      samplingRate: body.samplingRate,
      lastSequenceNumber: body.sequenceNumber,
    },
    { upsert: true, returnDocument: 'after' },
  );

  publishRealtime({
    type: "ecg",
    deviceId: body.deviceId,
    patientId,
    timestamp: body.timestamp,
    samplingRate: body.samplingRate,
    sequenceNumber: body.sequenceNumber,
    samples: body.samples,
    battery: body.batteryLevel ?? 0,
    connectionStatus: "Connected",
    ecgStatus: "Receiving",
  });

  publishRealtime({
    type: "device_status",
    deviceId: body.deviceId,
    patientId,
    battery: body.batteryLevel ?? 0,
    connectionStatus: "Connected",
    ecgStatus: "Receiving",
    lastSeen: body.timestamp,
  });

  let eventId: string | undefined;

  if (body.eventFlag === 1) {
    eventId = await createRhythmEventFromIngest(body, patientId, ts);
  }

  return { ok: true, sequenceWarning, eventId };
}

async function createRhythmEventFromIngest(
  body: EcgIngestBody,
  patientId: string,
  ts: Date,
): Promise<string> {
  const eventId = `EVT-${randomUUID().slice(0, 8).toUpperCase()}`;
  const score = body.changePointScore ?? 0.5;
  const signalQuality = body.signalQuality ?? "GOOD";

  await RhythmEvent.create({
    eventId,
    deviceId: body.deviceId,
    patientId,
    timestamp: ts,
    type: "Rhythm Change",
    algorithmScore: score,
    signalQuality,
  });

  const window =
    body.preEventSamples?.length && body.postEventSamples?.length
      ? {
          preEventSamples: body.preEventSamples,
          postEventSamples: body.postEventSamples,
          changePointIndex:
            body.changePointIndex ?? body.preEventSamples.length,
        }
      : generateSyntheticWindow(body.samplingRate, 10, 10, 10);
  await EventEcgWindow.create({
    eventId,
    deviceId: body.deviceId,
    patientId,
    samplingRate: body.samplingRate,
    ...window,
  });

  await EcgRecord.create({
    deviceId: body.deviceId,
    patientId,
    timestamp: ts,
    samplingRate: body.samplingRate,
    sequenceNumber: body.sequenceNumber,
    samples: [...window.preEventSamples, ...window.postEventSamples],
    batteryLevel: body.batteryLevel,
    storageTier: "event_window",
  });

  publishRealtime({
    type: "rhythm_event",
    eventId,
    deviceId: body.deviceId,
    patientId,
    timestamp: Math.floor(ts.getTime() / 1000),
    score,
    signalQuality,
    message: "Rhythm Change Event Detected",
  });

  return eventId;
}
