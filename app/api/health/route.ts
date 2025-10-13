import { NextResponse } from "next/server";

const REQUIRED_KEYS = ["OPENAI_API_KEY"] as const;

type RequiredKey = (typeof REQUIRED_KEYS)[number];

function getMissingKeys(): RequiredKey[] {
  return REQUIRED_KEYS.filter((key) => !process.env[key]);
}

export async function GET() {
  const missingKeys = getMissingKeys();
  return NextResponse.json({
    ok: missingKeys.length === 0,
    missingKeys,
    timestamp: new Date().toISOString(),
  });
}
