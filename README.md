# Font of Blessings

A Magic: The Gathering game history and life-tracker application.

## Development

Requires a current Node.js release and npm.

```bash
npm install
npm run dev
```

## Available scripts

- `npm run dev` — start the Vite development server.
- `npm run build` — type-check and create the production `dist/` build, including a Pages SPA fallback.
- `npm run lint` — run ESLint.
- `npm run test` — run Vitest and React Testing Library tests once.
- `npm run test:watch` — keep Vitest running in watch mode.
- `npm run test:e2e` — run Playwright browser tests.

Copy `.env.example` to `.env.local` when adding local client configuration. Never commit real environment files.
