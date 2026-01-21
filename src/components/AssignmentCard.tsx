import type { Assignment } from "../session-manager.js";

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  return (
    <div class="p-3 bg-surface border border-border rounded-lg hover:border-muted transition-colors group flex flex-col gap-1">
      <div class="flex justify-between items-start gap-2">
        <span
          class="font-bold text-xs text-foreground line-clamp-1"
          title={assignment.courseName}
        >
          {assignment.courseName}
        </span>
        <span class="text-[0.65rem] font-medium text-red-400 whitespace-nowrap shrink-0">
          Due: {assignment.dueDate || "N/A"}
        </span>
      </div>

      <div class="flex justify-between items-end gap-2">
        <div class="flex flex-col min-w-0">
          <span
            class="text-[0.7rem] text-muted truncate"
            title={assignment.assignmentTitle}
          >
            {assignment.assignmentTitle}
          </span>
          <span class="text-[0.6rem] text-muted/60 font-mono">
            {assignment.courseCode}
          </span>
        </div>

        <span
          class={`text-[0.6rem] px-1.5 py-0.5 rounded font-medium whitespace-nowrap shrink-0 ${
            assignment.status?.toLowerCase().includes("pending")
              ? "bg-red-500/10 text-red-500 border border-red-500/20"
              : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
          }`}
        >
          {assignment.status || "Pending"}
        </span>
      </div>
    </div>
  );
}
