import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db/connect";
import {
  Device,
  EventEcgWindow,
  Patient,
  RhythmEvent,
  User,
} from "@/lib/db/models";
import {
  generateSyntheticWindow,
} from "@/lib/ecg/packet";

export async function seedDatabase(): Promise<{ message: string }> {
  await connectDb();

  const password = process.env.SEED_DEMO_PASSWORD ?? "doctor123";
  const passwordHash = await bcrypt.hash(password, 10);

  await User.findOneAndUpdate(
    { email: "doctor@ecg.local" },
    {
      email: "doctor@ecg.local",
      passwordHash,
      displayName: "Dr. Demo",
      role: "doctor",
    },
    { upsert: true, returnDocument: 'after' },
  );

  await Patient.findOneAndUpdate(
    { patientId: "P001" },
    {
      patientId: "P001",
      displayName: "Patient One",
      deviceId: "ECG_001",
    },
    { upsert: true, returnDocument: 'after' },
  );

  await Device.findOneAndUpdate(
    { deviceId: "ECG_001" },
    {
      deviceId: "ECG_001",
      patientId: "P001",
      batteryLevel: 78,
      connectionStatus: "Connected",
      ecgStatus: "Receiving",
      lastSeen: new Date(),
      firmwareVersion: "1.0.0",
      samplingRate: 250,
      lastSequenceNumber: 10200,
    },
    { upsert: true, returnDocument: 'after' },
  );

  const existingEvents = await RhythmEvent.countDocuments();
  if (existingEvents === 0) {
    const events = [
      {
        eventId: "EVT-001",
        deviceId: "ECG_001",
        patientId: "P001",
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        algorithmScore: 0.82,
        signalQuality: "GOOD",
      },
      {
        eventId: "EVT-002",
        deviceId: "ECG_001",
        patientId: "P001",
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        algorithmScore: 0.76,
        signalQuality: "GOOD",
      },
    ];

    for (const event of events) {
      await RhythmEvent.create(event);
      const window = generateSyntheticWindow(250, 10, 10, 10);
      await EventEcgWindow.create({
        eventId: event.eventId,
        deviceId: event.deviceId,
        patientId: event.patientId,
        samplingRate: 250,
        ...window,
      });
    }
  }

  return {
    message: `Seeded demo user doctor@ecg.local / ${password}, patient P001, device ECG_001`,
  };
}
