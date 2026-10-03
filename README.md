# Aetherius

Aetherius is an executable game-system platform built around a data-driven Godot UMS runtime.

## Current vertical slice

- Godot 4.x 3D world with orthographic 2.5D camera
- executable Trigger -> Condition -> Action Game IR
- runtime JSON loading and validation
- illustration-oriented 2D-style shader applied to 3D presentation
- ancient-gate encounter driven by UMS rules
- GitHub Actions Godot Web build, smoke validation and artifact publishing
- optional Vercel deployment of the verified Web artifact

The old implementation remains preserved on `legacy/main-v1`.

## Architecture

See `docs/ums-engine-architecture.md` for the structured UMS/Game IR architecture and `docs/web-build.md` for the Web/Vercel delivery pipeline.

## Local run

Open the repository in Godot 4.x and run `scenes/main.tscn`.

Controls: WASD/arrows move, Q zooms in, E zooms out.
