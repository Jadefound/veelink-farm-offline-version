# VeeLink Farm - Playwright QA Audit Findings

**Date:** 2026-07-18
**Method:** Automated Playwright (Chromium) walkthrough of every screen + user flow, run against the live Expo web build (`http://localhost:8081`) with injected demo data (12 animals, 4 health records, financial transactions).
**Scope:** Registration, farm creation, dashboard, animals, health, financial, reports, inventory, reminders, breeding, settings, dark mode, responsive layouts, console error monitoring.

Screenshots for every screen are saved in `/images`.

---

## Priority 1 - HIGH (fix before release)

### H1. Currency inconsistency: USD vs NGN mixed across the app
- **Where:** Animals list + animal detail show prices in **USD** (`$1,200`, `$1,800`, `$300`, `$25`...). Dashboard, Financial, and Reports show **NGN** (`NGN 2,620.00`). The dashboard "Expense" quick-action also uses a `$` icon.
- **Impact:** Looks broken/untrustworthy for a finance-tracking app. A user in Nigeria sees their herd valued in `$` but their profit in `NGN`.
- **Root cause:** Animal value/price rendering hardcodes `$` instead of using the shared currency formatter used by the financial module.
- **Fix:** Route all money rendering through one `formatCurrency()` helper driven by a single currency setting.
- **Evidence:** `images/p-animals.png`, `images/p-dashboard.png`, `images/p-financial.png`.

### H2. Confirmation dialogs (`Alert.alert`) silently fail on web
- **Where:** Settings → Load Demo Data, Clear Demo Data, Clear All Data, Reset App; plus every delete confirmation (animal, farm, transaction, reminder, breeding).
- **Impact:** On the **web build**, React Native Web does not render `Alert.alert()` with buttons, so tapping these does nothing - the destructive/confirm action never fires. Demo data cannot be loaded from the UI on web at all.
- **Note:** Works on native iOS/Android. Only affects web, but the web build is what a marketing/demo site would showcase.
- **Fix:** Add a cross-platform confirm (custom Modal component) or a web `window.confirm()` shim for `Alert.alert`.
- **Evidence:** `images/demo-confirm.png` (shows settings, no dialog appeared after clicking "Load Demo Data").

---

## Priority 2 - MEDIUM

### M1. Console error repeated every render: "Unexpected text node: A text node cannot be a child of a <View>"
- **Impact:** Fires 16-76x per session. Indicates a stray string/whitespace rendered directly inside a `<View>` (a `{condition && " "}` or a literal space in JSX). Harmless visually but pollutes logs and can crash on strict native builds.
- **Fix:** Find the component rendering a bare string child (grep for `&& "`/stray spaces in JSX inside Views).

### M2. New modules have no demo data (Inventory, Reminders, Breeding)
- **Where:** With demo data loaded, Animals/Health/Financial populate, but Inventory (0), Reminders (0), and Breeding (0) stay empty.
- **Impact:** These three newer features always look empty in demos/marketing shots, implying they are unfinished.
- **Root cause:** `utils/mockData.ts` predates these modules and was never extended.
- **Fix:** Add mock inventory items, reminders, and breeding records to `mockData.ts` + wire their stores' demo-seed path.

### M3. Date fields on web are plain text inputs (no date picker)
- **Where:** All `DatePickerField` usages on web (animal add/edit, health, financial, inventory, reminders, breeding).
- **Impact:** `DatePickerField` passes `type="date"` to RN-Web `TextInput`, but RN-Web does not forward it, so the browser renders a plain text box. Users must hand-type `YYYY-MM-DD`; no calendar popup, no validation.
- **Fix:** On web, render a real `<input type="date">` (via `createElement` or `dangerouslySetInnerHTML`-free raw element) instead of RN `TextInput`.
- **Evidence:** `images/animal-add-form.png` (custom "YYYY-MM-DD" placeholder, not a native picker).

### M4. Animal images are solid color blocks, not photos
- **Where:** Animals list + detail. Each animal shows a flat species-colored square (brown = cattle, orange = goat, yellow = chicken...).
- **Impact:** Functional as color-coding, but weak for marketing screenshots and app store listings.
- **Fix (optional):** Ship a small set of royalty-free species photos or nicer illustrated species avatars.

---

## Priority 3 - LOW / polish

### L1. Thin unthemed white strip at very top of screens in dark mode
- Minor: a sliver above the header stays light. Theme the safe-area/top container.

### L2. Farm name truncates aggressively in the selector ("Green Vall...")
- The top-right farm selector cuts off at ~10 chars even with space available. Widen or wrap.

### L3. Reports charts sit below the fold
- The BarChart (Income vs Expenses) and DonutChart (species) render below the "Species Breakdown" accordion, so they aren't visible without scrolling. Consider moving one chart above the metrics for immediate visual impact.

---

## What works well (verified)
- Registration 3-step flow (name → password/PIN → biometric fallback) renders and validates cleanly.
- Farm creation, dashboard, animals (2-col on tablet), health, financial, reports all render with correct data.
- **Dark mode works** across dashboard, animals, reports, settings (slate `#1e293b` theme, green accents) - confirmed by computed background colors, not just the toggle.
- Search + species/status filters on Animals work.
- Responsive layouts adapt at mobile (390px), tablet (1024px), desktop (1280px).
- Empty states are well designed with clear CTAs.
- No crashes, no white-screens, no failed navigations across ~20 routes.

---

## Marketing-ready screenshots (in /images)
| File | Screen |
|---|---|
| `p-dashboard.png` | Dashboard with data (light) |
| `dark-dashboard.png` | Dashboard (dark) |
| `p-animals.png` | Animals list (2-col) |
| `dark-animals.png` | Animals (dark) |
| `p-reports.png` / `dark-reports-real.png` | Reports analytics |
| `p-financial.png` | Financial summary |
| `p-health.png` | Health records |
| `p-animal-detail.png` | Animal detail |
| `p-mobile-dashboard.png` / `p-mobile-animals.png` | Mobile views |
| `reg-01-name.png` | Onboarding |
