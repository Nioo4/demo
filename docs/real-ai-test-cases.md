# Real AI Test Cases

## Preconditions

- Supabase schema has been applied from `supabase/schema.sql`.
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.
- `AI_PROVIDER=deepseek` and `DEEPSEEK_API_KEY` are set (or another supported provider is configured).
- App is running (`npm run dev` or `npm run start`).

## Automated Case Set

Run:

```bash
npm run test:real-ai
```

This script verifies:

1. `GET /api/health` reports `ok=true`, `persistence="supabase"`, and `llmConfigured=true`.
2. `POST /api/generate` with `mode="llm"` returns a valid generated project.
3. Project has complete agent steps, screens, and generated code files.
4. `GET /api/projects/:id` can read the persisted record.
5. `DELETE /api/projects/:id` cleans up test data.

## Manual Case

- Open `/builder`.
- Switch mode to `Real AI`.
- Submit a prompt with clear audience + workflow.
- Verify timeline stages run, then project appears in `/projects` and `/projects/:id`.

Expected:

- Content differs by prompt and is not deterministic.
- Data remains available after refresh.
