import type { Assignment } from "../session-manager.js";

export function AssignmentsList({
  assignments,
}: {
  assignments: Assignment[];
}) {
  return (
    <div class="overflow-x-auto rounded-lg border border-border bg-surface">
      <table class="w-full text-xs text-left">
        <thead class="bg-surface border-b border-border/50 text-[0.65rem] uppercase tracking-wider text-muted font-bold">
          <tr>
            <th class="px-3 py-2 text-foreground/80">Course</th>
            <th class="px-3 py-2 text-foreground/80">Assignment</th>
            <th class="px-3 py-2 text-foreground/80">Due Date</th>
            <th class="px-3 py-2 text-right text-foreground/80">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/30">
          {assignments.map((ass, i) => (
            <tr key={i} class="hover:bg-muted/5 transition-colors group">
              <td
                class="px-3 py-2 font-mono text-[0.7rem] text-muted whitespace-nowrap"
                title={ass.courseName}
              >
                {ass.courseCode}
              </td>
              <td
                class="px-3 py-2 font-medium text-foreground max-w-[150px] truncate"
                title={ass.assignmentTitle}
              >
                {ass.assignmentTitle}
              </td>
              <td class="px-3 py-2 text-red-400 whitespace-nowrap text-[0.7rem]">
                {ass.dueDate || "N/A"}
              </td>
              <td class="px-3 py-2 text-right">
                <span
                  class={`inline-block text-[0.6rem] px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${
                    ass.status?.toLowerCase().includes("pending")
                      ? "bg-red-500/10 text-red-500 border border-red-500/20"
                      : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                  }`}
                >
                  {ass.status || "Pending"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
