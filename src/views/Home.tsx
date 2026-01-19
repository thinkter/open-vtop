import type { FC } from "hono/jsx";
import { BaseLayout } from "./layouts/Base.js";

export const Home: FC = () => {
  return (
    <BaseLayout title="Open-VTOP">
      <h1>Open-VTOP</h1>

      <div class="section">
        <h2>VTOP Session Status</h2>
        <button
          hx-get="/api/session/status"
          hx-target="#session-status"
          hx-swap="innerHTML"
          hx-trigger="load, click"
        >
          Refresh Status
        </button>
        <div id="session-status">Loading session status...</div>
      </div>

      <div class="section">
        <h2>Example: Simple Click</h2>
        <button hx-get="/api/hello" hx-target="#result" hx-swap="innerHTML">
          Click Me
        </button>
        <div id="result"></div>
      </div>
    </BaseLayout>
  );
};
