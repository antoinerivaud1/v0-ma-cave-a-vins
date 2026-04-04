# Follow-up: lockfile sync and Supabase verification

This follow-up exists because PR #39 was merged without the updated `pnpm-lock.yaml` and because live Supabase schema/RLS verification could not be completed from the publication session.

## 1. Lockfile recovery

Goal: bring `main` back to the exact dependency graph that was validated locally.

Expected source branch from the validated session:
- `claude/sprint-3-4-cloud-hardening`

Required action from a credentialed Git checkout:
1. checkout `main`
2. regenerate or copy the validated `pnpm-lock.yaml`
3. run:
   - `pnpm install --frozen-lockfile` if lockfile already restored
   - or `pnpm install --no-frozen-lockfile` if the lockfile must be regenerated from `package.json`
4. validate:
   - `npm test`
   - `npm run lint`
   - `corepack pnpm exec tsc --noEmit`
   - `corepack pnpm build`
5. merge the lockfile-only hotfix

Risk if skipped:
- non-reproducible installs between local, CI, and Vercel
- future dependency drift relative to the validated workspace

## 2. Supabase schema verification

Goal: confirm that the shipped code matches the live database schema.

Tables and fields expected by the current code:

### `profiles`
- `id`
- `first_name`
- `plan`
- `role`
- `last_active_cave_id`

### `caves`
- `id`
- `user_id`
- `name`
- `created_at`

### `wines`
- `id`
- `user_id`
- `cave_id`
- `name`
- `vintage`
- `quantity`
- `region`
- `appellation`
- `domain`
- `wine_type`
- `classification`
- `notes`
- `created_at`
- `updated_at`

### `tastings`
- code currently assumes row deletion by `user_id`

## 3. RLS verification

Policies should allow an authenticated user to operate only on their own rows.

Minimum checks:
- `profiles`: select/update own row only
- `caves`: select/insert/update/delete own rows only
- `wines`: select/insert/update/delete own rows only
- `tastings`: select/insert/update/delete own rows only

Special attention:
- `wines.cave_id` must not allow cross-user cave moves
- deleting by `user_id` in reset flows must be permitted for the current user and denied otherwise

## 4. Runtime checks after verification

Validate these live flows against the real Supabase project:
- sign in
- create/select active cave
- import wines
- add manual wine
- consume from detail sheet
- move wine between caves
- reset cave
- sign out/sign in on another device or session

## 5. Exit criteria

This follow-up is complete when:
- `pnpm-lock.yaml` is restored on `main`
- all four validation commands pass from a clean checkout
- live Supabase schema matches the code expectations
- RLS policies are confirmed on the production project
- critical cloud-first flows pass manually
