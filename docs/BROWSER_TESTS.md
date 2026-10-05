# Browser smoke tests

Critical PWA user flows are checked in a real Chromium runtime with Playwright. The browser gate complements Node regression tests and runtime diagnostics; it does not replace either.

The initial mobile smoke covers application startup, main-menu input, Settings/Debug navigation and creation of a new world with a mounted game screen. Browser tests run with one worker for deterministic state and start a local static server through Playwright webServer.
