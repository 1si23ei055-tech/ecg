export type RealtimeMessage =
  | {
      type: "ecg";
      deviceId: string;
      patientId: string;
      timestamp: number;
      samplingRate: number;
      sequenceNumber: number;
      samples: number[];
      battery: number;
      connectionStatus: string;
      ecgStatus: string;
    }
  | {
      type: "rhythm_event";
      eventId: string;
      deviceId: string;
      patientId: string;
      timestamp: number;
      score: number;
      signalQuality: string;
      message: string;
    }
  | {
      type: "device_status";
      deviceId: string;
      patientId: string;
      battery: number;
      connectionStatus: string;
      ecgStatus: string;
      lastSeen: number;
    };

type Listener = (message: RealtimeMessage) => void;

const listeners = new Set<Listener>();

export function subscribeRealtime(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishRealtime(message: RealtimeMessage): void {
  for (const listener of listeners) {
    listener(message);
  }
}
