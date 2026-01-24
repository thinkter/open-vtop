import type { CourseDetail } from "../session-manager.js";

export function CoursesList({ courses }: { courses: CourseDetail[] }) {
  return (
    <div class="overflow-x-auto rounded-lg border border-border bg-surface">
      <table class="w-full text-xs text-left">
        <thead class="bg-surface border-b border-border/50 text-[0.65rem] uppercase tracking-wider text-muted font-bold">
          <tr>
            <th class="px-3 py-2 text-foreground/80">Code</th>
            <th class="px-3 py-2 text-foreground/80">Course Name</th>
            <th class="px-3 py-2 text-foreground/80">Type</th>
            <th class="px-3 py-2 text-foreground/80">Attendance</th>
            <th class="px-3 py-2 text-right text-foreground/80">Remarks</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/30">
          {courses.map((course, i) => (
            <tr key={i} class="hover:bg-muted/5 transition-colors group">
              <td class="px-3 py-2 font-mono text-[0.7rem] text-muted">
                {course.code}
              </td>
              <td
                class="px-3 py-2 font-medium text-foreground max-w-[200px] truncate"
                title={course.name}
              >
                {course.name}
              </td>
              <td class="px-3 py-2">
                <span class="text-[0.6rem] px-1.5 py-0.5 rounded border border-border text-muted">
                  {course.type}
                </span>
              </td>
              <td class="px-3 py-2">
                <span
                  class={`font-bold ${
                    course.attendanceColor === "danger"
                      ? "text-red-500"
                      : course.attendanceColor === "warning"
                        ? "text-yellow-500"
                        : "text-green-500"
                  }`}
                >
                  {course.attendance}%
                </span>
              </td>
              <td class="px-3 py-2 text-right">
                {course.remarks && (
                  <span
                    class={`inline-block text-[0.6rem] px-1.5 py-0.5 rounded bg-${
                      course.attendanceColor === "danger" ? "red" : "green"
                    }-500/10 text-${
                      course.attendanceColor === "danger" ? "red" : "green"
                    }-500 whitespace-nowrap`}
                  >
                    {course.remarks}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
