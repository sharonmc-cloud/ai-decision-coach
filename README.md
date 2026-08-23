# AI Decision Coach

A React + TypeScript prototype for a six-step, human-led decision reflection journey. Milestone 2 uses OpenAI for the initial brain-dump interpretation and the final synthesis. The fear and upside exploration screens remain deterministic and user-controlled.

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

The OpenAI model is configured in `server/interpretation.ts`, while both neutral
facilitator instruction sets live separately in `server/aiInstructions.ts`. Screen 1 →
Screen 2 performs the structured interpretation call. Continuing from Screen 5 sends
the current journey context to the structured synthesis endpoint before showing Screen
6. The example interpretation retained in `src/mockData.ts` is development reference
only and is replaced before Screen 2 in the normal flow.

## Deploy to Vercel

The production API routes are Vercel functions in `api/interpret.ts` and
`api/synthesize.ts`. They and the local Vite middleware are thin adapters around the
same handlers in `server/apiHandlers.ts`, so request validation, OpenAI behavior, and
safe public errors stay aligned between environments.

Import the repository into Vercel as a Vite project and add `OPENAI_API_KEY` in the
Vercel project's Environment Variables settings for each intended environment. Do not
prefix the variable with `VITE_`: it must remain available only to server functions.
Vercel will build the frontend into `dist` and deploy the files under `api` as the
same-origin `POST /api/interpret` and `POST /api/synthesize` functions.
