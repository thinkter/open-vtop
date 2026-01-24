import type { FC } from "hono/jsx";
import { BaseLayout } from "./layouts/Base.js";
import type { CourseDetail, Assignment } from "../session-manager.js";

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
        <div>
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
        {/* Course Details Section */}
        <section class="lg:col-span-8 xl:col-span-9 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Course Details</h2>
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
                            course.attendanceColor === "danger"
                              ? "red"
                              : "green"
                          }-500/10 text-${
                            course.attendanceColor === "danger"
                              ? "red"
                              : "green"
                          }-500`}
                        >
                          {course.remarks}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
              </div>
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
      </div>
    </BaseLayout>
  );
};
