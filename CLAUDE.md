# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Miss Revolution App — a fitness/nutrition mobile app built with **Expo (SDK 54)**, **React Native 0.81**, and **React 19**. Backend is **Supabase** (PostgreSQL). The app serves gym members with diet plans, workout programs, progress tracking, chat with coaches, and video content.

## Commands

```bash
# Development (defaults to staging)
npm start                          # expo start --clear
npm run start:staging              # explicit staging
npm run start:prod                 # production environment

# Platform-specific
npm run ios                        # expo run:ios
npm run android                    # expo run:android
npm run ios:prod / android:prod    # production builds

# Lint
npm run lint                       # expo lint (ESLint)
```

No test suite is configured. Pre-commit hooks (Husky + lint-staged) run Prettier and ESLint auto-fix on staged files.

## Architecture

### Routing (Expo Router v6, file-based)

All routes live in `src/app/`. Route groups:

- `(auth)/` — unauthenticated: login, register, password flows
- `(tabs)/` — main bottom tab bar with 4 tabs: home, nutrition, workout, progress
- `(chat)/`, `(recipe)/`, `(workout)/` — detail screens pushed onto the stack
- `video/`, `survey/`, `notifications`, `profile` — standalone screens

Root `_layout.tsx` conditionally renders auth vs main stack based on `isLoggedIn` from the Zustand auth store.

### State Management

- **Zustand** (`src/store/authStore.ts`) — auth session and user state only
- **React Context** (`src/contexts/`) — two providers:
  - `AppConfigContext` — app settings, feature flags, maintenance mode (fetched from `app_config_public` table)
  - `UserContext` — current user details via `me_detailed()` RPC

### Data Layer (Supabase)

- Client initialized in `src/lib/supabase.ts`
- Environment config loaded from `src/config/supabase.{staging,production}.json` via `src/env/supabaseConfig.ts`
- Controlled by `EXPO_PUBLIC_APP_ENV` env var (defaults to `staging`)
- Database types auto-generated in `src/types/database.types.ts` (do not edit manually)

### Custom Hooks Pattern

All data-fetching hooks follow this structure:

```typescript
const { data, loading, refreshing, error, refetch, refresh } = useXxx();
```

- `loading` = initial load; `refreshing` = pull-to-refresh
- Request ID refs prevent race conditions from stale responses
- Located in `src/hooks/core/` and `src/hooks/content/`
- Supabase RPC calls for complex queries (e.g., `me_detailed()`, `get_user_survey_details()`)
- Realtime subscriptions used for chat (`useChat.ts`)

### Push Notifications

Dual system: **OneSignal** (primary, `src/lib/onesignal.ts`) + **Expo Notifications** (`src/lib/pushNotifications.ts`). OneSignal syncs user ID on login and logs out on sign out.

## TypeScript Path Aliases

```
@/*            → ./
@components/*  → ./src/components/
@mr-types/*    → ./src/types/
```

## Code Style

- Prettier: 100 char width, single quotes, trailing commas, semicolons, 2-space indent
- Fonts: Graphit (primary, platform-aware names in `src/theme/fonts.ts`) and Poppins (Google Fonts)
- Colors defined in `src/theme/colors.ts` — purple/pink palette
- Icons: custom SVG components in `src/components/ui/icons/` + lucide-react-native

## Key Conventions

- Components use PascalCase filenames; hooks/utils use camelCase
- Type files use `.types.ts` suffix
- Layout wrappers: `TabScrollLayout`, `ContentScreenLayout`, `DismissKeyboardView` in `src/components/layouts/`
- Optimistic UI updates with rollback on error (see notifications, chat)
- Error display via `Alert.alert()`
- New Architecture and React Compiler are enabled (`app.json`)
