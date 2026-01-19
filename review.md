# Open-VTOP Deep Review (2026-01-19)

## Executive summary
The project already demonstrates a fast local UI, but it is not yet ready for a reliable `npx open-vtop` experience. The biggest risks are packaging (no CLI entrypoint), incorrect login success detection, and exposing sensitive session data via local endpoints/logs. Below are concrete issues with suggested code-level fixes.

---

## High priority issues (blockers for `npx` + local-first reliability)

### 1) No CLI entrypoint for `npx open-vtop`
**Where:** `package.json` (no `bin`, no `files`, no `prepack`/`prepare`)  
**Impact:** `npx open-vtop` cannot execute the app; users won’t get the local UI.  
**Fix:** Add a CLI entrypoint and publish the build output.
- Add `bin` (e.g., `"open-vtop": "dist/cli.js"`).
- Add a tiny `src/cli.ts` (or `bin/open-vtop`) with a shebang that imports/starts the server.
- Add `prepare`/`prepack` to run `tsc` so `dist/` exists when published.
- Add `files: ["dist", "README.md", "LICENSE"]` to ensure assets ship.

### 2) Static HTMX asset path breaks outside repo root
**Where:** `src/index.tsx` (serveStatic path to `./node_modules/...`)  
**Impact:** Running from `npx` or any non-repo cwd will fail to serve HTMX, breaking the UI.  
**Fix:** Resolve the HTMX path relative to the module file:
- Use `new URL("../node_modules/htmx.org/dist/htmx.min.js", import.meta.url)` or
- Bundle the asset into `dist/` and serve from there.

### 3) Login success is assumed without verification
**Where:** `src/session-manager.ts` (`login` sets `loggedIn = true` right after POST)  
**Impact:** False-positive logins; downstream calls (assignments, post-login navigation) may silently fail.  
**Fix:** Only set `loggedIn = true` after confirming success. Options:
- Call `navigatePostLogin()` and verify a known authenticated page.
- Check login response HTML for a known success marker.
- If verification fails, clear state and return `false`.

### 4) Sensitive session data exposed via local endpoints
**Where:** `src/index.tsx` (`/api/session/status` returns CSRF + cookies)  
**Impact:** Anyone on the machine can access token/cookie values; risk if running on shared device.  
**Fix:** Redact or remove sensitive values. Return booleans/metadata only (e.g., “has CSRF: true”).

### 5) Debug logs + raw assignment response expose PII
**Where:** `src/index.tsx` (debug logs endpoints), `src/session-manager.ts` (logs raw assignment response)  
**Impact:** User data is printed and publicly readable via local endpoints.  
**Fix:**
- Remove or mask usernames/registration numbers in logs.
- Gate debug endpoints behind a flag (e.g., `DEBUG_LOGS=1`).
- Do not log full assignment response body unless explicitly enabled.

---

## Medium priority issues (robustness + maintainability)

### 6) CAPTCHA debug files are always written to cwd
**Where:** `src/session-manager.ts` (writes `captcha.jpg` and `failed_captcha_data.txt`)  
**Impact:** Pollutes user directory; may store sensitive data.  
**Fix:** Only write when `DEBUG_CAPTCHA=1`, or write to `os.tmpdir()`.

### 7) Cookie parsing relies on `getSetCookie()` only
**Where:** `src/session-manager.ts` (`storeCookies`)  
**Impact:** `getSetCookie()` isn’t available in all environments; cookies may be missed.  
**Fix:** Fallback to `headers.get("set-cookie")` and split on comma carefully (or use a cookie parser).

### 8) Inconsistent request headers / user agents
**Where:** `fetchWithCookies` vs `navigatePostLogin`  
**Impact:** Varying UA strings can trigger unexpected server behavior.  
**Fix:** Centralize header construction and reuse a single UA string across requests.

### 9) `fetchUpcomingAssignments` ignores `navigatePostLogin()` result
**Where:** `src/session-manager.ts`  
**Impact:** If navigation fails, assignments call still proceeds, returning confusing errors.  
**Fix:** If `navigatePostLogin()` returns `false`, stop and return a clear error.

---

## Low priority / quality improvements

### 10) Hard-coded port
**Where:** `src/index.tsx` (`port: 6767`)  
**Fix:** Allow `PORT` env var or CLI flag to support `npx` usage on occupied ports.

### 11) Regex-based HTML parsing is brittle
**Where:** `parseAssignmentsHtml`  
**Fix:** Prefer a structured endpoint if one exists; otherwise use a lightweight HTML parser to avoid malformed tag issues.

### 12) Singleton session model
**Where:** `sessionManager` singleton  
**Impact:** Any future multi-user scenario will mix sessions.  
**Fix:** Document single-user assumption or implement per-session storage if multi-user is expected.

---

## Suggested next steps (in order)
1. Add CLI entrypoint + build/publish pipeline for `npx`.
2. Fix HTMX asset path to be independent of cwd.
3. Harden login success verification.
4. Redact sensitive session fields and gate debug logs behind a flag.
5. Gate CAPTCHA file writing and reduce raw response logging.

If you want, I can convert these into actual PR-ready fixes in a follow-up.
