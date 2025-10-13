import { NextResponse } from "next/server";

const telemetryBuffer: Array<{ event: string; timestamp: number }> = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    telemetryBuffer.push({ event: JSON.stringify(body).slice(0, 1024), timestamp: Date.now() });
    if (telemetryBuffer.length > 200) {
      telemetryBuffer.shift();
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Telemetry payload invalid" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ sample: telemetryBuffer.slice(-10) });
}
