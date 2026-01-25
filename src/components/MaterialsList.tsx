import type { FC } from "hono/jsx";
import type { CourseMaterialTable } from "../session-manager.js";

const tableClass =
  "min-w-full border border-border rounded-lg overflow-hidden";
const headerClass = "bg-surface text-muted text-xs uppercase";
const cellClass =
  "border-t border-border px-3 py-2 text-xs text-foreground align-top";

export const MaterialsList: FC<{ materials: CourseMaterialTable }> = ({
  materials,
}) => {
  if (materials.rows.length === 0) {
    return (
      <div class="mt-4 text-sm text-muted">
        No course materials available for this selection.
      </div>
    );
  }

  return (
    <div class="mt-4 space-y-3">
      <h3 class="text-lg font-semibold border-b border-border pb-2">
        Course Materials
      </h3>
      <div class="overflow-x-auto">
        <table class={tableClass}>
          <thead class={headerClass}>
            <tr>
              {materials.headers.map((header, idx) => (
                <th key={idx} class="px-3 py-2 text-left text-[0.65rem]">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {materials.rows.map((row) => (
              <tr>
                <td class={cellClass}>{row.index}</td>
                <td class={cellClass}>{row.courseDetail}</td>
                <td class={cellClass}>{row.materialDetail}</td>
                <td class={cellClass}>{row.uploadedBy}</td>
                <td class={cellClass}>
                  <button
                    class="px-2 py-1 text-[0.65rem] bg-primary text-primary-fg rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                    disabled
                    title={
                      row.fileId
                        ? `File ID: ${row.fileId}`
                        : "Download not available"
                    }
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
