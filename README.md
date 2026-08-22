# AI Decision Coach

A React + TypeScript prototype for a six-step, human-led decision reflection journey. Milestone 2 uses OpenAI for the initial brain-dump interpretation; the later synthesis and reflection steps intentionally remain mock-driven.

## Run locally

```bash
npm install
nano .env.local
npm run dev
```

Add the following to `.env.local` (substitute your own key and never commit this file):

```dotenv
OPENAI_API_KEY=your_openai_api_key_here
```

Then open the local URL printed by Vite. Vite serves both the React app and the local
`POST /api/interpret` server endpoint. The endpoint reads `OPENAI_API_KEY` server-side;
the key is deliberately not prefixed with `VITE_` and is never included in the browser
bundle. Use `npm run build` to typecheck and create a production build, and
`npm run preview` to preview that build with the same local API middleware.

The OpenAI model is configured in `server/interpretation.ts`, while the neutral
facilitator instructions live separately in `server/aiInstructions.ts`. Only the
Screen 1 → Screen 2 interpretation calls OpenAI. This lightweight Vite middleware is
intended for local prototype development, not as a production hosting architecture.
