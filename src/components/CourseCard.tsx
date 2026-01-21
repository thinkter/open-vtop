import type { CourseDetail } from "../session-manager.js";

export function CourseCard({ course }: { course: CourseDetail }) {
  return (
    <div class="p-3 bg-surface border border-border rounded-lg flex flex-col justify-between h-full hover:border-muted transition-colors">
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
          <span class="text-[0.6rem] text-muted uppercase">Attendance</span>
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
  );
}
