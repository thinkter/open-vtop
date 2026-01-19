import type { FC } from "hono/jsx";
import { BaseLayout } from "./layouts/Base.js";

export const Dashboard: FC<{ username: string }> = ({ username }) => {
  return (
    <BaseLayout title="Dashboard - Open-VTOP">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p class="text-muted text-sm">Welcome back, {username}</p>
        </div>
        <div>{/* Todo: Logout logic */}</div>
      </div>

      <div
        hx-get="/api/assignments/html"
        hx-trigger="load"
        hx-target="#assignments-container"
        hx-swap="innerHTML"
        class="w-full"
      >
        <div id="assignments-container" class="space-y-4">
          <div id="loading-state" class="text-center py-16 text-muted">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-muted border-t-white mb-4"></div>
            <p class="text-sm">Syncing assignments...</p>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};
