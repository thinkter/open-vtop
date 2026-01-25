// import type { FC } from "hono/jsx";
// import { BaseLayout } from "./layouts/Base.js";
// import type { CourseOption } from "../session-manager.js";

// export const CoursePage: FC<{
//   username: string;
//   options: CourseOption[];
// }> = ({ username, options }) => {
//   return (
//     <BaseLayout title="Course Page - Open-VTOP">
//       <div class="flex justify-between items-center mb-6 border-b border-border pb-4">
//         <div>
//           <h1 class="text-xl font-bold tracking-tight">Course Page</h1>
//           <p class="text-muted text-xs">View course materials</p>
//         </div>
//         <div class="flex gap-4 items-center">
//           <a
//             href="/"
//             class="text-xs text-muted hover:text-foreground transition-colors"
//           >
//             Back to Dashboard
//           </a>
//           <form action="/api/logout" method="post">
//             <button
//               type="submit"
//               class="text-xs text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer"
//             >
//               Logout
//             </button>
//           </form>
//         </div>
//       </div>

//       <div
//         class="w-full max-w-2xl mx-auto space-y-6"
//         x-data={`{
//             allOptions: ${JSON.stringify(options)},
//             semesters: [
//                 {id: 'VL20252605', name: 'Winter Semester 2025-26'},
//                 {id: 'VL20252601', name: 'Fall Semester 2025-26'}
//             ],
//             selectedSemester: 'VL20252605',
//             selectedCourse: '',
//             filteredCourses: [],

//             init() {
//                 this.updateCourses();
//                 this.$watch('selectedSemester', () => this.updateCourses());
//             },

//             updateCourses() {
//                 this.filteredCourses = this.allOptions.filter(o => o.semester === this.selectedSemester);
//                 // Reset selected course if it's no longer in the list
//                 if (!this.filteredCourses.find(c => c.value === this.selectedCourse)) {
//                     this.selectedCourse = '';
//                 }
//             }
//         }`}
//       >
//         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {/* Semester Selection */}
//           <div class="space-y-2">
//             <label class="text-sm font-medium text-muted">
//               Select Semester
//             </label>
//             <select
//               x-model="selectedSemester"
//               class="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
//             >
//               <template x-for="sem in semesters" x-bind:key="sem.id">
//                 <option x-bind:value="sem.id" x-text="sem.name"></option>
//               </template>
//             </select>
//           </div>

//           {/* Course Selection */}
//           <div class="space-y-2">
//             <label class="text-sm font-medium text-muted">Select Course</label>
//             <select
//               x-model="selectedCourse"
//               class="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
//               x-bind:disabled="!selectedSemester"
//             >
//               <option value="">-- Select Course --</option>
//               <template x-for="course in filteredCourses">
//                 <option
//                   x-bind:value="course.value"
//                   x-text="course.name"
//                 ></option>
//               </template>
//             </select>
//           </div>
//         </div>

//         {/* Course Material Action */}
//         <div class="flex flex-col gap-4">
//           <button
//             class="w-full md:w-auto px-4 py-2 bg-primary text-primary-fg font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//             x-bind:disabled="!selectedCourse"
//             hx-post="/api/course/material"
//             hx-base-url="true"
//             hx-target="#course-materials-container"
//             hx-indicator="#material-loading"
//             hx-vals="js:{
//                     semester: selectedSemester,
//                     courseId: selectedCourse,
//                     courseType: filteredCourses.find(c => c.value === selectedCourse)?.type || ''
//                 }"
//           >
//             <span>Get Course Material</span>
//             <div id="material-loading" class="htmx-indicator">
//               <svg
//                 class="animate-spin h-4 w-4 text-primary-fg"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   class="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   stroke-width="4"
//                 ></circle>
//                 <path
//                   class="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                 ></path>
//               </svg>
//             </div>
//           </button>

//           <div id="course-materials-container" class="min-h-[200px]">
//             {/* Materials will be loaded here */}
//           </div>
//         </div>

//         {/* Selected Data Debug (Optional / Placeholder for future action) */}
//         {/* <div
//           x-show="selectedCourse"
//           class="p-4 bg-surface border border-border rounded-lg mt-6"
//           style="display: none;"
//         >
//           <p class="text-xs text-muted">
//             Selected Course Value:{" "}
//             <span class="text-foreground" x-text="selectedCourse"></span>
//           </p>
//         </div> */}
//       </div>
//     </BaseLayout>
//   );
// };

import type { FC } from "hono/jsx";
import { BaseLayout } from "./layouts/Base.js";
import type { CourseOption } from "../session-manager.js";

export const CoursePage: FC<{
  username: string;
  options: CourseOption[];
}> = ({ username, options }) => {
  // render an inlined JSON blob for Alpine to consume (safer than embedding in x-data directly)
  const optionsJson = JSON.stringify(options).replace(
    /<\/script>/g,
    "<\\/script>",
  );

  return (
    <BaseLayout title="Course Page - Open-VTOP">
      {/* server-rendered JSON for Alpine */}
      <script
        id="course-options"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: optionsJson }}
      />

      {/* Alpine component factory */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
document.addEventListener('alpine:init', () => {
  Alpine.data('coursePage', () => {
    const raw = document.getElementById('course-options')?.textContent || '[]';
    const allOptions = JSON.parse(raw);
    // derive unique semesters (keep provided semesterName if present)
    const semesterMap = new Map();
    allOptions.forEach(o => {
      const id = o.semester || 'unknown';
      const name = o.semesterName || id;
      if (!semesterMap.has(id)) semesterMap.set(id, name);
    });
    const semesters = Array.from(semesterMap.entries()).map(([id, name]) => ({ id, name }));

    return {
      allOptions,
      semesters,
      selectedSemester: semesters[0]?.id || '',
      selectedCourse: '',
      filteredCourses: [],

      init() {
        this.updateCourses();
        this.$watch('selectedSemester', () => this.updateCourses());
      },

      updateCourses() {
        this.filteredCourses = this.allOptions.filter(o => o.semester === this.selectedSemester);
        if (!this.filteredCourses.find(c => c.value === this.selectedCourse)) {
          this.selectedCourse = '';
        }
      }
    };
  });
});
`,
        }}
      />

      <div class="w-full max-w-2xl mx-auto space-y-6" x-data="coursePage()">
        <div class="flex justify-between items-center mb-6 border-b border-border pb-4">
          <div>
            <h1 class="text-xl font-bold tracking-tight">Course Page</h1>
            <p class="text-muted text-xs">View course materials</p>
          </div>

          <div class="flex gap-4 items-center">
            <a
              href="/"
              class="text-xs text-muted hover:text-foreground transition-colors"
            >
              Back to Dashboard
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

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium text-muted">
              Select Semester
            </label>

            <select
              x-model="selectedSemester"
              class="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <template x-for="sem in semesters" x-bind:key="sem.id">
                <option x-bind:value="sem.id" x-text="sem.name"></option>
              </template>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-muted">Select Course</label>

            <select
              x-model="selectedCourse"
              class="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
              x-bind:disabled="!selectedSemester"
            >
              <option value="">-- Select Course --</option>
              <template
                x-for="course in filteredCourses"
                x-bind:key="course.value"
              >
                <option
                  x-bind:value="course.value"
                  x-text="course.name"
                ></option>
              </template>
            </select>
          </div>
        </div>

        {/* Use a form so htmx will send actual input values (bound via x-model). */}
        <form
          hx-post="/api/course/material"
          hx-target="#course-materials-container"
          hx-indicator="#material-loading"
          hx-base-url="true"
          class="flex flex-col gap-4"
        >
          {/* Hidden inputs bound to Alpine state — htmx will include them in the request payload. */}
          <input type="hidden" name="semester" x-model="selectedSemester" />
          <input type="hidden" name="courseId" x-model="selectedCourse" />
          <input
            type="hidden"
            name="courseType"
            x-bind:value="filteredCourses.find(c => c.value === selectedCourse)?.type || ''"
          />

          <div>
            <button
              type="submit"
              class="w-full md:w-auto px-4 py-2 bg-primary text-primary-fg font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              x-bind:disabled="!selectedCourse"
            >
              <span>Get Course Material</span>

              {/* spinner element referenced by hx-indicator */}
              <div
                id="material-loading"
                class="htmx-indicator"
                style="display: inline-block;"
              >
                <svg
                  class="animate-spin h-4 w-4 text-primary-fg"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            </button>
          </div>

          <div id="course-materials-container" class="min-h-[200px]">
            {/* htmx will swap the returned fragment into this container */}
          </div>
        </form>
      </div>
    </BaseLayout>
  );
};
