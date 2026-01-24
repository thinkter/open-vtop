import type { ExamSchedule } from "../session-manager.js";

interface ExamsListProps {
  exams: ExamSchedule[];
}

export const ExamsList = ({ exams }: ExamsListProps) => {
  return (
    <div class="overflow-x-auto rounded-lg border border-border bg-surface">
      <table class="w-full text-xs text-left">
        <thead class="bg-surface border-b border-border/50 text-[0.65rem] uppercase tracking-wider text-muted font-bold">
          <tr>
            <th class="px-3 py-2">Code</th>
            <th class="px-3 py-2">Course Title</th>
            <th class="px-3 py-2">Slot</th>
            <th class="px-3 py-2">Date (Session)</th>
            <th class="px-3 py-2">Time</th>
            <th class="px-3 py-2">Venue</th>
            <th class="px-3 py-2 text-right">Seat</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/30">
          {exams.map((exam) => (
            <tr class="hover:bg-muted/5 transition-colors group">
              <td class="px-3 py-2 font-semibold text-foreground whitespace-nowrap">
                {exam.courseCode}
                <span class="ml-1.5 text-[0.6rem] px-1 rounded border border-border text-muted font-normal">
                  {exam.courseType}
                </span>
              </td>
              <td
                class="px-3 py-2 font-medium text-foreground/90 max-w-[200px] truncate"
                title={exam.courseTitle}
              >
                {exam.courseTitle}
              </td>
              <td class="px-3 py-2 text-muted whitespace-nowrap font-mono text-[0.65rem]">
                {exam.slot}
              </td>
              <td class="px-3 py-2 text-foreground/80 whitespace-nowrap">
                {exam.examDate}
                <span class="ml-1.5 text-[0.6rem] font-bold text-blue-400 bg-blue-400/10 px-1 rounded">
                  {exam.examSession}
                </span>
              </td>
              <td class="px-3 py-2 text-muted whitespace-nowrap font-mono text-[0.65rem]">
                {exam.examTime}
              </td>
              <td
                class="px-3 py-2 text-foreground/80 whitespace-nowrap truncate max-w-[100px]"
                title={exam.venue}
              >
                {exam.venue}
              </td>
              <td class="px-3 py-2 text-right font-mono text-muted text-[0.65rem] whitespace-nowrap">
                {exam.seatLocation}
                <span class="mx-1 text-border">/</span>
                <span class="text-foreground">{exam.seatNo}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
