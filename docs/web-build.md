# Godot Web build and Vercel preview

GitHub Actions is the canonical build runner. Every main push and pull request validates the Game IR, installs pinned Godot 4.7.2 and official Web export templates, imports the project, exports `build/web`, smoke-checks HTML/WASM and uploads the `aetherius-web` artifact.

On pushes to `main`, the same workflow can publish the already-verified static Web build to Vercel.

## Required GitHub repository secrets

Configure these three Actions secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

If they are absent, CI still succeeds and uploads the Web artifact; only the Vercel deployment step is skipped with a notice. Secrets are never committed to the repository.

The deployment step writes a temporary `.vercel/project.json` inside the CI runner and runs Vercel CLI against `build/web`. Vercel therefore hosts the exact Godot Web output that passed CI rather than compiling the Godot project itself.
