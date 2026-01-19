import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { Home } from "./views/Home.js";
import { SuccessMessage } from "./views/partials.js";
import { sessionManager } from "./session-manager.js";
const app = new Hono();
// Serve htmx from node_modules
app.use("/static/htmx.js", serveStatic({ path: "./node_modules/htmx.org/dist/htmx.min.js" }));
// Main page
app.get("/", (c) => {
    return c.html(_jsx(Home, {}));
});
// API Endpoints
app.get("/api/hello", (c) => {
    return c.html(_jsx(SuccessMessage, { message: "Hello from HTMX!" }));
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
    return c.html(_jsxs("div", { style: "font-family: monospace; padding: 1rem; background: #f5f5f5; border-radius: 4px; color: #000;", children: [_jsxs("div", { style: "margin-bottom: 0.5rem;", children: [_jsx("strong", { children: "Status:" }), " ", status] }), _jsxs("div", { style: "margin-bottom: 0.5rem;", children: [_jsx("strong", { children: "Last Initialized:" }), " ", lastInit] }), _jsxs("div", { style: "margin-bottom: 0.5rem;", children: [_jsx("strong", { children: "Total Cookies:" }), " ", state.cookies.size] }), _jsxs("div", { style: "margin-bottom: 0.5rem;", children: [_jsx("strong", { children: "CSRF Token:" }), " ", csrfToken] }), _jsxs("div", { style: "margin-bottom: 0.5rem;", children: [_jsx("strong", { children: "JSESSIONID:" }), " ", jsessionid] }), _jsxs("div", { children: [_jsx("strong", { children: "SERVERID:" }), " ", serverid] })] }));
});
// Manual session refresh endpoint
app.post("/api/session/refresh", async (c) => {
    try {
        await sessionManager.refresh();
        return c.json({ success: true, message: "Session refreshed successfully" });
    }
    catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});
serve({
    fetch: app.fetch,
    port: 3000,
}, (info) => {
    console.log(`🚀 Server is running on http://localhost:${info.port}`);
    console.log(`📊 Session status: http://localhost:${info.port}/api/session/status`);
});
