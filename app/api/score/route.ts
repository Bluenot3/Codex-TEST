import { NextResponse } from "next/server";
import { evaluateChallenge } from "../../../lib/scoring/challenges";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { challengeId, submission } = body as {
      challengeId: string;
      submission: {
        output: string;
        cost: number;
        tokens: number;
        latencyMs: number;
        metadata?: Record<string, unknown>;
      };
    };

    if (!challengeId || !submission) {
      return NextResponse.json({ error: "Missing challenge payload" }, { status: 400 });
    }

    const result = evaluateChallenge(challengeId, submission);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: "Unable to evaluate challenge" }, { status: 500 });
  }
}
