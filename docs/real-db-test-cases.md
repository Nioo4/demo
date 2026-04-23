# Real DB Test Cases

## Preconditions

- Supabase schema has been applied from `supabase/schema.sql`.
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.
- App is running (`npm run dev` or `npm run start`).

## Automated Case Set

Run:

```bash
npm run test:real-db
```

This script verifies:

1. `GET /api/health` returns `ok=true` and `persistence="supabase"`.
2. `POST /api/generate` creates a project and returns `project.id`.
3. `GET /api/projects/:id` returns the same project.
4. `GET /api/projects` includes the project in list results.
5. `PATCH /api/projects/:id` updates a field (`status`).
6. `DELETE /api/projects/:id` removes the record.
7. `GET /api/projects/:id` returns `404` after delete.

## Manual Cases

### Case A: Builder write path

- Go to `/builder`.
- Generate a project.
- Confirm it appears in `/projects`.
- Open `/projects/:id` and verify timeline + preview data.

Expected:

- Data survives page refresh and server restart.
- The same project id is available from API and UI detail page.

### Case B: Stream + persistence

- Trigger generation from `/builder`.
- Wait for all stream stages to complete.
- Open `/api/projects` and verify the new project has persisted `agent_steps` content.

Expected:

- Agent timeline transitions in UI.
- Stored project includes all final step outputs.

### Case C: Misconfiguration guard

- Temporarily remove `SUPABASE_SERVICE_ROLE_KEY`.
- Call `/api/health` and `/api/projects`.

Expected:

- `/api/health` shows `ok=false`.
- `/api/projects` returns `500` with configuration error message.
