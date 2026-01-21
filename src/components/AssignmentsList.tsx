import type { Assignment } from "../session-manager.js";
import { AssignmentCard } from "./AssignmentCard.js";

export function AssignmentsList({
  assignments,
}: {
  assignments: Assignment[];
}) {
  return (
    <div class="flex flex-col gap-2">
      {assignments.map((assignment, i) => (
        <AssignmentCard key={i} assignment={assignment} />
      ))}
    </div>
  );
}
