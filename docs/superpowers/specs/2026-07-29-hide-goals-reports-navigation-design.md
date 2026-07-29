# Hide Goals and Reports Navigation Design

## Goal

Remove the “Mục tiêu” and “Báo cáo” entries from the authenticated user's sidebar navigation.

## Scope

- Remove only the `goals` and `reports` items from the `navigation` array in `ApplicationShell`.
- Remove icon imports that become unused.
- Keep the screens, route mappings, and screen types unchanged.
- Do not modify the existing logout changes or the user's `.vscode/` files.

## Verification

Run TypeScript type-checking and the production build. Confirm the diff contains only the intended navigation removal.
