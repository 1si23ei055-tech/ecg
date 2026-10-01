"use client";

import { useEffect, useRef } from "react";
import type { RealtimeMessage } from "@/lib/realtime/bus";

export function useRealtimeStream(
  onMessage: (message: RealtimeMessage) => void,
): void {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    const source = new EventSource("/api/stream");
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RealtimeMessage;
        handlerRef.current(data);
      } catch {
        /* ignore malformed events */
      }
    };
    return () => source.close();
  }, []);
}
