import type { FC } from "hono/jsx";
import { BaseLayout } from "./layouts/Base.js";
import type { CourseDetail, Assignment } from "../session-manager.js";
import { CoursesList } from "../components/CoursesList.js";
import { AssignmentsList } from "../components/AssignmentsList.js";

export const Dashboard: FC<{
  username: string;
  courses?: CourseDetail[];
  assignments?: Assignment[];
}> = ({ username, courses, assignments }) => {
  return (
    <BaseLayout title="Dashboard - Open-VTOP">
      <div class="flex justify-between items-center mb-6 border-b border-border pb-4">
        <div>
          <h1 class="text-xl font-bold tracking-tight">Dashboard</h1>
          <p class="text-muted text-xs">Welcome back, {username}</p>
        </div>
        <div class="flex items-center gap-4">
          <a
            href="/coursepage"
            class="text-xs text-muted hover:text-foreground transition-colors"
          >
            Course Page
          </a>
          <form action="/api/logout" method="post">
            <button
              type="submit"
              class="text-xs text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Attendance*/}
        <section class="lg:col-span-8 xl:col-span-9 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Attendance</h2>
            <span class="text-[0.65rem] text-muted bg-surface border border-border px-2 py-1 rounded">
              Winter Semester 2025-26
            </span>
          </div>

          {courses ? (
            courses.length === 0 ? (
              <div class="p-8 text-center bg-surface border border-border rounded-lg text-muted text-sm">
                No course details found.
              </div>
            ) : (
              <CoursesList courses={courses} />
            )
          ) : (
            <div
              id="courses-loader"
              hx-get="/api/courses/html"
              hx-trigger="load"
              hx-swap="innerHTML"
              class="w-full"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    class="h-28 bg-surface/50 border border-border rounded-lg"
                  ></div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Assignments Section */}
        <section class="lg:col-span-4 xl:col-span-3 space-y-4">
          <h2 class="text-lg font-semibold">Assignments</h2>

          {assignments ? (
            assignments.length === 0 ? (
              <div class="p-6 text-center bg-surface border border-border rounded-lg">
                <p class="text-sm text-muted">No assignments pending.</p>
              </div>
            ) : (
              <AssignmentsList assignments={assignments} />
            )
          ) : (
            <div
              id="assignments-loader"
              hx-get="/api/assignments/html"
              hx-trigger={
                courses ? "load" : "htmx:afterOnLoad from:#courses-loader"
              }
              hx-target="#assignments-container"
              hx-swap="innerHTML"
              class="w-full"
            >
              <div id="assignments-container" class="space-y-4">
                <div id="loading-state" class="text-center py-12 text-muted">
                  <div class="inline-block animate-spin rounded-full h-5 w-5 border-2 border-muted border-t-white mb-3"></div>
                  <p class="text-xs">Syncing assignments...</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Exam Schedule Section */}
        <section class="lg:col-span-12 space-y-4 pt-4 border-t border-border/50">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Exam Schedule</h2>
            <span class="text-[0.65rem] text-muted bg-surface border border-border px-2 py-1 rounded">
              Winter Semester 2025-26
            </span>
          </div>

          <div
            id="exams-loader"
            hx-get="/api/exams/html"
            hx-trigger={
              courses ? "load" : "htmx:afterOnLoad from:#courses-loader"
            }
            hx-swap="innerHTML"
            class="w-full"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  class="h-40 bg-surface/50 border border-border rounded-lg"
                ></div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </BaseLayout>
  );
};
