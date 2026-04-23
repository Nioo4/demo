# Database Design

The application now uses Supabase Postgres as the required persistence layer. API routes are database-only and do not include in-memory fallback.

## Tables

- `projects`: one generated app idea and its latest generated blueprint.
- `agent_runs`: ordered execution steps for planner, UX, code, and QA agents.
- `artifacts`: generated files, snippets, previews, and structured outputs.
- `feedback`: optional reviewer or user feedback for later iteration.

## Persistence Rules

- A project owns many agent runs and artifacts.
- The API returns project records with embedded agent steps and blueprint data.
- `blueprint` and `metadata` fields use JSONB to keep the early prototype flexible.
- Stable fields such as `title`, `prompt`, `status`, and timestamps remain relational for querying.

## Migration

See `supabase/schema.sql`.
