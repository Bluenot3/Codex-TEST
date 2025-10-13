import { NextRequest, NextResponse } from "next/server";
import { SERVER_PROXY_FLAG } from "../../../lib/constants";

export async function POST(req: NextRequest) {
  if (SERVER_PROXY_FLAG !== "enabled") {
    return NextResponse.json(
      {
        error: "SERVER_PROXY disabled. Calls should be made directly from the client with the user's API key.",
      },
      { status: 501 }
    );
  }

  const providerKey = process.env.SERVER_PROVIDER_KEY;
  if (!providerKey) {
    return NextResponse.json(
      { error: "SERVER_PROVIDER_KEY missing. Configure server secret or disable proxy." },
      { status: 501 }
    );
  }

  try {
    const payload = await req.json();
    if (!payload?.url || !payload?.method) {
      return NextResponse.json({ error: "Proxy requires url and method." }, { status: 400 });
    }
    const { url, method, headers = {}, body } = payload as {
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: unknown;
    };
    const sanitizedHeaders = Object.fromEntries(
      Object.entries(headers).filter(([key]) => !key.toLowerCase().includes("authorization"))
    );
    sanitizedHeaders["Authorization"] = `Bearer ${providerKey}`;
    const response = await fetch(url, {
      method,
      headers: sanitizedHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    return NextResponse.json({ error: "Proxy invocation failed." }, { status: 500 });
  }
}
