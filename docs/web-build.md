# Godot Web build on Vercel

The repository uses `Dockerfile.vercel` as the Vercel build/runtime entrypoint.

Pipeline:

1. Vercel receives a Git commit.
2. The container build downloads pinned Godot 4.7.2 and its official export templates.
3. Godot imports the project headlessly.
4. The `Web` export preset produces `build/web/index.html` and WebAssembly assets.
5. The final minimal container serves the exported game over HTTP on `$PORT`.
6. Each Git push can therefore produce a Vercel preview deployment.

The project uses Godot's Compatibility renderer as the Web baseline.

This is intentionally a build-and-preview loop. The generated Web files are build artifacts and are not committed to Git.
