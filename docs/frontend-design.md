# Frontend Design

The UI is designed around a command-center feeling rather than a static clone of Atoms.

## Pages

- `/`: product overview, evaluation fit, and entry points.
- `/builder`: main app generation workflow.
- `/projects`: generated project history and saved artifacts.

## Builder Flow

1. User writes an app idea.
2. Planner agent extracts product intent and scope.
3. UX agent creates screens and interaction model.
4. Code agent generates component snippets.
5. QA agent reports viability, risks, and next steps.
6. The app renders a visual preview and a code panel.

## Design Direction

- Dense but readable dashboard layout.
- Warm dark canvas with amber and green accents.
- Animated-feeling timeline via CSS states, without relying on heavy animation libraries.
- Mobile-first stacking so the demo remains usable during review.
