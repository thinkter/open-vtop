import type { FC } from "hono/jsx";
import { BaseLayout } from "./layouts/Base.js";

export const Dashboard: FC<{ username: string }> = ({ username }) => {
  return (
    <BaseLayout title="Dashboard - Open-VTOP">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h1>Dashboard</h1>
          <p style="color: var(--fg-secondary);">Welcome back, {username}</p>
        </div>
        <div>{/* Todo: Logout logic */}</div>
      </div>

      <div
        hx-get="/api/assignments/html"
        hx-trigger="load"
        hx-target="#assignments-container"
        hx-swap="innerHTML"
      >
        <div id="assignments-container">
          <div
            id="loading-state"
            style="text-align: center; padding: 4rem; color: var(--fg-secondary);"
          >
            <div
              class="spinner"
              style="width: 24px; height: 24px; margin-bottom: 1rem;"
            ></div>
            <p>Syncing assignments...</p>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};
