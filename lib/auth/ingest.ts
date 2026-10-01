import { NextResponse } from "next/server";

export function verifyIngestRequest(request: Request): NextResponse | null {
  const expected = process.env.INGEST_API_KEY;
  if (!expected) {
    return null;
  }
  const key = request.headers.get("x-ingest-key");
  if (key !== expected) {
    return NextResponse.json({ error: "Invalid ingest key" }, { status: 401 });
  }
  return null;
}
