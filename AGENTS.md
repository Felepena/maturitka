# Repository Guidelines

## Project Structure & Module Organization
- App routes: `src/app` (Next.js App Router). Pages use `page.tsx`, shared layout in `layout.tsx`.
- API routes: `src/app/api/**/route.ts` (edge-style handlers).
- UI components: `src/app/components/**` (client/server components as needed).
- Auth/context: `src/app/contex/**`.
- Protected pages: `src/app/protected/**`.
- Styles: `src/app/globals.css` (Tailwind v4 via PostCSS).
- Static assets: `public/`.

## Build, Test, and Development Commands
- `npm run dev` – start Next.js dev server on `http://localhost:3000`.
- `npm run build` – production build.
- `npm start` – run the built app.
Notes: TypeScript is strict; path alias `@/*` maps to `src/*`.

## Coding Style & Naming Conventions
- Language: TypeScript + React 19, Next.js 15 (App Router).
- Indentation: 2 spaces; avoid trailing whitespace.
- Filenames: kebab-case for files (`user-menu.tsx`), directories map to routes.
- Components: prefer function components; colocate small helpers next to usage.
- Imports: use `@/` alias for internal modules; absolute before relative.
- Styling: Tailwind classes in JSX; keep `globals.css` minimal.

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Place tests near sources as `*.test.ts(x)` or under `src/__tests__`.
- Aim for coverage of API routes and critical UI flows.

## Commit & Pull Request Guidelines
- History is minimal and inconsistent; use clear, imperative messages (e.g., `add receipt save util`).
- Prefer Conventional Commits when possible (e.g., `feat:`, `fix:`, `chore:`).
- PRs should include: concise description, screenshots for UI changes, reproduction steps, and linked issues.

## Security & Configuration
- Local env: `.env.local` (not committed). Set `OPENAI_API_KEY` for AI routes.
- Firebase config is currently in code (`src/app/lib/config.tsx`); consider moving to env variables.
- Do not commit secrets or personal data; rotate keys if exposed.

## Agent-Specific Tips
- Respect the structure above; new routes go under `src/app/<route>/page.tsx`.
- New API endpoints: `src/app/api/<name>/route.ts` exporting `GET/POST`.
- Keep changes small and focused; update this guide if structure evolves.

