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

      <div class="space-y-8">
        {/* Course Details Section */}
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Course Details</h2>
            <span class="text-xs text-muted bg-surface border border-border px-2 py-1 rounded">
              Winter Semester 2025-26
            </span>
          </div>
          <div
            hx-get="/api/courses/html"
            hx-trigger="htmx:afterOnLoad from:#assignments-loader"
            hx-swap="innerHTML"
            class="w-full"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  class="h-32 bg-surface/50 border border-border rounded-lg"
                ></div>
              ))}
            </div>
          </div>
        </section>

        {/* Assignments Section */}
        <section>
          <h2 class="text-lg font-semibold mb-4">Assignments</h2>
          <div
            id="assignments-loader"
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
        </section>
      </div>
    </BaseLayout>
  );
};
