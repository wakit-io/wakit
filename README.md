# Hybrid UI Framework - Build Guide

## Commands

- npm run dev: Start a local server (default template is blog). Use `--env template=<name>` or scripts below.
- npm run dev:blog | dev:shop | dev:reserve
- npm run build:blog | build:shop | build:reserve
- npm run build: Produce `dist/` (defaults to blog) with only `wakit/` and selected `templates/<name>/`.
- npm run preview: Serve the built `dist/` for quick verification.

## Output Layout (dist/)

- wakit/** (as-is)
- templates/blog/** (as-is)

Open `dist/templates/blog/index.html` in a browser or via `npm run preview`.
