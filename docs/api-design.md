# API Design

## POST /api/generate

Creates a generated app project from a user prompt.

Request:

```json
{
  "prompt": "Build a habit tracker for remote teams",
  "mode": "llm"
}
```

`mode` supports:

- `mock`: deterministic local generator
- `llm`: real generation through the active provider (`AI_PROVIDER=deepseek` or `AI_PROVIDER=openai`)
- omitted: uses server default from `AI_PROVIDER`

Response:

```json
{
  "project": {
    "id": "uuid",
    "title": "Remote Team Habit Tracker",
    "prompt": "Build a habit tracker for remote teams",
    "status": "ready",
    "agentSteps": [],
    "blueprint": {},
    "generatedCode": {}
  }
}
```

## POST /api/generate-stream

Streams generation progress as Server-Sent Events (SSE), including staged agent transitions.
Request body is the same as `/api/generate`, including optional `mode`.

Event sequence:

- `generation_started`
- repeated `step_update`
- `generation_complete`
- `done`

## GET /api/projects

Returns generated projects, newest first.

## POST /api/projects

Stores a project payload. Useful for replay/import flows or external generators.

## GET /api/projects/:id

Returns one project by id.

## PATCH /api/projects/:id

Updates project fields such as status, title, blueprint, or generated code.

## DELETE /api/projects/:id

Deletes a project from the current persistence adapter.

## GET /api/health

Returns app health and the active generation/persistence mode.
