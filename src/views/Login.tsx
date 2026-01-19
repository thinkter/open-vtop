import type { FC } from "hono/jsx";
import { BaseLayout } from "./layouts/Base.js";

export const Login: FC = () => {
  return (
    <BaseLayout title="Login - Open-VTOP">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1>Log In</h1>
        <p style="color: var(--fg-secondary);">
          Enter your VTOP credentials to continue.
        </p>
      </div>

      <div class="card">
        <form
          id="login-form"
          hx-post="/api/login/form"
          hx-target="body"
          hx-swap="outerHTML"
          hx-indicator="#loading-indicator"
        >
          <div style="margin-bottom: 1.5rem;">
            <label class="label" for="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="e.g. johndoe"
              required
              autofocus
            />
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label class="label" for="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div style="margin-bottom: 2rem;">
            <label class="label" for="regNo">
              Registration Number
            </label>
            <input type="text" id="regNo" name="regNo" required />
          </div>

          <button type="submit" id="login-btn">
            Log In
          </button>

          <div
            id="loading-indicator"
            class="htmx-indicator"
            style="margin-top: 1rem; text-align: center; color: var(--fg-secondary); font-size: 0.9rem;"
          >
            <div class="spinner"></div> Authenticating with VTOP...
          </div>

          <div id="error-message"></div>
        </form>
      </div>

      <div style="text-align: center; margin-top: 2rem; color: var(--fg-secondary); font-size: 0.8rem;">
        <p>Open-VTOP &copy; 2026</p>
      </div>
    </BaseLayout>
  );
};
