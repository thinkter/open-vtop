#!/usr/bin/env node
import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { Home } from "./views/Home.js";
import { SuccessMessage } from "./views/partials.js";
import { sessionManager } from "./session-manager.js";
const app = new Hono();
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const htmxPath = require.resolve("htmx.org/dist/htmx.min.js");
// Serve htmx from node_modules
app.use("/static/htmx.js", serveStatic({ path: htmxPath }));
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
// Login endpoint
app.post("/api/login", async (c) => {
    try {
        const body = await c.req.json();
        const { username, password, regNo } = body;
        if (!username || !password || !regNo) {
            return c.json({
                success: false,
                error: "Username, password, and registration number are required",
            }, 400);
        }
        console.log(`🔐 Login requested for user: ${username} (${regNo})`);
        const success = await sessionManager.login(username, password, regNo);
        if (success) {
            return c.json({
                success: true,
                message: "Login successful",
                username: sessionManager.getUsername(),
            });
        }
        else {
            return c.json({
                success: false,
                error: "Login failed - check credentials or try again",
            }, 401);
        }
    }
    catch (error) {
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
        return c.html(_jsxs("div", { style: "padding: 1rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;", children: [_jsx("strong", { children: "\u2705 Logged In" }), _jsxs("div", { style: "margin-top: 0.5rem;", children: ["Username: ", _jsx("code", { children: username })] })] }));
    }
    else {
        return c.html(_jsxs("div", { style: "padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;", children: [_jsx("strong", { children: "\u274C Not Logged In" }), _jsx("div", { style: "margin-top: 0.5rem;", children: "Please use the login form above." })] }));
    }
});
// Debug logs storage
const debugLogs = [];
function addDebugLog(level, message) {
    const timestamp = new Date().toLocaleTimeString();
    debugLogs.push({ timestamp, level, message });
    // Keep only last 100 logs
    if (debugLogs.length > 100) {
        debugLogs.shift();
    }
    console.log(`[${level}] ${message}`);
}
// Form-based login endpoint (for HTMX)
app.post("/api/login/form", async (c) => {
    try {
        const formData = await c.req.parseBody();
        const username = formData["username"];
        const password = formData["password"];
        const regNo = formData["regNo"];
        if (!username || !password || !regNo) {
            addDebugLog("ERROR", "Login attempt with missing credentials");
            return c.html(_jsxs("div", { style: "padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;", children: [_jsx("strong", { children: "\u274C Error:" }), " Username, password, and registration number are required."] }));
        }
        addDebugLog("INFO", `Login requested for user: ${username} (${regNo})`);
        // Show that login is in progress
        const startTime = Date.now();
        addDebugLog("INFO", "Starting login process - polling for text CAPTCHA...");
        const success = await sessionManager.login(username, password, regNo);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        if (success) {
            addDebugLog("SUCCESS", `Login successful for ${username} (took ${duration}s)`);
            return c.html(_jsxs("div", { style: "padding: 1rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;", children: [_jsx("strong", { children: "\uD83C\uDF89 Login Successful!" }), _jsxs("div", { style: "margin-top: 0.5rem;", children: ["Welcome, ", _jsx("strong", { children: username })] }), _jsxs("div", { style: "margin-top: 0.25rem; font-size: 0.85rem;", children: ["Login took ", duration, " seconds"] })] }));
        }
        else {
            addDebugLog("ERROR", `Login failed for ${username} (took ${duration}s)`);
            return c.html(_jsxs("div", { style: "padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;", children: [_jsx("strong", { children: "\u274C Login Failed" }), _jsx("div", { style: "margin-top: 0.5rem;", children: "Check your credentials or try again. VTOP might be showing reCAPTCHA." }), _jsxs("div", { style: "margin-top: 0.25rem; font-size: 0.85rem;", children: ["Attempt took ", duration, " seconds"] })] }));
        }
    }
    catch (error) {
        addDebugLog("ERROR", `Login exception: ${String(error)}`);
        return c.html(_jsxs("div", { style: "padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;", children: [_jsx("strong", { children: "\u274C Error:" }), " ", String(error)] }));
    }
});
// Debug logs endpoint
app.get("/api/debug/logs", (c) => {
    if (debugLogs.length === 0) {
        return c.html(_jsx("div", { style: "color: #888;", children: "No logs yet. Try logging in to see debug output." }));
    }
    return c.html(_jsx("div", { children: debugLogs.map((log, i) => (_jsxs("div", { style: {
                color: log.level === "ERROR"
                    ? "#ff6b6b"
                    : log.level === "SUCCESS"
                        ? "#51cf66"
                        : log.level === "WARN"
                            ? "#fcc419"
                            : "#0f0",
                marginBottom: "0.25rem",
            }, children: [_jsxs("span", { style: "color: #888;", children: ["[", log.timestamp, "]"] }), " ", _jsxs("span", { style: "font-weight: bold;", children: ["[", log.level, "]"] }), " ", log.message] }, i))) }));
});
// Clear debug logs endpoint
app.post("/api/debug/logs/clear", (c) => {
    debugLogs.length = 0;
    return c.html(_jsx("div", { style: "color: #888;", children: "Logs cleared." }));
});
// Assignments JSON endpoint
app.get("/api/assignments", async (c) => {
    if (!sessionManager.isLoggedIn()) {
        return c.json({ success: false, error: "Not logged in" }, 401);
    }
    try {
        const assignments = await sessionManager.fetchUpcomingAssignments();
        return c.json({ success: true, assignments });
    }
    catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});
// Assignments HTML endpoint (for HTMX)
app.get("/api/assignments/html", async (c) => {
    if (!sessionManager.isLoggedIn()) {
        return c.html(_jsxs("div", { style: "padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;", children: [_jsx("strong", { children: "\u274C Not Logged In" }), _jsx("div", { style: "margin-top: 0.5rem;", children: "Please log in first to see your assignments." })] }));
    }
    try {
        const assignments = await sessionManager.fetchUpcomingAssignments();
        if (assignments.length === 0) {
            return c.html(_jsxs("div", { style: "padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; text-align: center;", children: [_jsx("div", { style: "font-size: 3rem; margin-bottom: 0.5rem;", children: "\uD83C\uDF89" }), _jsx("strong", { style: "font-size: 1.25rem;", children: "No Upcoming Assignments!" }), _jsx("div", { style: "margin-top: 0.5rem; opacity: 0.9;", children: "You're all caught up. Time to relax!" })] }));
        }
        return c.html(_jsxs("div", { style: "display: flex; flex-direction: column; gap: 1rem;", children: [_jsxs("div", { style: "padding: 0.75rem 1rem; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 8px; color: white; font-weight: bold;", children: ["\uD83D\uDCDA ", assignments.length, " Upcoming Assignment", assignments.length > 1 ? "s" : ""] }), assignments.map((ass, i) => (_jsxs("div", { style: {
                        padding: "1rem",
                        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    }, children: [_jsxs("div", { style: "display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;", children: [_jsxs("div", { children: [_jsx("div", { style: "font-size: 0.85rem; color: #64ffda; font-weight: 600;", children: ass.courseCode }), _jsx("div", { style: "font-size: 0.8rem; color: #aaa;", children: ass.courseName })] }), _jsx("div", { style: {
                                        padding: "0.25rem 0.75rem",
                                        background: ass.status?.toLowerCase().includes("pending")
                                            ? "#ff6b6b"
                                            : "#4CAF50",
                                        borderRadius: "20px",
                                        fontSize: "0.75rem",
                                        fontWeight: "bold",
                                    }, children: ass.status || "Pending" })] }), _jsx("div", { style: "font-weight: bold; font-size: 1rem; margin-bottom: 0.5rem;", children: ass.assignmentTitle }), _jsxs("div", { style: "display: flex; justify-content: space-between; font-size: 0.85rem; color: #aaa;", children: [_jsxs("span", { children: ["\uD83D\uDCC5 Due: ", ass.dueDate || "N/A"] }), _jsxs("span", { children: ["\uD83D\uDCCA Max: ", ass.maxMarks || "N/A", " marks"] })] })] }, i)))] }));
    }
    catch (error) {
        return c.html(_jsxs("div", { style: "padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;", children: [_jsx("strong", { children: "\u274C Error:" }), " ", String(error)] }));
    }
});
serve({
    fetch: app.fetch,
    port: 6767,
}, (info) => {
    console.log(`🚀 Server is running on http://localhost:${info.port}`);
    console.log(`📊 Session status: http://localhost:${info.port}/api/session/status`);
});
