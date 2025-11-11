# Repository Guidelines

## Project Structure & Module Organization
This Vite + React app serves Firebase-backed Mole.AI surfaces. Source code sits in `src/`, where `main.jsx` boots `App.jsx` and wires providers. Feature code is grouped by purpose: UI primitives in `src/components`, domain data helpers in `src/api`, shared state in `src/contexts`, and hooks/utilities in `src/hooks` and `src/utils`. Page-level routes live in `src/pages`, while static assets flow from `public/` at build time. Imports can use the `@/` alias defined in `jsconfig.json`, so prefer `@/components/ui/toaster` instead of long relative paths.

## Build, Test, and Development Commands
Install dependencies once with `npm install`. Run `npm run dev` for the Vite dev server (hot reload on `localhost:5173`). Ship-ready bundles come from `npm run build`, which writes to `dist/`; confirm the output locally via `npm run preview`. Keep the codebase clean with `npm run lint`, which applies the repo ESLint config before you open a pull request.

## Coding Style & Naming Conventions
React components use functional style, JSX, and Tailwind utility classes; keep indentation at two spaces and prefer double quotes for strings to stay consistent with existing files such as `src/App.jsx`. Components and hooks follow `PascalCase.jsx` and `useCamelCase.js`, while helper modules stay `camelCase`. Centralize shared props, variants, and Firebase calls instead of duplicating logic in pages. ESLint (plus `eslint-plugin-react`, hooks, and refresh rules) is the source of truth—run lint locally and resolve all warnings. Tailwind tokens (configured in `tailwind.config.js`) should back any new colors, radii, or spacing so themes remain coherent.

## Testing Guidelines
An automated test harness is not set up yet, so new features must ship with either lightweight Vitest + React Testing Library specs (`*.test.jsx` beside the code) or, at minimum, scripted manual test notes in the pull request. Target meaningful coverage on async flows such as onboarding checks (`BusinessProfile` + `Persona` calls) and authentication redirects. Whatever approach you add, document how to run it (e.g., `npm run test`) and keep fixtures under `src/__tests__/` or feature-level `__mocks__/` directories.

## Commit & Pull Request Guidelines
Follow the existing history by writing short, imperative commit subjects (`Add onboarding guard`, `Update profile form`) capped near 72 characters and avoid multi-topic commits. Each pull request should include: a concise summary of the change, screenshots or screen recordings for UI updates, explicit test evidence (command output or manual steps), and links to any tracked issues. Rebase locally before opening the PR and ensure `npm run build && npm run lint` succeed so reviewers can focus on logic rather than build fixes.

## Security & Configuration Notes
Secrets and environment-specific Firebase values must live in local `.env` files consumed by Vite (`VITE_FIREBASE_API_KEY`, etc.) and never be committed—`firebase.json` and `firestore.rules` already cover deploy targets. When touching auth or Firestore rules, review `firestore.rules` alongside the related front-end calls to keep data access aligned with backend expectations.
