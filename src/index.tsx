#!/usr/bin/env node
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { Home } from "./views/Home.js";
import { SuccessMessage } from "./views/partials.js";
import { sessionManager } from "./session-manager.js";
import { readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const app = new Hono();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve htmx from node_modules - resolve absolute path
const htmxPath = join(__dirname, "../node_modules/htmx.org/dist/htmx.min.js");

app.get("/static/htmx.js", async (c) => {
  try {
    const content = await readFile(htmxPath);
    return c.body(content, 200, {
      "Content-Type": "application/javascript",
    });
  } catch (e) {
    console.error("Failed to serve HTMX:", e);
    return c.text("Failed to load HTMX", 500);
  }
});

// Main page
app.get("/", (c) => {
  return c.html(<Home />);
});

// API Endpoints
app.get("/api/hello", (c) => {
  return c.html(<SuccessMessage message="Hello from HTMX!" />);
});

// Session status endpoint
app.get("/api/session/status", (c) => {
  const state = sessionManager.getState();
  const status = state.initialized ? "✅ Initialized" : "❌ Not Initialized";
  const lastInit = state.lastInitialized
    ? new Date(state.lastInitialized).toLocaleString()
    : "Never";

  // Redact sensitive values for security
  const hasCsrf = !!state.csrf;
  const hasJsession = state.cookies.has("JSESSIONID");
  const hasServerId = state.cookies.has("SERVERID");

  return c.html(
    <div style="font-family: monospace; padding: 1rem; background: #f5f5f5; border-radius: 4px; color: #000;">
      <div style="margin-bottom: 0.5rem;">
        <strong>Status:</strong> {status}
      </div>
      <div style="margin-bottom: 0.5rem;">
        <strong>Last Initialized:</strong> {lastInit}
      </div>
      <div style="margin-bottom: 0.5rem;">
        <strong>Total Cookies:</strong> {state.cookies.size}
      </div>
      <div style="margin-bottom: 0.5rem;">
        <strong>CSRF Token:</strong> {hasCsrf ? "✅ Present" : "❌ Missing"}
      </div>
      <div style="margin-bottom: 0.5rem;">
        <strong>JSESSIONID:</strong> {hasJsession ? "✅ Present" : "❌ Missing"}
      </div>
      <div>
        <strong>SERVERID:</strong> {hasServerId ? "✅ Present" : "❌ Missing"}
      </div>
    </div>,
  );
});

// Manual session refresh endpoint
app.post("/api/session/refresh", async (c) => {
  try {
    await sessionManager.refresh();
    return c.json({ success: true, message: "Session refreshed successfully" });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Login endpoint
app.post("/api/login", async (c) => {
  try {
    const body = await c.req.json();
    const { username, password, regNo } = body;

    if (!username || !password || !regNo) {
      return c.json(
        {
          success: false,
          error: "Username, password, and registration number are required",
        },
        400,
      );
    }

    console.log(`🔐 Login requested for user: ${username} (${regNo})`);
    const success = await sessionManager.login(username, password, regNo);

    if (success) {
      return c.json({
        success: true,
        message: "Login successful",
        username: sessionManager.getUsername(),
      });
    } else {
      return c.json(
        {
          success: false,
          error: "Login failed - check credentials or try again",
        },
        401,
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Login status endpoint
app.get("/api/login/status", (c) => {
  return c.json({
    loggedIn: sessionManager.isLoggedIn(),
    username: sessionManager.getUsername(),
  });
});

// Login status HTML endpoint
app.get("/api/login/status/html", (c) => {
  const isLoggedIn = sessionManager.isLoggedIn();
  const username = sessionManager.getUsername();

  if (isLoggedIn) {
    return c.html(
      <div style="padding: 1rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;">
        <strong>✅ Logged In</strong>
        <div style="margin-top: 0.5rem;">
          Username: <code>{username}</code>
        </div>
      </div>,
    );
  } else {
    return c.html(
      <div style="padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
        <strong>❌ Not Logged In</strong>
        <div style="margin-top: 0.5rem;">Please use the login form above.</div>
      </div>,
    );
  }
});

// Debug logs storage
const debugLogs: { timestamp: string; level: string; message: string }[] = [];

function addDebugLog(level: string, message: string) {
  // Only log if specifically enabled
  if (process.env.DEBUG_LOGS === "true") {
    const timestamp = new Date().toLocaleTimeString();
    debugLogs.push({ timestamp, level, message });
    // Keep only last 100 logs
    if (debugLogs.length > 100) {
      debugLogs.shift();
    }
    console.log(`[${level}] ${message}`);
  }
}

// Form-based login endpoint (for HTMX)
app.post("/api/login/form", async (c) => {
  try {
    const formData = await c.req.parseBody();
    const username = formData["username"] as string;
    const password = formData["password"] as string;
    const regNo = formData["regNo"] as string;

    if (!username || !password || !regNo) {
      addDebugLog("ERROR", "Login attempt with missing credentials");
      return c.html(
        <div style="padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
          <strong>❌ Error:</strong> Username, password, and registration number
          are required.
        </div>,
      );
    }

    // Don't log credentials even in debug
    addDebugLog("INFO", "Login requested");

    // Show that login is in progress
    const startTime = Date.now();
    addDebugLog("INFO", "Starting login process - polling for text CAPTCHA...");

    const success = await sessionManager.login(username, password, regNo);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (success) {
      addDebugLog("SUCCESS", `Login successful (took ${duration}s)`);
      return c.html(
        <div style="padding: 1rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;">
          <strong>🎉 Login Successful!</strong>
          <div style="margin-top: 0.5rem;">
            Welcome, <strong>{username}</strong>
          </div>
          <div style="margin-top: 0.25rem; font-size: 0.85rem;">
            Login took {duration} seconds
          </div>
        </div>,
      );
    } else {
      addDebugLog("ERROR", `Login failed (took ${duration}s)`);
      return c.html(
        <div style="padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
          <strong>❌ Login Failed</strong>
          <div style="margin-top: 0.5rem;">
            Check your credentials or try again. VTOP might be showing
            reCAPTCHA.
          </div>
          <div style="margin-top: 0.25rem; font-size: 0.85rem;">
            Attempt took {duration} seconds
          </div>
        </div>,
      );
    }
  } catch (error) {
    addDebugLog("ERROR", `Login exception: ${String(error)}`);
    return c.html(
      <div style="padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
        <strong>❌ Error:</strong> {String(error)}
      </div>,
    );
  }
});

// Debug logs endpoint
app.get("/api/debug/logs", (c) => {
  if (process.env.DEBUG_LOGS !== "true") {
    return c.html(
      <div style="color: #888;">
        Debug logs are disabled. Set DEBUG_LOGS=true to enable.
      </div>,
    );
  }

  if (debugLogs.length === 0) {
    return c.html(
      <div style="color: #888;">
        No logs yet. Try logging in to see debug output.
      </div>,
    );
  }

  return c.html(
    <div>
      {debugLogs.map((log, i) => (
        <div
          key={i}
          style={{
            color:
              log.level === "ERROR"
                ? "#ff6b6b"
                : log.level === "SUCCESS"
                  ? "#51cf66"
                  : log.level === "WARN"
                    ? "#fcc419"
                    : "#0f0",
            marginBottom: "0.25rem",
          }}
        >
          <span style="color: #888;">[{log.timestamp}]</span>{" "}
          <span style="font-weight: bold;">[{log.level}]</span> {log.message}
        </div>
      ))}
    </div>,
  );
});

// Clear debug logs endpoint
app.post("/api/debug/logs/clear", (c) => {
  debugLogs.length = 0;
  return c.html(<div style="color: #888;">Logs cleared.</div>);
});

// Assignments JSON endpoint
app.get("/api/assignments", async (c) => {
  if (!sessionManager.isLoggedIn()) {
    return c.json({ success: false, error: "Not logged in" }, 401);
  }

  try {
    const assignments = await sessionManager.fetchUpcomingAssignments();
    return c.json({ success: true, assignments });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Assignments HTML endpoint (for HTMX)
app.get("/api/assignments/html", async (c) => {
  if (!sessionManager.isLoggedIn()) {
    return c.html(
      <div style="padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
        <strong>❌ Not Logged In</strong>
        <div style="margin-top: 0.5rem;">
          Please log in first to see your assignments.
        </div>
      </div>,
    );
  }

  try {
    const assignments = await sessionManager.fetchUpcomingAssignments();

    if (assignments.length === 0) {
      return c.html(
        <div style="padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎉</div>
          <strong style="font-size: 1.25rem;">No Upcoming Assignments!</strong>
          <div style="margin-top: 0.5rem; opacity: 0.9;">
            You're all caught up. Time to relax!
          </div>
        </div>,
      );
    }

    return c.html(
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="padding: 0.75rem 1rem; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 8px; color: white; font-weight: bold;">
          📚 {assignments.length} Upcoming Assignment
          {assignments.length > 1 ? "s" : ""}
        </div>
        {assignments.map((ass, i) => (
          <div
            key={i}
            style={{
              padding: "1rem",
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            }}
          >
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <div>
                <div style="font-size: 0.85rem; color: #64ffda; font-weight: 600;">
                  {ass.courseCode}
                </div>
                <div style="font-size: 0.8rem; color: #aaa;">
                  {ass.courseName}
                </div>
              </div>
              <div
                style={{
                  padding: "0.25rem 0.75rem",
                  background: ass.status?.toLowerCase().includes("pending")
                    ? "#ff6b6b"
                    : "#4CAF50",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                {ass.status || "Pending"}
              </div>
            </div>
            <div style="font-weight: bold; font-size: 1rem; margin-bottom: 0.5rem;">
              {ass.assignmentTitle}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #aaa;">
              <span>📅 Due: {ass.dueDate || "N/A"}</span>
              <span>📊 Max: {ass.maxMarks || "N/A"} marks</span>
            </div>
          </div>
        ))}
      </div>,
    );
  } catch (error) {
    return c.html(
      <div style="padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
        <strong>❌ Error:</strong> {String(error)}
      </div>,
    );
  }
});

const port = Number(process.env.PORT) || 6767;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`🚀 Server is running on http://localhost:${info.port}`);
    console.log(
      `📊 Session status: http://localhost:${info.port}/api/session/status`,
    );
  },
);
