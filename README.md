# Atoms Lite Demo

An AI-native app builder prototype for the ROOT full-stack challenge. The demo focuses on a complete, testable product loop: a user describes an app idea, a simulated multi-agent workflow turns it into an app blueprint, and the result is shown as a visual preview with generated code and saved history.

## Planned Stack

- Next.js App Router, React, TypeScript
- Route Handlers for backend API contracts
- Supabase/Postgres schema for production persistence
- Dual generation providers: deterministic mock and real DeepSeek/OpenAI LLM
- Vercel deployment target

## Product Scope

- Builder page: prompt input, agent timeline, generated app preview, generated code panel
- Projects page: generated project history
- Project details page: shareable route `/projects/[id]`
- API routes: generation, project list, project detail, health check
- Database design: projects, agent runs, artifacts, feedback

## Local Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Database Setup (Supabase)

1. Create a Supabase project.
2. Run the SQL in `supabase/schema.sql` in the SQL editor.
3. Set environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Supabase is required now. If these variables are missing, API routes fail and `/api/health` returns `ok: false`.

## AI Setup (DeepSeek)

Set server environment variables:

```bash
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat
```

`AI_PROVIDER` values:

- `auto`: use real AI when key exists, otherwise mock
- `deepseek`: force DeepSeek real AI
- `openai`: force OpenAI real AI
- `mock`: force mock generation

## Real DB Test Flow

1. Start app:

```bash
npm run dev
```

2. In another terminal run:

```bash
npm run test:real-db
```

3. Optional if your app is not on port 3000:

```bash
TEST_BASE_URL=http://127.0.0.1:3001 npm run test:real-db
```

Detailed cases are documented in `docs/real-db-test-cases.md`.

## Real AI Test Flow

1. Start app:

```bash
npm run dev
```

2. Run:

```bash
npm run test:real-ai
```

The script validates `mode=llm`, project persistence, and cleanup.
