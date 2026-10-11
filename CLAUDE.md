# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Miss Revolution App — a fitness/nutrition mobile app built with **Expo (SDK 55)**, **React Native 0.83** (New Architecture), and **React 19**. Backend is **Supabase** (PostgreSQL). The app serves gym members with diet plans, workout programs, progress tracking, chat with coaches, and video content.

## Commands

Install dependencies with **bun** (`bun install`). `package.json` patches React Native and the action sheet through `patchedDependencies` (see Accessibility): `npm install` silently skips them.

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

### Routing (Expo Router 55, file-based)

All routes live in `src/app/`. Route groups:

- `(auth)/` — unauthenticated: login, password flows (no sign-up: accounts are created only from the backoffice)
- `(tabs)/` — main bottom tab bar with 4 tabs: home, nutrition, workout, progress
- `(chat)/`, `(recipe)/`, `(workout)/` — detail screens pushed onto the stack
- `video/`, `survey/`, `notifications`, `profile` — standalone screens

Root `_layout.tsx` conditionally renders auth vs main stack based on `isLoggedIn` from the Zustand auth store.

### Subscription access (limited mode)

The server decides who can use what: `src/lib/accesso.ts` calls the `accesso_app()` RPC (it falls back to `stato_accesso()` on databases without it). `accesso: true` opens everything. Without a valid subscription the user still enters if `aree` lists open areas (today `progressi` and `notifiche`): every other section shows a lock (`SezioneBloccata`) with a button to the gym chat. With no open areas the full-screen `abbonamento.tsx` is shown, as in 1.3.0. Chat and profile are always open (renewal, privacy, account deletion).

- The lock is applied by `screenLayout` on the root Stack and on the Tabs (`src/components/core/GateArea.tsx`), before the screen mounts, so locked screens never fetch data. **A new screen with programme content must be added to `AREE_SCHERMATE` (or `AREE_SCHEDE`)**, otherwise it stays open.
- Opening `progressi`, `questionari`, `notifiche` or `allenamento` to users without a subscription is a database change only. Opening `faq`, `nutrizione` or `video` also needs the FAQ service, the photo scanner and the `videos_select` policy, which still check the subscription through `stato_accesso()`.
- Entry points to a locked section stay tappable and show `LucchettoBadge` plus an `accessibilityLabel` ending in "richiede un abbonamento attivo" (home tiles, tabs, bell). Use `useAreaAperta(area)`; never derive access from `abbonamento_attivo` or membership dates in the app.

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

## Accessibility

Every screen must work with all of these on at once, on iOS and Android, with the same code: Android font 200% + largest display size (316 pt wide on a 411 pt phone), iOS AX5, system bold text, Reduce Motion / Remove animations. Test on **release builds**: the dev build does not reproduce the Reanimated and bold-text defects. Background: wiki `applicazione/compatibilita-nativa` in the consultancy repo.

Layout and text

- Nothing that contains text gets a fixed `height`, `width` or `aspectRatio`: use `minHeight`, `flexGrow`, `flexShrink: 1`. Fixed boxes (and `overflow: 'hidden'`) clip text that grows to 2x. Fixed sizes only for icons, avatars, images and icon-only buttons.
- In a row, text next to an icon or button gets `flex: 1`/`flexShrink: 1`; rows of text + button get `flexWrap: 'wrap'` and `gap`.
- Two boxes side by side collapse to one column with `useLayoutStretto()` (width / fontScale < 280); in that mode hide purely decorative icons. Otherwise words break mid-word ("Obbiet-tivo").
- No `numberOfLines={1}` on text the user must read; one line only for redundant labels that shrink (`adjustsFontSizeToFit`, tab labels with `maxFontSizeMultiplier={1.3}`).
- Headings with long words get a `maxFontSizeMultiplier` (1.3-1.6) so the longest word fits about 245 pt ("abbonamento" in Graphit Bold 20 pt x 1.6 fits, x 2 does not).
- Anything that can outgrow the screen scrolls: `ScrollView` with `contentContainerStyle={{ flexGrow: 1 }}` (never `flex: 1`). Forms use `FormScrollLayout`. With 200% + zoom, a non-scrolling login hid "Accedi".
- Sizes derived from `fontScale` use `Math.min(fontScale, 2)`: iOS reports up to 3.57 but text is capped at 2.
- Touch targets at least 44 pt (`minHeight`, `hitSlop`).

Fonts

- Every `Text`/`TextInput` has an explicit `fontFamily` (`GraphitFonts.*`), error and empty states included; bold = `GraphitBold`, never `fontWeight` alone. Android bold text thickens only the system font while RN measures it regular, so words get clipped.
- Text and TextInput are capped at 2x by `patches/react-native@0.83.2.patch`; don't remove the cap. Android action sheets spread `actionSheetAndroidOptions(insets.bottom)` (`src/theme/actionSheet.ts`).

Motion

- Every Reanimated `entering`, `exiting` and `layout` goes through `useLayoutAnimation()` (`entering={anima(FadeIn)}`): on Android release with Remove animations Reanimated skips the animation and never applies the final size, so cards stay closed and lists invisible.
- Content must be visible with no animation (never start at opacity 0 and rely on an animation). Reduce Motion is read at app start: restart after changing it.

Screen readers

- Touchables have `accessibilityRole` ("button", "header" for titles); icon-only buttons have an Italian `accessibilityLabel` ("Indietro", "Notifiche").
- Decorative icons are hidden (`accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`); what an icon or badge conveys (lock, unread count) goes in the parent's `accessibilityLabel`. Never colour alone.

Before merging UI changes: release build, all settings on, both platforms (Android `font_scale` 2.0 + largest display size + bold text + the three animation scales at 0; iOS AX5 + Bold Text + Reduce Motion), restart the app, walk login, home, the four tabs, check-up, chat, profile and the screens you touched.

## Key Conventions

- Components use PascalCase filenames; hooks/utils use camelCase
- Type files use `.types.ts` suffix
- Layout wrappers: `TabScrollLayout`, `ContentScreenLayout`, `FormScrollLayout`, `DismissKeyboardView` in `src/components/layouts/`
- Optimistic UI updates with rollback on error (see notifications, chat)
- Error display via `Alert.alert()`
- New Architecture and React Compiler are enabled (`app.json`)
