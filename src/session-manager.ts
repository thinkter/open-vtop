//seperations of concerns my arse

import {
  solve,
  extractDataUriParts,
  saveCaptchaImage,
} from "./captcha-solver.js";
import * as path from "path";

const BASE = "https://vtop.vit.ac.in";
const VTOP = `${BASE}/vtop/`;
const OPEN_PAGE = `${BASE}/vtop/openPage`;
const OPEN_PAGE_ALT = `${BASE}/vtop/open/page`;
const PRELOGIN_SETUP = `${BASE}/vtop/prelogin/setup`;
const LOGIN_PAGE = `${BASE}/vtop/login`;

const INIT_PAGE = `${BASE}/vtop/init/page`;
const MAIN_PAGE = `${BASE}/vtop/main/page`;
const VTOP_OPEN = `${BASE}/vtop/open`;
const CONTENT = `${BASE}/vtop/content`;
const ACADEMICS_CHECK = `${BASE}/vtop/academics/common/AcademicsDefaultCheck`;
const UPCOMING_ASSIGNMENTS = `${BASE}/vtop/get/upcoming/digital/assignments`;
const COURSE_DETAILS = `${BASE}/vtop/get/dashboard/current/semester/course/details`;

export interface Assignment {
  courseCode: string;
  courseName: string;
  assignmentTitle: string;
  dueDate: string;
  status: string;
  maxMarks: string;
}

export interface CourseDetail {
  code: string;
  name: string;
  type: string;
  attendance: string;
  attendanceColor: string;
  remarks: string;
}

interface SessionState {
  cookies: Map<string, string>;
  csrf: string | null;
  initialized: boolean;
  lastInitialized: Date | null;
  loggedIn: boolean;
  username: string | null;
  regNo: string | null; // Registration number for API calls
}

interface CaptchaDetectionResult {
  isTextCaptcha: boolean;
  isRecaptcha: boolean;
  csrf: string | null;
  imgDataUri: string | null;
}

class VTOPSessionManager {
  private state: SessionState = {
    cookies: new Map(),
    csrf: null,
    initialized: false,
    lastInitialized: null,
    loggedIn: false,
    username: null,
    regNo: null,
  };

  //cheerio at home
  private extractCsrf(html: string): string | null {
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

  private storeCookies(response: Response): void {
    const setCookieHeaders = response.headers.getSetCookie?.() || [];

    for (const cookieStr of setCookieHeaders) {
      const [nameValue] = cookieStr.split(";");
      const [name, value] = nameValue.split("=");
      if (name && value) {
        this.state.cookies.set(name.trim(), value.trim());
      }
    }
  }

  private getCookieHeader(): string {
    return Array.from(this.state.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  private async fetchWithCookies(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const cookieHeader = this.getCookieHeader();

    const headers = new Headers(options.headers);
    if (cookieHeader) {
      headers.set("Cookie", cookieHeader);
    }

    headers.set(
      "User-Agent",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    headers.set(
      "Accept",
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    );
    headers.set("Accept-Language", "en-US,en;q=0.9");
    headers.set("Accept-Encoding", "gzip, deflate, br");
    headers.set("Connection", "keep-alive");
    headers.set("Upgrade-Insecure-Requests", "1");

    const response = await fetch(url, {
      ...options,
      headers,
      redirect: "manual", // Handle redirects manually to capture cookies
    });

    this.storeCookies(response);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location");
      if (location) {
        const redirectUrl = location.startsWith("http")
          ? location
          : new URL(location, url).toString();
        const redirectOptions: RequestInit = {
          headers: options.headers,
          redirect: options.redirect,
        };
        return this.fetchWithCookies(redirectUrl, redirectOptions);
      }
    }

    return response;
  }
  async initialize(): Promise<void> {
    try {
      console.log("Initializing VTOP session...");

      // Step 1: GET / to get SERVERID cookie
      console.log("Step 1: GET / to get SERVERID...");
      await this.fetchWithCookies(BASE);
      console.log(" ✓ OK");

      // Step 2: GET /vtop/ to get JSESSIONID cookie
      console.log("Step 2: GET /vtop/ to get JSESSIONID...");
      await this.fetchWithCookies(VTOP);
      console.log(" ✓ OK");

      // Step 3: GET /vtop/openPage for CSRF token
      console.log("Step 3: GET /vtop/openPage for CSRF...");
      const openPageRes = await this.fetchWithCookies(OPEN_PAGE);
      const openPageHtml = await openPageRes.text();
      console.log(" ✓ OK");

      const csrf = this.extractCsrf(openPageHtml);
      if (!csrf) {
        console.warn(
          "⚠Warning: _csrf not found on /vtop/openPage. Continuing anyway...",
        );
      } else {
        this.state.csrf = csrf;
        console.log(` ✓ Found _csrf: ${csrf.substring(0, 20)}...`);
      }

      // Step 4: POST /vtop/prelogin/setup
      console.log("Step 4: POST /vtop/prelogin/setup (flag=VTOP)...");
      const formData = new URLSearchParams();
      if (csrf) {
        formData.set("_csrf", csrf);
      }
      formData.set("flag", "VTOP");

      const preloginRes = await this.fetchWithCookies(PRELOGIN_SETUP, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: OPEN_PAGE,
          Origin: BASE,
        },
        body: formData.toString(),
      });

      console.log(` Prelogin status: ${preloginRes.status}`);

      this.state.initialized = true;
      this.state.lastInitialized = new Date();

      console.log("VTOP session initialized successfully!");
      console.log(`   Cookies stored: ${this.state.cookies.size}`);
      console.log(
        `   Cookie names: ${Array.from(this.state.cookies.keys()).join(", ")}`,
      );
    } catch (error) {
      console.error("Failed to initialize VTOP session:", error);
      throw error;
    }
  }
  getState(): Readonly<SessionState> {
    return {
      ...this.state,
      cookies: new Map(this.state.cookies),
    };
  }

  getCsrf(): string | null {
    return this.state.csrf;
  }

  getCookies(): string {
    return this.getCookieHeader();
  }

  isInitialized(): boolean {
    return this.state.initialized;
  }

  async refresh(): Promise<void> {
    console.log("Refreshing VTOP session...");
    this.state.cookies.clear();
    this.state.csrf = null;
    this.state.initialized = false;
    this.state.loggedIn = false;
    this.state.username = null;
    await this.initialize();
  }

  private detectCaptcha(html: string): CaptchaDetectionResult {
    // reCAPTCHA signals
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

    const csrf = this.extractCsrf(html);

    return { isTextCaptcha, isRecaptcha, csrf, imgDataUri };
  }
  async login(
    username: string,
    password: string,
    regNo: string,
    maxAttempts: number = 10,
  ): Promise<boolean> {
    if (!this.state.initialized) {
      console.log("Session not initialized, initializing first...");
      await this.initialize();
    }

    console.log("Starting VTOP login process...");
    console.log("Polling /vtop/login until text CAPTCHA appears...");

    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;

      try {
        const res = await this.fetchWithCookies(LOGIN_PAGE);
        const body = await res.text();

        const { isTextCaptcha, isRecaptcha, csrf, imgDataUri } =
          this.detectCaptcha(body);

        const curJsession = this.state.cookies.get("JSESSIONID") || "(?)";
        const curServerID = this.state.cookies.get("SERVERID") || "(?)";

        console.log(
          `Attempt ${attempt}: status ${res.status} | text-captcha=${isTextCaptcha ? "YES" : "no"} | recaptcha=${isRecaptcha ? "YES" : "no"} | JSESSIONID=${curJsession}`,
        );

        if (isTextCaptcha) {
          let solvedCaptcha = "";

          if (imgDataUri) {
            const parts = extractDataUriParts(imgDataUri);
            try {
              const cleanDataUri = imgDataUri.trim();
              if (cleanDataUri !== imgDataUri) {
                console.log("Trimmed whitespace from captcha data URI");
              }

              solvedCaptcha = await solve(cleanDataUri);
              console.log("Solved CAPTCHA:", solvedCaptcha);

              if (parts?.base64) {
                const out = path.resolve(process.cwd(), "captcha.jpg");
                await saveCaptchaImage(parts.base64, out);
              }
            } catch (e) {
              console.warn("Failed to solve captcha:", e);
              solvedCaptcha = "";

              try {
                const fs = await import("fs/promises");
                const failPath = path.resolve(
                  process.cwd(),
                  "failed_captcha_data.txt",
                );
                await fs.writeFile(failPath, imgDataUri);
                console.log(`Saved failed captcha data URI to ${failPath}`);
              } catch (writeErr) {
                console.error("Failed to save failed captcha data:", writeErr);
              }
            }
          } else {
            console.log("Text CAPTCHA detected but no data URI image found.");
          }

          console.log("\nSubmitting POST /vtop/login ...");

          const loginForm = new URLSearchParams();
          if (csrf) loginForm.set("_csrf", csrf);
          loginForm.set("username", username);
          loginForm.set("password", password);
          loginForm.set("captchaStr", solvedCaptcha);

          const _cookies = `JSESSIONID=${curJsession}; SERVERID=${curServerID}`;

          const postHeaders = {
            "Cache-Control": "max-age=0",
            Origin: BASE,
            Referer: OPEN_PAGE_ALT,
            "Content-Type": "application/x-www-form-urlencoded",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-US,en;q=0.9",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            Priority: "u=0, i",
            Cookie: _cookies,
          };

          try {
            const postRes = await fetch(LOGIN_PAGE, {
              method: "POST",
              headers: postHeaders,
              body: loginForm.toString(),
              redirect: "manual",
            });

            console.log(` -> Login POST status: ${postRes.status}`);

            this.storeCookies(postRes);

            const setCookie = postRes.headers.getSetCookie?.() || [];
            if (setCookie.length > 0) {
              console.log(" -> New cookies received");
            }

            const location = postRes.headers.get("Location");
            if (location) {
              console.log(` -> Redirect to: ${location}`);

              const redirectUrl = location.startsWith("http")
                ? location
                : new URL(location, LOGIN_PAGE).toString();
              await this.fetchWithCookies(redirectUrl);
            }

            console.log("Login POST submitted successfully!");
            this.state.loggedIn = true;
            this.state.username = username;
            this.state.regNo = regNo;
            return true;
          } catch (e) {
            console.error("Login POST failed:", e);
          }
        }

        if (isRecaptcha) {
          console.log("reCAPTCHA detected - cannot solve automatically");
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        console.error(`Attempt ${attempt} failed:`, e);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    console.log(`Login failed after ${maxAttempts} attempts`);
    return false;
  }

  isLoggedIn(): boolean {
    return this.state.loggedIn;
  }

  getUsername(): string | null {
    return this.state.username;
  }

  async navigatePostLogin(): Promise<boolean> {
    if (!this.state.loggedIn) {
      console.error(" Cannot navigate post-login pages: not logged in");
      return false;
    }

    const cookies = this.getCookieHeader();
    const headers = {
      Referer: LOGIN_PAGE,
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Cache-Control": "max-age=0",
      "Upgrade-Insecure-Requests": "1",
      Origin: BASE,
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies,
    };

    try {
      console.log("Navigating post-login pages...");

      // 1. /vtop/init/page
      const initRes = await this.fetchWithCookies(INIT_PAGE, { headers });
      console.log(` -> /vtop/init/page: ${initRes.status}`);

      // 2. /vtop/main/page
      const mainRes = await this.fetchWithCookies(MAIN_PAGE, { headers });
      console.log(` -> /vtop/main/page: ${mainRes.status}`);

      // 3. /vtop/open
      const openRes = await this.fetchWithCookies(VTOP_OPEN, { headers });
      console.log(` -> /vtop/open: ${openRes.status}`);

      // 4. /vtop/content - extract new CSRF from here
      const contentRes = await this.fetchWithCookies(CONTENT, { headers });
      const contentHtml = await contentRes.text();
      console.log(` -> /vtop/content: ${contentRes.status}`);

      const newCsrf = this.extractCsrf(contentHtml);
      if (newCsrf) {
        this.state.csrf = newCsrf;
        console.log(`Updated CSRF token from content page`);
      }

      console.log("Post-login navigation complete");
      return true;
    } catch (e) {
      console.error("Post-login navigation failed:", e);
      return false;
    }
  }

  //slop
  private parseAssignmentsHtml(html: string): Assignment[] {
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
            dueDate: String(
              item.dueDate || item.endDate || item.deadline || "",
            ),
            status: String(item.status || ""),
            maxMarks: String(item.maxMarks || item.marks || ""),
          }));
        }
      }
    } catch {
      // Not JSON, try HTML parsing
    }

    // Parse HTML table rows using regex
    // VTOP table structure: #(th), Course Name(td), Title(td), Last Date(td), Uploaded(td)
    // Note: VTOP HTML sometimes has malformed tags like <<td
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    // Match both <th> and <td> cells, and handle malformed <<td
    const cellRegex = /<?<t[hd][^>]*>([\s\S]*?)(?:<\/t[hd]>|<\/tr|<tr|$)/gi;

    let rowMatch;
    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const cells: string[] = [];
      let cellMatch;
      const rowContent = rowMatch[1];

      // Reset lastIndex for cell regex
      cellRegex.lastIndex = 0;
      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        // Strip HTML tags from cell content
        const cellContent = cellMatch[1].replace(/<[^>]+>/g, "").trim();
        cells.push(cellContent);
      }

      // Skip header rows (first cell would be "#" or similar header text)
      if (cells.length >= 4 && cells[0] !== "#" && !isNaN(Number(cells[0]))) {
        // Table structure: # (row num), Course Name, Title, Last Date, Uploaded
        // cells[0] = row number (skip)
        // cells[1] = Course Name
        // cells[2] = Title (assignment title)
        // cells[3] = Last Date (due date)
        // cells[4] = Uploaded (status)
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

  private parseCourseDetailsHtml(html: string): CourseDetail[] {
    const courses: CourseDetail[] = [];

    // Regex to match table rows
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    const matches = [...html.matchAll(rowRegex)];

    // Skip header row
    for (let i = 1; i < matches.length; i++) {
      const rowContent = matches[i][1];

      // Extract Code and Name: <span class="mx-2 text-dark fw-bold">BCSE204L</span>-<span class="mx-2 text-dark">Design and Analysis of Algorithms</span>
      const codeMatch = rowContent.match(
        /<span[^>]*text-dark fw-bold[^>]*>([^<]+)<\/span>/,
      );
      const nameMatch = rowContent.match(
        /-[\s\n]*<span[^>]*text-dark[^>]*>([^<]+)<\/span>/,
      );

      // Extract Type: <td class="fst-italic text-primary fw-bold mx-1">TH</td>
      const typeMatch = rowContent.match(
        /<td[^>]*fst-italic[^>]*>([^<]+)<\/td>/,
      );

      // Extract Attendance: <span class="text-danger fw-bold">65.0</span>
      // Capture color class as well to determine status
      const attendanceMatch = rowContent.match(
        /<span class="text-([a-z]+)[^>]*fw-bold">([\d.]+)<\/span>/,
      );

      // Extract Remarks: <span class="text-danger fw-bold">Critical - must improve</span>
      // This usually comes after attendance in the last column
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

  private async performAcademicsCheck(headers: any): Promise<void> {
    const now = new Date();
    const accParams = new URLSearchParams();
    accParams.set("authorizedID", this.state.regNo!);
    if (this.state.csrf) accParams.set("_csrf", this.state.csrf);
    accParams.set("x", now.toUTCString());

    try {
      console.log("Performing AcademicsDefaultCheck...");
      const accRes = await fetch(ACADEMICS_CHECK, {
        method: "POST",
        headers,
        body: accParams.toString(),
      });
      console.log(` -> AcademicsDefaultCheck: ${accRes.status}`);
    } catch (e) {
      console.warn("AcademicsDefaultCheck failed:", e);
    }
  }

  async fetchCourseDetails(): Promise<CourseDetail[]> {
    if (!this.state.loggedIn || !this.state.regNo) {
      console.error("Cannot fetch course details: not logged in");
      return [];
    }

    const cookies = this.getCookieHeader();
    const now = new Date();
    const apiHeaders = {
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-US,en;q=0.7",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies,
      Origin: BASE,
      Priority: "u=1, i",
      Referer: CONTENT,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    };

    await this.performAcademicsCheck(apiHeaders);

    const assParams = new URLSearchParams();
    assParams.set("authorizedID", this.state.regNo);
    if (this.state.csrf) assParams.set("_csrf", this.state.csrf);
    assParams.set("x", now.toUTCString());

    try {
      console.log("Fetching course details...");
      const res = await fetch(COURSE_DETAILS, {
        method: "POST",
        headers: apiHeaders,
        body: assParams,
      });

      const html = await res.text();
      console.log("Course details HTML:", html);

      const courses = this.parseCourseDetailsHtml(html);
      console.log(`Parsed ${courses.length} courses`);
      return courses;
    } catch (error) {
      console.error("Failed to fetch course details:", error);
      return [];
    }
  }

  async fetchUpcomingAssignments(): Promise<Assignment[]> {
    if (!this.state.loggedIn || !this.state.regNo) {
      console.error("Cannot fetch assignments: not logged in or no regNo");
      return [];
    }

    await this.navigatePostLogin();

    const cookies = this.getCookieHeader();
    const now = new Date();

    const accParams = new URLSearchParams();
    accParams.set("authorizedID", this.state.regNo);
    if (this.state.csrf) accParams.set("_csrf", this.state.csrf);
    accParams.set("x", now.toUTCString());

    const apiHeaders = {
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-US,en;q=0.7",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies,
      Origin: BASE,
      Priority: "u=1, i",
      Referer: CONTENT,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    };

    await this.performAcademicsCheck(apiHeaders);

    const assParams = new URLSearchParams();
    assParams.set("authorizedID", this.state.regNo);
    if (this.state.csrf) assParams.set("_csrf", this.state.csrf);
    assParams.set("x", now.toUTCString());

    try {
      console.log(" Fetching upcoming assignments...");
      const assRes = await fetch(UPCOMING_ASSIGNMENTS, {
        method: "POST",
        headers: apiHeaders,
        body: assParams.toString(),
      });

      console.log(` -> Upcoming assignments: ${assRes.status}`);
      const assBody = await assRes.text();
      console.log(` -> Response length: ${assBody.length} chars`);
      console.log(` -> Raw response:\n${assBody}`);

      if (assBody) {
        const assignments = this.parseAssignmentsHtml(assBody);
        console.log(` Parsed ${assignments.length} assignments`);
        return assignments;
      }
    } catch (e) {
      console.error(" Failed to fetch assignments:", e);
    }

    return [];
  }
}

export const sessionManager = new VTOPSessionManager();

sessionManager.initialize().catch((error) => {
  console.error("Failed to auto-initialize session:", error);
});
