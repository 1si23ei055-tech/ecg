import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true },
    role: { type: String, enum: ["doctor", "admin"], default: "doctor" },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User: Model<UserDocument> =
  mongoose.models.User ?? mongoose.model<UserDocument>("User", UserSchema);

const PatientSchema = new Schema(
  {
    patientId: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    deviceId: { type: String, required: true },
  },
  { timestamps: true },
);

export type PatientDocument = InferSchemaType<typeof PatientSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Patient: Model<PatientDocument> =
  mongoose.models.Patient ??
  mongoose.model<PatientDocument>("Patient", PatientSchema);

const DeviceSchema = new Schema(
  {
    deviceId: { type: String, required: true, unique: true },
    patientId: { type: String, required: true },
    batteryLevel: { type: Number, default: 0 },
    connectionStatus: {
      type: String,
      enum: ["Connected", "Disconnected"],
      default: "Disconnected",
    },
    ecgStatus: {
      type: String,
      enum: ["Receiving", "Idle", "Stopped"],
      default: "Idle",
    },
    lastSeen: { type: Date },
    firmwareVersion: { type: String, default: "1.0.0" },
    samplingRate: { type: Number, default: 250 },
    lastSequenceNumber: { type: Number, default: -1 },
  },
  { timestamps: true },
);

export type DeviceDocument = InferSchemaType<typeof DeviceSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Device: Model<DeviceDocument> =
  mongoose.models.Device ??
  mongoose.model<DeviceDocument>("Device", DeviceSchema);

const EcgRecordSchema = new Schema(
  {
    deviceId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    samplingRate: { type: Number, required: true },
    sequenceNumber: { type: Number, required: true },
    samples: { type: [Number], required: true },
    batteryLevel: { type: Number },
    storageTier: {
      type: String,
      enum: ["normal", "event_window"],
      default: "normal",
    },
  },
  { timestamps: true },
);

EcgRecordSchema.index({ deviceId: 1, timestamp: 1 });
EcgRecordSchema.index({ patientId: 1, timestamp: 1 });

export type EcgRecordDocument = InferSchemaType<typeof EcgRecordSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const EcgRecord: Model<EcgRecordDocument> =
  mongoose.models.EcgRecord ??
  mongoose.model<EcgRecordDocument>("EcgRecord", EcgRecordSchema);

const RhythmEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    deviceId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    type: { type: String, default: "Rhythm Change" },
    algorithmScore: { type: Number, required: true },
    signalQuality: { type: String, required: true },
  },
  { timestamps: true },
);

export type RhythmEventDocument = InferSchemaType<typeof RhythmEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const RhythmEvent: Model<RhythmEventDocument> =
  mongoose.models.RhythmEvent ??
  mongoose.model<RhythmEventDocument>("RhythmEvent", RhythmEventSchema);

const EventEcgWindowSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    deviceId: { type: String, required: true },
    patientId: { type: String, required: true },
    samplingRate: { type: Number, required: true },
    preEventSamples: { type: [Number], required: true },
    postEventSamples: { type: [Number], required: true },
    changePointIndex: { type: Number, required: true },
    preSeconds: { type: Number, default: 10 },
    postSeconds: { type: Number, default: 10 },
  },
  { timestamps: true },
);

export type EventEcgWindowDocument = InferSchemaType<
  typeof EventEcgWindowSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const EventEcgWindow: Model<EventEcgWindowDocument> =
  mongoose.models.EventEcgWindow ??
  mongoose.model<EventEcgWindowDocument>(
    "EventEcgWindow",
    EventEcgWindowSchema,
  );
