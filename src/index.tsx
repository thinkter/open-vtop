#!/usr/bin/env node
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { Login } from "./views/Login.js";
import { Dashboard } from "./views/Dashboard.js";
import { sessionManager } from "./session-manager.js";
import { createRequire } from "module";

const app = new Hono();
const require = createRequire(import.meta.url);
const htmxPath = require.resolve("htmx.org/dist/htmx.min.js");

// Serve htmx
app.use("/static/htmx.js", serveStatic({ path: htmxPath }));

// Main Entry Point
app.get("/", (c) => {
  if (sessionManager.isLoggedIn()) {
    return c.html(<Dashboard username={sessionManager.getUsername()!} />);
  }
  return c.html(<Login />);
});

// Login Form Handling
app.post("/api/login/form", async (c) => {
  try {
    const formData = await c.req.parseBody();
    const username = formData["username"] as string;
    const password = formData["password"] as string;
    const regNo = formData["regNo"] as string;

    if (!username || !password || !regNo) {
      return c.html(
        <div
          id="error-message"
          class="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-500 text-sm"
        >
          Missing credentials. Please try again.
        </div>,
      );
    }

    const success = await sessionManager.login(username, password, regNo);

    if (success) {
      // Return the Dashboard HTML to replace the entire body
      return c.html(<Dashboard username={username} />);
    } else {
      return c.html(
        <div
          id="error-message"
          class="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-500 text-sm"
        >
          Login failed. Invalid credentials or captcha error.
        </div>,
      );
    }
  } catch (error) {
    return c.html(
      <div
        id="error-message"
        class="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-500 text-sm"
      >
        Server error: {String(error)}
      </div>,
    );
  }
});

// Assignments HTML Endpoint (for Dashboard)
app.get("/api/assignments/html", async (c) => {
  if (!sessionManager.isLoggedIn()) {
    // If session expired, redirect/render login
    return c.html(
      <div class="text-red-500">
        Session expired. Please refresh to log in again.
      </div>,
    );
  }

  try {
    const assignments = await sessionManager.fetchUpcomingAssignments();

    if (assignments.length === 0) {
      return c.html(
        <div class="p-12 text-center bg-surface border border-border rounded-lg">
          <div class="text-4xl mb-4 opacity-50">🎉</div>
          <h3 class="text-lg font-medium mb-2">No Upcoming Assignments</h3>
          <p class="text-muted">You are all caught up!</p>
        </div>,
      );
    }

    return c.html(
      <div class="flex flex-col gap-3">
        {assignments.map((ass, i) => (
          <div
            key={i}
            class="flex items-center justify-between p-4 bg-surface border border-border rounded-lg transition-colors hover:border-muted group"
          >
            <div class="flex-1 min-w-0 pr-4">
              <div class="flex items-baseline gap-3 overflow-hidden whitespace-nowrap text-ellipsis">
                <span class="text-xs font-bold text-muted uppercase tracking-wider min-w-fit">
                  {ass.courseCode}
                </span>
                <span class="font-semibold text-sm truncate">
                  {ass.assignmentTitle}
                </span>
                <span class="text-xs text-muted">— {ass.courseName}</span>
              </div>

              <div class="flex gap-4 mt-1 text-xs text-muted">
                <span>
                  Due:{" "}
                  <span class="text-foreground">{ass.dueDate || "N/A"}</span>
                </span>
                <span>
                  Max:{" "}
                  <span class="text-foreground">{ass.maxMarks || "N/A"}</span>
                </span>
              </div>
            </div>

            <span
              class={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                ass.status?.toLowerCase().includes("pending")
                  ? "bg-red-500/10 text-red-500 border border-red-500/20"
                  : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
              }`}
            >
              {ass.status || "Pending"}
            </span>
          </div>
        ))}
      </div>,
    );
  } catch (error) {
    return c.html(
      <div class="p-4 border border-red-500 rounded-md text-red-500">
        Failed to load assignments: {String(error)}
      </div>,
    );
  }
});

serve(
  {
    fetch: app.fetch,
    port: 6767,
  },
  (info) => {
    console.log(`🚀 Server is running on http://localhost:${info.port}`);
  },
);
