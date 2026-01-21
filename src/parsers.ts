//full slop; can't be bothered writing ts
import type { Assignment, CourseDetail } from "./session-manager.js";

/**
 * Extracts CSRF token from HTML
 */
export function extractCsrf(html: string): string | null {
  const patterns = [
    /name="_csrf"\s+value="([^"]+)"/,
    /name='_csrf'\s+value='([^']+)'/,
    /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/,
    /<input[^>]*value="([^"]+)"[^>]*name="_csrf"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extracts registration number (authorizedIDX) from HTML
 */
export function extractRegNo(html: string): string | null {
  const patterns = [
    /name="authorizedIDX"\s+id="authorizedIDX"\s+value="([^"]+)"/,
    /id="authorizedIDX"\s+name="authorizedIDX"\s+value="([^"]+)"/,
    /<input[^>]*name="authorizedIDX"[^>]*value="([^"]+)"/,
    /<input[^>]*id="authorizedIDX"[^>]*value="([^"]+)"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Detects captcha type and extracts related data
 */
export interface CaptchaDetectionResult {
  isTextCaptcha: boolean;
  isRecaptcha: boolean;
  csrf: string | null;
  imgDataUri: string | null;
}

export function detectCaptcha(html: string): CaptchaDetectionResult {
  const recaptchaDom =
    html.includes('id="recaptcha"') ||
    html.includes('id="g-recaptcha"') ||
    html.includes('class="g-recaptcha"');
  const recaptchaJs = html.includes("var captchaType=2");
  const isRecaptcha = recaptchaDom || recaptchaJs;

  const hasCaptchaInput =
    html.includes('name="captchaStr"') || html.includes('id="captchaStr"');

  const imgDataUriMatches = [
    ...html.matchAll(/src=["'](data:image\/[^"']+)["']/gi),
  ];
  let imgDataUri: string | null = null;

  for (const match of imgDataUriMatches) {
    if (match[1] && !match[1].includes(";base64,null")) {
      imgDataUri = match[1];
      break;
    }
  }

  if (!imgDataUri && imgDataUriMatches.length > 0) {
    console.warn("Detected invalid captcha image (base64 is null)");
  }

  const isTextCaptcha = hasCaptchaInput && imgDataUri !== null;

  const csrf = extractCsrf(html);

  return { isTextCaptcha, isRecaptcha, csrf, imgDataUri };
}

/**
 * Parses assignments from HTML response
 */
export function parseAssignmentsHtml(html: string): Assignment[] {
  const assignments: Assignment[] = [];

  try {
    const jsonMatch = html.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.map((item: Record<string, unknown>) => ({
          courseCode: String(item.courseCode || item.code || ""),
          courseName: String(item.courseName || item.name || ""),
          assignmentTitle: String(
            item.assignmentTitle || item.title || item.assignmentName || "",
          ),
          dueDate: String(item.dueDate || item.endDate || item.deadline || ""),
          status: String(item.status || ""),
          maxMarks: String(item.maxMarks || item.marks || ""),
        }));
      }
    }
  } catch {}

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<?<t[hd][^>]*>([\s\S]*?)(?:<\/t[hd]>|<\/tr|<tr|$)/gi;

  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const cells: string[] = [];
    let cellMatch;
    const rowContent = rowMatch[1];
    cellRegex.lastIndex = 0;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      // Strip HTML tags from cell content
      const cellContent = cellMatch[1].replace(/<[^>]+>/g, "").trim();
      cells.push(cellContent);
    }

    if (cells.length >= 4 && cells[0] !== "#" && !isNaN(Number(cells[0]))) {
      assignments.push({
        courseCode: "", // Not in this table format
        courseName: cells[1] || "",
        assignmentTitle: cells[2] || "",
        dueDate: cells[3] || "",
        status: cells[4] || "Pending",
        maxMarks: "", // Not in this table format
      });
    }
  }

  return assignments;
}

/**
 * Parses course details from HTML response
 */
export function parseCourseDetailsHtml(html: string): CourseDetail[] {
  const courses: CourseDetail[] = [];

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const matches = [...html.matchAll(rowRegex)];

  for (let i = 1; i < matches.length; i++) {
    const rowContent = matches[i][1];

    const codeMatch = rowContent.match(
      /<span[^>]*text-dark fw-bold[^>]*>([^<]+)<\/span>/,
    );
    const nameMatch = rowContent.match(
      /-[\s\n]*<span[^>]*text-dark[^>]*>([^<]+)<\/span>/,
    );

    const typeMatch = rowContent.match(/<td[^>]*fst-italic[^>]*>([^<]+)<\/td>/);

    const attendanceMatch = rowContent.match(
      /<span class="text-([a-z]+)[^>]*fw-bold">([\d.]+)<\/span>/,
    );

    const remarksMatch =
      rowContent.match(
        /<span class="text-[^>]*>([^<]+)<\/span>[\s\n]*<\/td>[\s\n]*<\/tr>$/,
      ) ||
      rowContent.match(
        /<td[^>]*text-nowrap text-start[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/,
      );

    if (codeMatch && nameMatch) {
      courses.push({
        code: codeMatch[1].trim(),
        name: nameMatch[1].trim(),
        type: typeMatch ? typeMatch[1].trim() : "N/A",
        attendance: attendanceMatch ? attendanceMatch[2].trim() : "N/A",
        attendanceColor: attendanceMatch
          ? attendanceMatch[1].trim()
          : "secondary",
        remarks: remarksMatch ? remarksMatch[1].trim() : "",
      });
    }
  }

  return courses;
}
