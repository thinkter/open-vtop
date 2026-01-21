import type { CourseDetail } from "../session-manager.js";
import { CourseCard } from "./CourseCard.js";

export function CoursesList({ courses }: { courses: CourseDetail[] }) {
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {courses.map((course, i) => (
        <CourseCard key={i} course={course} />
      ))}
    </div>
  );
}
