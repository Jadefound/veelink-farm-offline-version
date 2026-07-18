# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

VeeLink Manager — an **offline-first** React Native (Expo SDK 54) app for livestock/farm management: animals, health records, financial transactions, inventory, and reports across multiple farms. All data lives on-device; there is no backend (`lib/supabase.ts` is intentionally empty).

## Commands

Package manager is **Bun** (`bun.lock` is committed; `package-lock.json` also present).

```bash
bun install            # installs deps; postinstall runs patch-package
bun start              # expo start (dev server; press i / a / w)
bun run android        # expo run:android (native build)
bun run ios            # expo run:ios
bun run web            # expo start --web
bun run tunnel         # expo start --tunnel
npx tsc --noEmit       # typecheck (strict mode is on; there is no eslint/test setup)
```

There is **no test runner and no linter configured** — do not assume `bun test` or `bun lint` exist. Typechecking via `tsc` is the only automated verification.

## Architecture

### State = Zustand stores (this is the whole "data layer")

Every domain lives in its own persisted Zustand store under `store/`: `animalStore`, `financialStore`, `healthStore`, `farmStore`, `authStore`, `inventoryStore`, `transactionStore`, `notificationStore`, `themeStore`. Each store:
- uses `persist(...)` + `createJSONStorage(() => AsyncStorage)` with a unique `name` (e.g. `"animal-storage"`).
- uses `partialize` to control what persists (e.g. pagination state is deliberately **not** persisted and resets on app start).
- exposes async CRUD actions (`create*`, `update*`, `delete*`, `fetch*`) that mutate in-memory state; persistence happens automatically via the middleware — never write to AsyncStorage directly for store data.

**Key invariant:** a store holds the FULL dataset for all farms. Screens and selectors filter by the current farm (`useFarmStore.getState().currentFarm?.id`). Do not filter down the persisted array itself.

### Cross-store synchronization via `reference` keys

Stores coordinate through **dynamic imports** to avoid circular dependencies (e.g. `const { useFinancialStore } = await import("./financialStore")`). The canonical example is `animalStore`, which keeps linked financial transactions in sync:
- Buying an animal (`acquisitionPrice > 0`) creates/updates an Expense transaction with `reference = "ANIMAL-PURCHASE-<animalId>"`.
- Marking an animal `Sold` creates/updates an Income transaction with `reference = "ANIMAL-<animalId>"`, category `Sales`.

These `reference` strings are the join keys — preserve the format when touching sync logic. The Sales→animal reverse auto-sync was intentionally removed to prevent recursion; don't reintroduce a callback from `financialStore` back into `animalStore`.

### Routing = Expo Router (file-based, typed routes)

`app/` is the route tree; `experiments.typedRoutes` is enabled. `app/_layout.tsx` is the root `Stack` and owns the **auth/onboarding gate**: it reads `authStore` (first-time-user, biometric support, `isAuthenticated`) and `router.replace`s to `/auth/register`, `/auth/login`, or unlocks. Tab screens live in `app/(tabs)/` (Dashboard=`index`, animals, health, financial, settings). Dynamic detail routes use `[id].tsx` (e.g. `app/animal/[id].tsx`).

### Auth (fully local)

`authStore` handles password (hashed with `bcryptjs`), optional PIN, and biometric unlock (`expo-local-authentication`), storing secrets via `expo-secure-store`. There are no remote accounts.

### Conventions

- **Path alias:** `@/*` maps to the project root (`import { generateId } from "@/utils/helpers"`).
- **IDs:** internal record IDs use `generateId()` (UUID v4, `utils/helpers.ts`). Animals also have a user-facing `identificationNumber` that must be unique **per farm** — enforced in `createAnimal`/`updateAnimal`.
- **Currency:** `formatCurrency` in `utils/helpers.ts` is hardcoded to **NGN** (Naira).
- **Demo/mock data** (`utils/mockData.ts`) is only seeded when the AsyncStorage flag `demoDataEnabled === "1"`; `clearDemoData()` removes it by known demo IDs.
- **Theme:** `themeStore.isDarkMode` drives colors from `constants/colors.ts`; styling is plain React Native `StyleSheet` (NativeWind is installed but the codebase uses StyleSheet).

### Gotchas / native workarounds

- `metro.config.js` force-resolves `@react-navigation/core` and `@react-navigation/native` to the single project-root copy. This fixes the "Couldn't find the prevent remove context" crash caused by expo-router bundling a nested duplicate. Don't remove it.
- `patches/react-native-gesture-handler+2.28.0.patch` is applied via `patch-package` on postinstall. Re-run `bun install` after changing native deps.
- New Architecture is enabled (`newArchEnabled: true`); `react-native-reanimated` v4 + `react-native-worklets` are in use.

## Related folders (not this project)

The parent `programming/` directory contains unrelated projects and an **older** Veelink at `veelink-animal-farm-manager (1)/` (last touched May 2025, has a backend). This offline version is the current, actively-developed one — ignore the older folder unless explicitly asked.
