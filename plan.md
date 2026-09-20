# Magic: The Gathering Game Tracker — Implementation Plan

## Purpose and Product Scope

Build a responsive web application where authenticated Magic: The Gathering players can:

- Log completed games involving saved opponents and one-off guests.
- Review personal game history and useful performance statistics.
- Run a multi-player life tracker with optional turn and game-duration tracking.
- Save a completed tracker session as a game record without re-entering its results.

The initial deployment target is GitHub Pages. If the product proves useful, its static frontend can later be deployed to a dedicated domain without changing the application architecture.

## Confirmed Technical Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Frontend | Vite, React, and TypeScript | Provides fast development/build tooling, component-based UI composition, and type safety for complex game and tracker data. |
| Styling | CSS Modules or a small global token layer plus component styles | Keeps the visual system maintainable without introducing a large styling dependency. Choose one convention during Phase 1 and use it consistently. |
| Routing | React Router | Supplies protected routes and dedicated dashboard, history, tracker, and account pages. |
| Authentication | Supabase Auth, email/password initially | Offers managed authentication suitable for a static client and can be extended with OAuth later. |
| Database | Supabase PostgreSQL | Stores users, opponents, games, game players, and optional tracker events relationally; supports statistics queries and future reporting. |
| Authorization | Supabase Row Level Security (RLS) | Ensures a signed-in user can access and modify only their own records even when the client is public. |
| Client/server data access | `@supabase/supabase-js` | Official browser client for authentication, inserts, queries, and subscriptions if needed later. |
| Local UI state | React state/reducers; `localStorage` only for unsaved tracker recovery | Avoids unnecessary global-state infrastructure while preserving an in-progress game across refreshes. |
| Validation | Zod with React Hook Form | Defines reusable validation schemas and accessible form-state handling. |
| Tests | Vitest, React Testing Library, and Playwright | Covers pure calculations, UI behavior, and key browser workflows. |
| Deployment | GitHub Actions to GitHub Pages | Builds and publishes the static Vite output from this repository now; a future dedicated host only changes deployment configuration. |

## Required Services and Configuration

### GitHub

- Use this repository for source control and GitHub Pages hosting.
- Enable Pages deployment through GitHub Actions.
- Store `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository secrets or deployment environment variables. These are public client configuration values, but must not be hard-coded into the repository.
- Do **not** place Supabase service-role credentials in the client, GitHub Pages variables, or source control.

### Supabase

- Create one Supabase project for the application.
- Enable email/password authentication and configure the production GitHub Pages URL as an allowed redirect URL.
- Use the Supabase SQL migration workflow to version schema, indexes, RLS policies, and seed data where appropriate.
- Configure a development project or a local Supabase instance separately from production before real user data exists.

### External UI Assets

- Use system fonts or a web-font provider only when the final design requires it.
- Do not make the app depend on remote image assets for core functionality.
- Use CSS and accessible HTML controls for the tracker rather than image-based buttons.

## Architecture and Data Model

### Application Routes

| Route | Access | Responsibility |
| --- | --- | --- |
| `/` | Public | Landing page; directs authenticated users to the dashboard and new users to sign in. |
| `/login` | Public | Sign-in and sign-up forms. |
| `/dashboard` | Authenticated | Summary statistics, recent games, and primary actions. |
| `/games` | Authenticated | Searchable, filterable game history. |
| `/games/new` | Authenticated | Manual game-record form. |
| `/games/:gameId` | Authenticated | View, edit, and delete one game. |
| `/tracker` | Authenticated | Live life/turn/time tracker and recovery UI. |
| `/account` | Authenticated | Display-name and application-preference management. |

### Database Tables

Use UUID primary keys, `timestamptz` timestamps, and database defaults for creation timestamps.

#### `profiles`

- `id uuid primary key references auth.users(id) on delete cascade`
- `display_name text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Create the profile automatically from a secure `auth.users` insert trigger. A user can select/update only their own profile.

#### `opponents`

Saved, reusable opponent identities owned by a user.

- `id uuid primary key`
- `owner_id uuid not null references profiles(id) on delete cascade`
- `name text not null`
- `notes text null`
- `created_at timestamptz not null default now()`
- Unique index on `(owner_id, lower(name))` to avoid accidental duplicate saved opponents.

#### `games`

The user-owned record for one completed game.

- `id uuid primary key`
- `owner_id uuid not null references profiles(id) on delete cascade`
- `played_at timestamptz not null default now()`
- `format text not null`
- `result text not null check (result in ('win', 'loss', 'draw', 'other'))`
- `winner_player_key text null` (links to the winner within the record’s player list)
- `turn_count integer null check (turn_count > 0)`
- `duration_seconds integer null check (duration_seconds >= 0)`
- `source text not null check (source in ('manual', 'tracker')) default 'manual'`
- `notes text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

#### `game_players`

All participants in a game, including the authenticated player, saved opponents, and guests.

- `id uuid primary key`
- `game_id uuid not null references games(id) on delete cascade`
- `player_key text not null` (stable client-generated key within a game)
- `kind text not null check (kind in ('owner', 'opponent', 'guest'))`
- `opponent_id uuid null references opponents(id) on delete set null`
- `display_name text not null` (snapshot so history remains stable if an opponent changes name)
- `deck_name text null`
- `commander_name text null`
- `placement integer null check (placement > 0)`
- `starting_life integer null`
- `ending_life integer null`
- `eliminated_at_turn integer null check (eliminated_at_turn > 0)`
- Unique index on `(game_id, player_key)`.

The owner player is stored as a `game_players` row with `kind = 'owner'`. Statistics always identify the owner from this row instead of relying on an opponent name.

#### `game_events` (optional persistence in the MVP)

Use this table once tracker history/undo needs durable storage; do not block the basic tracker on it.

- `id uuid primary key`
- `game_id uuid not null references games(id) on delete cascade`
- `sequence integer not null`
- `event_type text not null check (event_type in ('life_change', 'turn_started', 'player_eliminated'))`
- `payload jsonb not null`
- `occurred_at timestamptz not null default now()`
- Unique index on `(game_id, sequence)`.

### Security Model

- Enable RLS on every application table.
- Permit users to select, insert, update, and delete only rows where `owner_id = auth.uid()`.
- For `game_players` and `game_events`, authorize access through their parent game’s `owner_id`.
- Test policies with two test users to prove cross-user reads and writes fail.
- Keep privileged administration and any service-role operations outside the browser client.

## Atomic Implementation Phases

Each phase should be implemented as small independently testable units. Complete the listed verification items before moving to the next phase.

## Phase 1: Project Bootstrap and Deployment

1. Remove or archive the current placeholder-only HTML entry point after preserving any useful branding references.
2. Initialize Vite with React and TypeScript at the repository root.
3. Add package scripts for `dev`, `build`, `lint`, `test`, `test:watch`, and `test:e2e`.
4. Add ESLint, Prettier, and TypeScript strict-mode configuration.
5. Add a `src/` layout: `app/`, `components/`, `features/`, `lib/`, `pages/`, `styles/`, and `test/`.
6. Add a minimal `App` component that renders successfully.
7. Add React Router and render placeholder pages for every planned route.
8. Add a global CSS token file for colors, spacing, typography, border radius, and focus styles.
9. Add responsive base layout components: application header, main content container, and navigation.
10. Add `.env.example` containing variable names only; add `.env*` exclusions to `.gitignore` while retaining `.env.example`.
11. Add GitHub Actions workflow to install dependencies, run lint/tests/build, and deploy the `dist/` directory to GitHub Pages on pushes to the selected default branch.
12. Configure Vite `base` correctly for the GitHub Pages repository path.
13. Verify local production build and the deployed site’s direct-route fallback behavior.

**Phase 1 exit criteria:** A typed React app runs locally, builds cleanly, and deploys a visible application shell to GitHub Pages.

## Phase 2: Supabase Setup, Schema, and Authentication

1. Create the Supabase project and record its URL and anonymous key in local environment configuration.
2. Add the Supabase client factory in `src/lib/supabase.ts`; fail with a clear developer error when variables are absent.
3. Create an initial SQL migration directory and migration execution instructions.
4. Add `profiles` table, `updated_at` trigger, and secure automatic profile-creation trigger.
5. Add `opponents`, `games`, and `game_players` tables with indexes and constraints specified above.
6. Enable RLS and add owner-only policies for all initial tables.
7. Add a Supabase type-generation command or checked-in generated database type file.
8. Implement an `AuthProvider` that loads/restores a session and exposes sign-in, sign-up, sign-out, and loading state.
9. Implement login and registration forms with email/password validation and visible errors.
10. Add protected-route logic that redirects unauthenticated visitors to `/login`.
11. Add sign-out to the authenticated navigation.
12. Add a profile initialization check and a basic account page for display-name updates.
13. Add unit/component tests for auth guards and form validation.
14. Manually validate two-user RLS isolation using the Supabase dashboard or automated integration tests.

**Phase 2 exit criteria:** A user can register, sign in, sign out, retain a session, update their profile, and cannot view another user’s records.

## Phase 3: Shared Domain Types and Game Record Creation

1. Define TypeScript domain types for game formats, results, participant kinds, game inputs, and stored records.
2. Define Zod schemas for a manual game and individual player input.
3. Add a canonical format list (Commander, Standard, Modern, Pioneer, Legacy, Vintage, Pauper, Limited, Other) while permitting `Other` details later if required.
4. Implement opponent repository functions: list, create, rename, and delete a saved opponent.
5. Build an opponent-management section on the account page.
6. Implement game repository functions: create, fetch one, update, delete, and list paginated games.
7. Build the new-game page with game date, format, owner player/deck information, result, notes, duration, and turn count.
8. Add participant controls allowing one owner plus at least one opponent or guest.
9. Add a saved-opponent selector and guest-name field; snapshot every participant display name into `game_players`.
10. Add player deck name, commander, placement, and optional start/end life fields.
11. Validate that exactly one owner exists, at least two participants exist, placement values do not collide when present, and a winner/result is internally consistent.
12. Persist a valid manual game using a transaction-like ordered insert: insert game, insert player rows, then report success only after both complete.
13. Redirect to the created game detail page after a successful save.
14. Add clear error feedback and retain entered form data after a failed request.
15. Add unit tests for schemas and repository mapping; add component tests for participant add/remove and validation.

**Phase 3 exit criteria:** An authenticated user can create a valid completed game with saved opponents and guests, then view the saved record.

## Phase 4: History and Game Maintenance

1. Implement a game-list query that retrieves a game with its participants in reverse chronological order.
2. Build a game-history table/card list that is usable on desktop and mobile.
3. Add loading, error, empty, and no-filter-results states.
4. Add filtering by date range, format, owner result, saved opponent, and guest name where practical.
5. Add text search across notes, deck names, commanders, and participant display names.
6. Add pagination or incremental "load more" behavior; do not fetch an unbounded history by default.
7. Build the game-detail page showing all saved fields and participants.
8. Reuse the game form for editing while preserving existing game/player identity appropriately.
9. Add an explicit deletion confirmation dialog.
10. Delete child player/event records through the foreign-key cascade when a game is deleted.
11. Add tests for filters, empty states, edit prefill, and deletion confirmation.

**Phase 4 exit criteria:** A user can find, inspect, update, and safely delete their prior game records.

## Phase 5: Statistics Engine and Dashboard

1. Create pure functions that accept normalized game records and calculate totals without UI or database dependencies.
2. Calculate total games, wins, losses, draws, other outcomes, and win rate (wins divided by games with a win/loss result, with an explicitly documented denominator).
3. Calculate record and win rate by format.
4. Calculate record and win rate by owner deck/commander.
5. Calculate head-to-head stats using saved opponent IDs when available and display-name snapshots for guests.
6. Calculate average duration and average turns using only games that captured each metric.
7. Define deterministic sorting/tie-breaking for all leaderboards.
8. Unit-test zero games, only draws, only unknown outcomes, missing duration/turn values, and mixed multiplayer data.
9. Implement dashboard data query and loading/error/empty states.
10. Build summary-stat cards and a recent-games list.
11. Build format, deck, opponent, and average-length statistic sections.
12. Label partial-data metrics so users understand when averages omit incomplete records.
13. Add links from dashboard rows/cards to the relevant filtered history when feasible.

**Phase 5 exit criteria:** Dashboard statistics are correct, test-covered, and understandable for users with both sparse and extensive game histories.

## Phase 6: Tracker State Model and Interface

1. Define pure tracker types: session, player, turn, timer, history entry, and finalization payload.
2. Implement a reducer with explicit actions for player addition/removal, name edits, life changes, starting-life changes, active-player changes, next turn, timer start/pause/reset, elimination, undo, and session reset.
3. Ensure reducer actions cannot lower a participant count below two or leave no active player while a game is running.
4. Create a new tracker-session flow supporting two through six participants initially; allow expansion later only after layout testing.
5. Add each player with a unique stable client-generated key, name, optional saved-opponent reference, and configurable starting life.
6. Provide Commander as a selectable starting configuration with 40 life, while allowing all life totals to be overridden.
7. Build large accessible decrement/increment controls and keyboard-operable alternatives.
8. Display each player’s current life, name, active/eliminated status, and optional commander/deck information.
9. Add turn controls: active player, turn number, and next-turn action.
10. Add elapsed-time controls: start, pause, resume, and reset.
11. Add an undo action that reverses the last reversible tracker event and communicate the action clearly to screen readers.
12. Add a compact mobile layout and verify touch targets are adequate for play at a table.
13. Add unit tests for every reducer action and invalid-state guard.
14. Add component tests for life changes, turn advancement, timer state, and undo.

**Phase 6 exit criteria:** A signed-in user can accurately run a multi-player life tracker with optional turn and duration tracking.

## Phase 7: Tracker Recovery and Save-to-Game Flow

1. Define a versioned `localStorage` key and serialized tracker-session shape.
2. Persist valid in-progress sessions after meaningful reducer changes using a debounced write.
3. Restore the session on tracker load after validating/parsing it with Zod.
4. If restoration data is invalid or from an unsupported schema version, discard it safely and show a non-blocking message.
5. Display a recovery prompt when an unfinished session exists, offering Resume or Discard.
6. Implement a finish-game action that pauses the timer and opens a completion review.
7. In the completion review, confirm winner/result, final participant information, format, optional notes, final turn count, and duration.
8. Map tracker state to the same canonical game-input schema used by manual logging.
9. Persist the completed game and participants with `source = 'tracker'`.
10. Optionally persist event history to `game_events` only after the basic completion flow works.
11. Clear local tracker recovery data only after the game save succeeds or the user explicitly discards the session.
12. Redirect to the created game detail page and make it visible in dashboard/history views.
13. Add tests for valid restore, corrupt restore, completion mapping, failed save retention, and successful-save cleanup.

**Phase 7 exit criteria:** A tracker session survives refreshes and can be saved as a complete game record without duplicate manual entry.

## Phase 8: UX Polish, Accessibility, Security Review, and Release

1. Establish final Magic-inspired color and typography tokens while maintaining accessible contrast.
2. Ensure every input has a programmatic label and every validation error is announced/accessibly linked.
3. Verify keyboard operation for navigation, forms, dialogs, and all tracker controls.
4. Add focus management for route transitions, dialogs, and post-submit success/failure states.
5. Verify responsive behavior at narrow phone, tablet, and desktop widths.
6. Audit with browser accessibility tooling and resolve high-impact issues.
7. Confirm no private credentials are committed and that environment examples contain placeholders only.
8. Re-test Supabase RLS against a second user after all queries/mutations are complete.
9. Add Playwright end-to-end coverage for sign-up/sign-in (using test configuration), manual game logging, history edit/delete, tracker recovery, and tracker finalization.
10. Write README setup instructions, service configuration instructions, architecture notes, scripts, testing commands, and deployment procedure.
11. Verify a clean clone can install dependencies, configure environment values, run locally, build, test, and deploy.
12. Create a release checklist and validate the live GitHub Pages URL.

**Phase 8 exit criteria:** The MVP is accessible, secure at the data-policy level, tested, documented, and deployed on GitHub Pages.

## Non-Goals for the Initial MVP

- Real-time shared life tracking between multiple devices.
- Public player profiles or social/follow features.
- Deck-list import or card-database integrations.
- Advanced charting beyond clear dashboard summaries.
- Native mobile applications.
- Storing service-role keys or performing privileged database operations from the browser.

## Definition of Done

The initial release is complete when a user can create an account, log in, add saved opponents or guests, record and maintain games, view correct personal statistics, track a live game’s life/turn/time, recover an interrupted tracker session, save it as a game, and use the deployed application on GitHub Pages.

## Session Recovery Notes

### Current Project State

- Repository path: `/workspace/Im-Saga.github.io`.
- Active branch at planning time: `work`.
- The repository is currently a minimal static site, not a React application.
- Existing tracked application files are `index.html`, `style.css`, `script.js`, and `README.md`.
- `index.html` currently contains placeholder navigation (`ARCHANGEL`, `Add Game`, `Add Entry`, `My Account`) and a placeholder landing message; it is not a functional game tracker.
- `script.js` contains no application behavior.
- `style.css` contains only basic global styling and placeholder landing styles.
- No `package.json`, Vite configuration, test configuration, CI workflow, Supabase configuration, database migration, or authentication implementation exists yet.
- No code implementation has been started as part of this plan; `plan.md` is the first project-planning artifact.

### Critical Decisions Made So Far

1. Use **Vite + React + TypeScript** for the frontend rather than extending the existing plain HTML/CSS/JavaScript placeholder.
2. Use **Supabase Auth** and **Supabase PostgreSQL** for persistent user data, authentication, and access control.
3. Enforce per-user data boundaries with **Supabase Row Level Security** from the first schema migration.
4. Use **GitHub Pages** plus a **GitHub Actions** deployment workflow for the initial release.
5. Design for later rehosting on a dedicated site/domain; avoid coupling application code to GitHub Pages beyond the Vite base path and CI deployment configuration.
6. Include both authenticated game logging/statistics and life/turn tracking in the initial release scope.
7. Support saved opponents and non-authenticated guest players from the first game-record flow.
8. Store unfinished tracker state locally for recovery; save a finished game to Supabase only after the user confirms completion.

### Where to Resume

1. Start at **Phase 1, item 1**. Inspect the current branch (`git status --short --branch`) before editing, because this document intentionally does not include a bootstrap implementation.
2. Read this plan top-to-bottom, then set up the Vite React TypeScript project at the repository root. Do not begin feature work in the legacy `index.html`/`script.js` architecture.
3. Before Phase 2, create/configure a Supabase project and obtain only the URL and anonymous key for local client configuration. Do not commit any real environment file or service-role credential.
4. Implement SQL migrations and RLS policies before building forms that write production data. Validate all policy assumptions using two users.
5. Complete each phase’s exit criteria and tests before starting the next phase. The tracker must use the same canonical game schema as manual game entry to avoid incompatible records and duplicated statistics logic.
6. If hosting changes later, retain the Vite build and Supabase setup; update only the hosting workflow, production base URL, Supabase Auth redirect URLs, and environment configuration.

### First Commands for the Next Implementation Session

```bash
git status --short --branch
cat plan.md
node --version
npm --version
```

Then initialize the Phase 1 Vite project and immediately add lint, test, and production-build commands before implementing any product feature.
