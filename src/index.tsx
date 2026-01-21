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

app.use("/static/htmx.js", serveStatic({ path: htmxPath }));

app.get("/", (c) => {
  if (sessionManager.isLoggedIn()) {
    return c.html(<Dashboard username={sessionManager.getUsername()!} />);
  }
  return c.redirect("/login");
});

app.get("/login", (c) => {
  if (sessionManager.isLoggedIn()) {
    return c.redirect("/");
  }
  return c.html(<Login />);
});

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
      await sessionManager.navigatePostLogin();
      await sessionManager.performAcademicsCheck();

      const courses = await sessionManager.fetchCourseDetails();
      const assignments = await sessionManager.fetchUpcomingAssignments();

      c.header("HX-Push-Url", "/");
      return c.html(
        <Dashboard
          username={username}
          courses={courses}
          assignments={assignments}
        />,
      );
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

app.get("/api/courses/html", async (c) => {
  if (!sessionManager.isLoggedIn()) {
    return c.html(
      <div class="text-red-500 text-sm">
        Session expired.Please login again
      </div>,
    );
  }

  try {
    const courses = await sessionManager.fetchCourseDetails();

    if (courses.length === 0) {
      return c.html(
        <div class="p-8 text-center bg-surface border border-border rounded-lg text-muted text-sm">
          No course details found.
        </div>,
      );
    }

    return c.html(
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {courses.map((course, i) => (
          <div
            key={i}
            class="p-3 bg-surface border border-border rounded-lg flex flex-col justify-between h-full hover:border-muted transition-colors"
          >
            <div>
              <div class="flex justify-between items-start mb-1.5">
                <span class="text-[0.65rem] font-bold text-muted uppercase tracking-wider">
                  {course.code}
                </span>
                <span class="text-[0.6rem] px-1.5 py-0.5 rounded border border-border text-muted">
                  {course.type}
                </span>
              </div>
              <h4 class="font-semibold text-xs mb-2 leading-relaxed line-clamp-2">
                {course.name}
              </h4>
            </div>

            <div class="flex items-end justify-between mt-2 pt-2 border-t border-border/50">
              <div class="flex flex-col">
                <span class="text-[0.6rem] text-muted uppercase">
                  Attendance
                </span>
                <span
                  class={`text-base font-bold ${
                    course.attendanceColor === "danger"
                      ? "text-red-500"
                      : course.attendanceColor === "warning"
                        ? "text-yellow-500"
                        : "text-green-500"
                  }`}
                >
                  {course.attendance}%
                </span>
              </div>
              {course.remarks && (
                <span
                  class={`text-[0.6rem] px-1.5 py-0.5 rounded bg-${
                    course.attendanceColor === "danger" ? "red" : "green"
                  }-500/10 text-${
                    course.attendanceColor === "danger" ? "red" : "green"
                  }-500`}
                >
                  {course.remarks}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>,
    );
  } catch (error) {
    return c.html(
      <div class="p-4 border border-red-500 rounded-md text-red-500 text-sm">
        Failed to load courses: {String(error)}
      </div>,
    );
  }
});

// Assignments HTML Endpoint (Compact Design)
app.get("/api/assignments/html", async (c) => {
  if (!sessionManager.isLoggedIn()) {
    return c.html(
      <div class="text-red-500 text-sm">
        Session expired. Please refresh to log in again.
      </div>,
    );
  }

  try {
    const assignments = await sessionManager.fetchUpcomingAssignments();

    if (assignments.length === 0) {
      return c.html(
        <div class="p-6 text-center bg-surface border border-border rounded-lg">
          <p class="text-sm text-muted">No assignments pending.</p>
        </div>,
      );
    }

    return c.html(
      <div class="flex flex-col gap-2">
        {assignments.map((ass, i) => (
          <div
            key={i}
            class="p-3 bg-surface border border-border rounded-lg hover:border-muted transition-colors group flex flex-col gap-1"
          >
            <div class="flex justify-between items-start gap-2">
              <span
                class="font-bold text-xs text-foreground line-clamp-1"
                title={ass.courseName}
              >
                {ass.courseName}
              </span>
              <span class="text-[0.65rem] font-medium text-red-400 whitespace-nowrap shrink-0">
                Due: {ass.dueDate || "N/A"}
              </span>
            </div>

            <div class="flex justify-between items-end gap-2">
              <div class="flex flex-col min-w-0">
                <span
                  class="text-[0.7rem] text-muted truncate"
                  title={ass.assignmentTitle}
                >
                  {ass.assignmentTitle}
                </span>
                <span class="text-[0.6rem] text-muted/60 font-mono">
                  {ass.courseCode}
                </span>
              </div>

              <span
                class={`text-[0.6rem] px-1.5 py-0.5 rounded font-medium whitespace-nowrap shrink-0 ${
                  ass.status?.toLowerCase().includes("pending")
                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                    : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                }`}
              >
                {ass.status || "Pending"}
              </span>
            </div>
          </div>
        ))}
      </div>,
    );
  } catch (error) {
    return c.html(
      <div class="p-4 border border-red-500 rounded-md text-red-500 text-sm">
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
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
