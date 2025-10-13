import { NextResponse } from "next/server";
import { performance } from "perf_hooks";
import { z } from "zod";
import { DEFAULT_ROUTE_ID, getRouteById } from "../../../lib/router";
import type { ChatMessage } from "../../../lib/models/openai";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1),
  route: z.string().optional(),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = requestSchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json(
      {
        error: "Invalid request format",
        issues: result.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { messages, route: routeId = DEFAULT_ROUTE_ID } = result.data;
  const modelRoute = getRouteById(routeId);

  if (modelRoute.provider === "openai" && !process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error: "OPENAI_API_KEY is not configured",
        missingKeys: ["OPENAI_API_KEY"],
      },
      { status: 503 }
    );
  }

  try {
    const start = performance.now();
    const stream = await modelRoute.call(messages as ChatMessage[]);
    const latencyMs = Math.max(0, Math.round(performance.now() - start));

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Model-Provider": modelRoute.provider,
        "X-Model-Id": modelRoute.id,
        "X-Model-Label": modelRoute.label,
        "X-Latency": String(latencyMs),
      },
    });
  } catch (error) {
    const description = error instanceof Error ? error.message : "Unknown error";
    const status = description.includes("OPENAI_API_KEY") ? 503 : 502;
    return NextResponse.json(
      {
        error: "Failed to stream completion",
        detail: description,
      },
      { status }
    );
  }
}
