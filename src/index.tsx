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
          style="margin-top: 1rem; padding: 0.75rem; background: rgba(255, 68, 68, 0.1); border: 1px solid var(--error); border-radius: var(--radius); color: var(--error); font-size: 0.9rem;"
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
          style="margin-top: 1rem; padding: 0.75rem; background: rgba(255, 68, 68, 0.1); border: 1px solid var(--error); border-radius: var(--radius); color: var(--error); font-size: 0.9rem;"
        >
          Login failed. Invalid credentials or captcha error.
        </div>,
      );
    }
  } catch (error) {
    return c.html(
      <div
        id="error-message"
        style="margin-top: 1rem; padding: 0.75rem; background: rgba(255, 68, 68, 0.1); border: 1px solid var(--error); border-radius: var(--radius); color: var(--error); font-size: 0.9rem;"
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
      <div style="color: var(--error);">
        Session expired. Please refresh to log in again.
      </div>,
    );
  }

  try {
    const assignments = await sessionManager.fetchUpcomingAssignments();

    if (assignments.length === 0) {
      return c.html(
        <div style="padding: 3rem; text-align: center; background: var(--bg-secondary); border-radius: var(--radius); border: 1px solid var(--border);">
          <div style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;">
            🎉
          </div>
          <h3 style="margin-bottom: 0.5rem;">No Upcoming Assignments</h3>
          <p style="color: var(--fg-secondary);">You are all caught up!</p>
        </div>,
      );
    }

    return c.html(
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        {assignments.map((ass, i) => (
          <div
            key={i}
            class="card"
            style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; transition: background 0.2s;"
          >
            <div style="flex: 1; min-width: 0; padding-right: 1rem;">
              <div style="display: flex; align-items: baseline; gap: 0.75rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
                <span style="font-size: 0.8rem; font-weight: 600; color: var(--fg-secondary); min-width: fit-content;">
                  {ass.courseCode}
                </span>
                <span style="font-weight: 600; font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis;">
                  {ass.assignmentTitle}
                </span>
                <span style="font-size: 0.85rem; color: var(--fg-secondary);">
                  — {ass.courseName}
                </span>
              </div>

              <div style="display: flex; gap: 1rem; margin-top: 0.25rem; font-size: 0.8rem; color: var(--fg-secondary);">
                <span>Due: {ass.dueDate || "N/A"}</span>
                <span>Max: {ass.maxMarks || "N/A"}</span>
              </div>
            </div>

            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.75rem",
                borderRadius: "6px",
                background: ass.status?.toLowerCase().includes("pending")
                  ? "rgba(255, 68, 68, 0.1)"
                  : "rgba(0, 112, 243, 0.1)",
                color: ass.status?.toLowerCase().includes("pending")
                  ? "var(--error)"
                  : "var(--success)",
                fontWeight: "500",
                whiteSpace: "nowrap",
              }}
            >
              {ass.status || "Pending"}
            </span>
          </div>
        ))}
      </div>,
    );
  } catch (error) {
    return c.html(
      <div style="padding: 1rem; border: 1px solid var(--error); border-radius: var(--radius); color: var(--error);">
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
