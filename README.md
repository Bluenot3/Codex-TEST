# ZEN AI Command Deck

Production-grade orchestration surface for visible AI API usage, built with Next.js 14, TypeScript, and Tailwind CSS.

## Getting Started

```bash
pnpm install
pnpm dev
```

> Prefer `vercel dev` in multi-environment setups to mirror production as closely as possible.

## Deployment

This app targets Vercel. Ensure the required environment variables are configured for both Preview and Production deployments. Vercel automatically runs `vercel build` (Next.js `next build`).

| Variable | Scope | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | Server | Enables OpenAI chat completion streaming. |
| `NEXT_PUBLIC_APP_NAME` | Client | Overrides the visible app name. |
| `ANTHROPIC_API_KEY` | Server | Placeholder for Anthropic integration. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Server | Placeholder for Google Gemini integration. |

With no keys present the build succeeds; the UI will highlight missing configuration.

## Status

- ✅ Glassmorphic shell & layout
- ✅ Key gate health checks
- ✅ Streaming chat, router, telemetry overlay, presets, and export tooling

## Vercel Notes

1. Create a new project and link this repository.
2. Add environment variables under **Settings → Environment Variables**.
3. Trigger a Preview deployment to verify the health card displays `System Operational`.
