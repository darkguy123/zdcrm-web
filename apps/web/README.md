# apps/web (migration target)

The current Next.js app still lives at repository root for safe incremental migration.

Planned move in Phase 1:
1. Move app, components, contexts, hooks, and frontend configs into apps/web.
2. Keep route behavior unchanged during move.
3. Switch root scripts to workspace-only commands after verification.
