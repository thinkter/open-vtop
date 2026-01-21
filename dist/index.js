#!/usr/bin/env node
import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
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
app.use("/static/htmx.js", serveStatic({ path: htmxPath }));
app.get("/", (c) => {
    if (sessionManager.isLoggedIn()) {
        return c.html(_jsx(Dashboard, { username: sessionManager.getUsername() }));
    }
    return c.redirect("/login");
});
app.get("/login", (c) => {
    if (sessionManager.isLoggedIn()) {
        return c.redirect("/");
    }
    return c.html(_jsx(Login, {}));
});
app.post("/api/login/form", async (c) => {
    try {
        const formData = await c.req.parseBody();
        const username = formData["username"];
        const password = formData["password"];
        const regNo = formData["regNo"];
        if (!username || !password || !regNo) {
            return c.html(_jsx("div", { id: "error-message", class: "mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-500 text-sm", children: "Missing credentials. Please try again." }));
        }
        const success = await sessionManager.login(username, password, regNo);
        if (success) {
            await sessionManager.navigatePostLogin();
            await sessionManager.performAcademicsCheck();
            const courses = await sessionManager.fetchCourseDetails();
            const assignments = await sessionManager.fetchUpcomingAssignments();
            c.header("HX-Push-Url", "/");
            return c.html(_jsx(Dashboard, { username: username, courses: courses, assignments: assignments }));
        }
        else {
            return c.html(_jsx("div", { id: "error-message", class: "mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-500 text-sm", children: "Login failed. Invalid credentials or captcha error." }));
        }
    }
    catch (error) {
        return c.html(_jsxs("div", { id: "error-message", class: "mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-500 text-sm", children: ["Server error: ", String(error)] }));
    }
});
app.get("/api/courses/html", async (c) => {
    if (!sessionManager.isLoggedIn()) {
        return c.html(_jsx("div", { class: "text-red-500 text-sm", children: "Session expired.Please login again" }));
    }
    try {
        const courses = await sessionManager.fetchCourseDetails();
        if (courses.length === 0) {
            return c.html(_jsx("div", { class: "p-8 text-center bg-surface border border-border rounded-lg text-muted text-sm", children: "No course details found." }));
        }
        return c.html(_jsx("div", { class: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3", children: courses.map((course, i) => (_jsxs("div", { class: "p-3 bg-surface border border-border rounded-lg flex flex-col justify-between h-full hover:border-muted transition-colors", children: [_jsxs("div", { children: [_jsxs("div", { class: "flex justify-between items-start mb-1.5", children: [_jsx("span", { class: "text-[0.65rem] font-bold text-muted uppercase tracking-wider", children: course.code }), _jsx("span", { class: "text-[0.6rem] px-1.5 py-0.5 rounded border border-border text-muted", children: course.type })] }), _jsx("h4", { class: "font-semibold text-xs mb-2 leading-relaxed line-clamp-2", children: course.name })] }), _jsxs("div", { class: "flex items-end justify-between mt-2 pt-2 border-t border-border/50", children: [_jsxs("div", { class: "flex flex-col", children: [_jsx("span", { class: "text-[0.6rem] text-muted uppercase", children: "Attendance" }), _jsxs("span", { class: `text-base font-bold ${course.attendanceColor === "danger"
                                            ? "text-red-500"
                                            : course.attendanceColor === "warning"
                                                ? "text-yellow-500"
                                                : "text-green-500"}`, children: [course.attendance, "%"] })] }), course.remarks && (_jsx("span", { class: `text-[0.6rem] px-1.5 py-0.5 rounded bg-${course.attendanceColor === "danger" ? "red" : "green"}-500/10 text-${course.attendanceColor === "danger" ? "red" : "green"}-500`, children: course.remarks }))] })] }, i))) }));
    }
    catch (error) {
        return c.html(_jsxs("div", { class: "p-4 border border-red-500 rounded-md text-red-500 text-sm", children: ["Failed to load courses: ", String(error)] }));
    }
});
// Assignments HTML Endpoint (Compact Design)
app.get("/api/assignments/html", async (c) => {
    if (!sessionManager.isLoggedIn()) {
        return c.html(_jsx("div", { class: "text-red-500 text-sm", children: "Session expired. Please refresh to log in again." }));
    }
    try {
        const assignments = await sessionManager.fetchUpcomingAssignments();
        if (assignments.length === 0) {
            return c.html(_jsx("div", { class: "p-6 text-center bg-surface border border-border rounded-lg", children: _jsx("p", { class: "text-sm text-muted", children: "No assignments pending." }) }));
        }
        return c.html(_jsx("div", { class: "flex flex-col gap-2", children: assignments.map((ass, i) => (_jsxs("div", { class: "p-3 bg-surface border border-border rounded-lg hover:border-muted transition-colors group flex flex-col gap-1", children: [_jsxs("div", { class: "flex justify-between items-start gap-2", children: [_jsx("span", { class: "font-bold text-xs text-foreground line-clamp-1", title: ass.courseName, children: ass.courseName }), _jsxs("span", { class: "text-[0.65rem] font-medium text-red-400 whitespace-nowrap shrink-0", children: ["Due: ", ass.dueDate || "N/A"] })] }), _jsxs("div", { class: "flex justify-between items-end gap-2", children: [_jsxs("div", { class: "flex flex-col min-w-0", children: [_jsx("span", { class: "text-[0.7rem] text-muted truncate", title: ass.assignmentTitle, children: ass.assignmentTitle }), _jsx("span", { class: "text-[0.6rem] text-muted/60 font-mono", children: ass.courseCode })] }), _jsx("span", { class: `text-[0.6rem] px-1.5 py-0.5 rounded font-medium whitespace-nowrap shrink-0 ${ass.status?.toLowerCase().includes("pending")
                                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                    : "bg-blue-500/10 text-blue-500 border border-blue-500/20"}`, children: ass.status || "Pending" })] })] }, i))) }));
    }
    catch (error) {
        return c.html(_jsxs("div", { class: "p-4 border border-red-500 rounded-md text-red-500 text-sm", children: ["Failed to load assignments: ", String(error)] }));
    }
});
serve({
    fetch: app.fetch,
    port: 6767,
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
