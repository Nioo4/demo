# Feasibility Notes

## What Is Feasible In 6-8 Hours

- Build a polished Next.js prototype with a complete prompt-to-preview loop.
- Ship both deterministic mock and real LLM generation behind one API contract.
- Provide a clear Supabase schema and API contracts.
- Deploy to Vercel from GitHub.

## Main Risks

- Real LLM generation can be blocked by API key, quota, latency, or prompt quality.
- Supabase setup adds account and environment-variable work.
- Full code execution or sandboxed preview would increase complexity beyond the time box.

## Recommended Delivery Strategy

1. Keep deterministic mock mode available as reliability fallback.
2. Use real LLM mode for demo quality and richer generation content.
3. Validate database writes and reads with automated endpoint tests.
4. Validate real-AI generation path with a dedicated integration script.
