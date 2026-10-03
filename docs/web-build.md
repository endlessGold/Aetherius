# Godot Web CI

GitHub Actions is the canonical build runner for the Aetherius Web target.

Every push to main, pull request, or manual dispatch installs pinned Godot 4.7.2, imports the project headlessly, exports the Web preset, smoke-checks the result, and uploads it as the `aetherius-web` artifact.

Vercel should host a verified build rather than compile Godot itself. A deployment job can be attached later when a writable Vercel project scope is available.
