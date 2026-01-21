#!/usr/bin/env node
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { Login } from "./views/Login.js";
import { Dashboard } from "./views/Dashboard.js";
import { sessionManager } from "./session-manager.js";
import { createRequire } from "module";
import { ErrorMessage } from "./components/ErrorMessage.js";
import { CoursesList } from "./components/CoursesList.js";
import { AssignmentsList } from "./components/AssignmentsList.js";
import { EmptyState } from "./components/EmptyState.js";
import { SessionExpired } from "./components/SessionExpired.js";

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

    if (!username || !password) {
      return c.html(
        <ErrorMessage message="Missing credentials. Please try again." />,
      );
    }

    const success = await sessionManager.login(username, password);

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
      return c.html(<ErrorMessage message="Login failed." />);
    }
  } catch (error) {
    return c.html(<ErrorMessage message={`Server error: ${String(error)}`} />);
  }
});

app.get("/api/courses/html", async (c) => {
  if (!sessionManager.isLoggedIn()) {
    return c.html(<SessionExpired />);
  }

  try {
    const courses = await sessionManager.fetchCourseDetails();

    if (courses.length === 0) {
      return c.html(<EmptyState message="No course details found." />);
    }

    return c.html(<CoursesList courses={courses} />);
  } catch (error) {
    return c.html(
      <ErrorMessage message={`Failed to load courses: ${String(error)}`} />,
    );
  }
});

app.get("/api/assignments/html", async (c) => {
  if (!sessionManager.isLoggedIn()) {
    return c.html(<SessionExpired />);
  }

  try {
    const assignments = await sessionManager.fetchUpcomingAssignments();

    if (assignments.length === 0) {
      return c.html(<EmptyState message="No assignments pending." />);
    }

    return c.html(<AssignmentsList assignments={assignments} />);
  } catch (error) {
    return c.html(
      <ErrorMessage message={`Failed to load assignments: ${String(error)}`} />,
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
