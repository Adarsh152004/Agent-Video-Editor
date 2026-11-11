# Agent Video Editor: app

The local web app for this workspace. It is one Node.js process that:

- serves a React UI;
- starts the configured agent CLI as a child process and streams its progress over Server-Sent Events;
- watches `edit/<project>/` for files the agent writes;
- serves large local MP4s to the browser with HTTP Range requests.

It listens only on `127.0.0.1`, and every request needs the token from the printed link. For the
first-time setup, see the [workspace README](../README.md).

## Commands

Requires Node.js 22 or later. Run every command from `app/`.

```sh
npm ci
npm run dev     # one process: the node:http server with Vite in middleware mode (HMR on the same port)
npm run build   # type-checks, builds the client to dist/client and the server to dist/server
npm start       # runs the built server from dist/
npm test        # check-tokens.mjs, then Vitest
```

The server uses port 4317, or the next free port. It prints the link with its access token and opens
it in your default browser. Add `--no-open` to skip opening it, for example `npm start -- --no-open`.

Settings are stored in `~/.agent-video-editor/settings.json`:

| Field | Meaning |
|---|---|
| `workspace` | this repository's folder |
| `agent` | `claude`, `codex` or `kimi` |
| `agentPath` | path to that CLI |
| `model` | empty uses the agent's default |
| `python` | the workspace's `.venv` interpreter (`.venv\Scripts\python.exe` on Windows, `.venv/bin/python` on macOS/Linux) |

You can change them in the app's Settings.

The dev-only route `/#/gallery` shows every UI primitive in every state.

## Layout

- `src/client`: the React UI.
  - `design/` holds the tokens.
  - `components/ui/` holds the primitives.
  - `data/themes.ts` holds the video themes.
- `src/server`: the `node:http` server, router, job runner, agent invocation, file and media serving.
- `src/shared`: types used by both.
- `scripts/check-tokens.mjs`: the token rule, run by `npm test`.
- `test/`: Vitest tests.

The app has no runtime dependencies besides `react` and `react-dom`.

## The token rule

`src/client/design/tokens.ts` is the single source of truth for every colour, font, size, spacing,
radius, border, shadow, duration and z-index. At startup, `applyTokens()` writes each value to `:root`
as a CSS custom property:

- `color.surfaceRaised` becomes `--color-surface-raised`;
- `space[4]` becomes `--space-4: 16px`.

CSS uses `var(--...)`. TypeScript that needs a number imports `tokens` directly.

`npm test` fails if any file under `src/client` contains one of these:

- a hex, `rgb()`, `rgba()` or `hsl()` colour;
- a font name, or a literal `font-family`;
- a CSS gradient;
- a pixel size or a duration.

Two files are exempt: `tokens.ts`, and `src/client/data/themes.ts`, which holds the video themes'
swatch colours. When you need a new value, add it to `tokens.ts`. When the OS asks for reduced motion,
every duration token becomes `0ms`.

## Design

- **Surfaces:** a light interface with flat pastel tints, no gradients or blur. Hierarchy comes from
  surface steps, hairline borders and type weight.
- **Accent:** one green, `#5f8b3e`. White text on it is only about 4.0:1, so text on the accent is
  near-black `#141414` (about 4.6:1). `test/contrast.test.ts` checks every text pair against 4.5:1.
- **Font:** Plus Jakarta Sans, self-hosted from `src/client/public/fonts` (latin subset, weights 400
  to 800, SIL Open Font License), so the app works offline.
- **Theme samples:** each theme in the new-edit flow has a local, silent 15-second animated SVG
  sample. These are illustrative style previews, not exports from the editing engine.
