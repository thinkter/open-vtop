import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { Home } from "./views/Home.js";
import { SuccessMessage } from "./views/partials.js";
import { sessionManager } from "./session-manager.js";

const app = new Hono();

// Serve htmx from node_modules
app.use(
  "/static/htmx.js",
  serveStatic({ path: "./node_modules/htmx.org/dist/htmx.min.js" }),
);

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

  const csrfToken = state.csrf || "None";
  const jsessionid = state.cookies.get("JSESSIONID") || "None";
  const serverid = state.cookies.get("SERVERID") || "None";

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
        <strong>CSRF Token:</strong> {csrfToken}
      </div>
      <div style="margin-bottom: 0.5rem;">
        <strong>JSESSIONID:</strong> {jsessionid}
      </div>
      <div>
        <strong>SERVERID:</strong> {serverid}
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

serve(
  {
    fetch: app.fetch,
    port: 6767,
  },
  (info) => {
    console.log(`🚀 Server is running on http://localhost:${info.port}`);
    console.log(
      `📊 Session status: http://localhost:${info.port}/api/session/status`,
    );
  },
);
