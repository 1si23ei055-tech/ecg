import {
  subscribeRealtime,
  type RealtimeMessage,
} from "@/lib/realtime/bus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (message: RealtimeMessage) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(message)}\n\n`),
        );
      };

      send({
        type: "device_status",
        deviceId: "system",
        patientId: "system",
        battery: 0,
        connectionStatus: "Connected",
        ecgStatus: "Idle",
        lastSeen: Math.floor(Date.now() / 1000),
      });

      const unsubscribe = subscribeRealtime(send);

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
