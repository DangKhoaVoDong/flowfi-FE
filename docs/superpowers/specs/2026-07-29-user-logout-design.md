# FlowFi User Logout Design

## Goal

Give authenticated FlowFi users an accessible logout action from the account area in the application header.

## Scope

- Turn the existing user identity block in `ApplicationShell` into an account-menu trigger.
- Show two menu actions: Settings and Logout.
- Reuse `AuthContext.logout`; do not duplicate token or API handling in the UI.
- Redirect to the landing/login screen after authentication state becomes unauthenticated.
- Support closing the menu by clicking outside or pressing Escape.
- Disable repeated logout attempts and show a loading label while logout is running.

Admin screens and the landing page are outside this change.

## Component Design

`ApplicationShell` owns the account menu because it already renders the authenticated user's identity and receives the navigation callback.

The component will:

1. Read `logout` from `useAuth`.
2. Track whether the menu is open and whether logout is in progress.
3. Open or close the menu from an accessible button.
4. Navigate to Settings through the existing `navigate` helper.
5. Await `logout` when the Logout action is selected.

`AppContent` will respond to the authenticated-to-unauthenticated transition by replacing browser history with the landing route and updating `currentScreen`. Using `replaceState` prevents Back from reopening a protected screen immediately after logout.

## Error Handling

`authService.logout` already clears local tokens in a `finally` block, and `AuthContext.logout` always resets auth state. The UI therefore completes local logout even if the server request fails. No error toast is needed for this scoped change because the user is securely logged out locally.

## Accessibility and Interaction

- The identity trigger uses `aria-haspopup`, `aria-expanded`, and a descriptive label.
- The menu uses menu semantics and clear Vietnamese labels.
- Escape and outside-click close the menu.
- The Logout action is disabled while processing.
- Existing responsive header behavior is preserved.

## Testing

Add focused tests for:

- Mapping an unauthenticated transition to the landing route.
- Account-menu behavior and logout wiring where supported by the current test setup.
- Type checking and production build.

If the repository's current setup cannot render React component tests without adding a test framework, keep the behavioral routing logic in a small pure function and test it using the lightest available runner rather than expanding project dependencies solely for this change.
