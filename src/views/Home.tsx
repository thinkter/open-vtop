import type { FC } from "hono/jsx";
import { BaseLayout } from "./layouts/Base.js";

export const Home: FC = () => {
  return (
    <BaseLayout title="Open-VTOP">
      <h1>Open-VTOP</h1>

      <div class="section">
        <h2>🔐 Login to VTOP</h2>
        <form
          id="login-form"
          style="display: flex; flex-direction: column; gap: 0.75rem; max-width: 400px;"
        >
          <div>
            <label
              for="username"
              style="display: block; margin-bottom: 0.25rem; font-weight: bold;"
            >
              Username:
            </label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your VTOP username"
              style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;"
              required
            />
          </div>
          <div>
            <label
              for="password"
              style="display: block; margin-bottom: 0.25rem; font-weight: bold;"
            >
              Password:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;"
              required
            />
          </div>
          <div>
            <label
              for="regNo"
              style="display: block; margin-bottom: 0.25rem; font-weight: bold;"
            >
              Registration Number:
            </label>
            <input
              type="text"
              id="regNo"
              name="regNo"
              placeholder="e.g. 24BCI0150"
              style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;"
              required
            />
          </div>
          <button
            type="submit"
            hx-post="/api/login/form"
            hx-target="#login-result"
            hx-swap="innerHTML"
            hx-include="#login-form"
            style="padding: 0.75rem; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; font-weight: bold;"
          >
            🚀 Login
          </button>
        </form>
        <div id="login-result" style="margin-top: 1rem;"></div>
      </div>

      <div class="section">
        <h2>📊 Login Status</h2>
        <button
          hx-get="/api/login/status/html"
          hx-target="#login-status"
          hx-swap="innerHTML"
          hx-trigger="load, click"
        >
          Refresh Login Status
        </button>
        <div id="login-status">Loading...</div>
      </div>

      <div class="section">
        <h2>📚 Upcoming Assignments</h2>
        <button
          hx-get="/api/assignments/html"
          hx-target="#assignments-list"
          hx-swap="innerHTML"
          hx-indicator="#assignments-loading"
          style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: bold; cursor: pointer;"
        >
          🔄 Load Assignments
        </button>
        <span
          id="assignments-loading"
          class="htmx-indicator"
          style="margin-left: 0.5rem; color: #aaa;"
        >
          Loading...
        </span>
        <div id="assignments-list" style="margin-top: 1rem;">
          <div style="color: #888; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
            Click "Load Assignments" to fetch your upcoming assignments from
            VTOP.
          </div>
        </div>
      </div>

      <div class="section">
        <h2>🔧 Session Status</h2>
        <button
          hx-get="/api/session/status"
          hx-target="#session-status"
          hx-swap="innerHTML"
          hx-trigger="load, click"
        >
          Refresh Session Status
        </button>
        <div id="session-status">Loading session status...</div>
      </div>

      <div class="section">
        <h2>📝 Debug Logs</h2>
        <button
          hx-get="/api/debug/logs"
          hx-target="#debug-logs"
          hx-swap="innerHTML"
          hx-trigger="click"
        >
          Load Debug Logs
        </button>
        <button
          hx-post="/api/debug/logs/clear"
          hx-target="#debug-logs"
          hx-swap="innerHTML"
          style="margin-left: 0.5rem; background: #ff6b6b;"
        >
          Clear Logs
        </button>
        <div
          id="debug-logs"
          style="margin-top: 1rem; max-height: 400px; overflow-y: auto; background: #1e1e1e; color: #0f0; font-family: monospace; padding: 1rem; border-radius: 4px; font-size: 0.85rem;"
        >
          Click "Load Debug Logs" to see login attempts...
        </div>
      </div>
    </BaseLayout>
  );
};
