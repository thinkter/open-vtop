//seperations of concerns my arse
//nvm i did sepearations of concerns
import {
  solve,
  extractDataUriParts,
  saveCaptchaImage,
} from "./captcha-solver.js";
import * as path from "path";
import {
  BASE,
  VTOP,
  OPEN_PAGE,
  OPEN_PAGE_ALT,
  PRELOGIN_SETUP,
  LOGIN_PAGE,
  INIT_PAGE,
  MAIN_PAGE,
  VTOP_OPEN,
  CONTENT,
  ACADEMICS_CHECK,
  UPCOMING_ASSIGNMENTS,
  COURSE_DETAILS,
  BROWSER_HEADERS,
  LOGIN_POST_HEADERS,
  POST_LOGIN_HEADERS,
  API_REQUEST_HEADERS,
  ACADEMICS_CHECK_HEADERS,
} from "./constants.js";
import {
  extractCsrf,
  extractRegNo,
  detectCaptcha,
  parseAssignmentsHtml,
  parseCourseDetailsHtml,
  type CaptchaDetectionResult,
} from "./parsers.js";

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
  regNo: string | null;
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
      .join("; "); //vvvimp
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

    Object.entries(BROWSER_HEADERS).forEach(([key, value]) => {
      headers.set(key, value);
    });

    const response = await fetch(url, {
      ...options,
      headers,
      redirect: "manual",
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

      // 1: GET / to get SERVERID cookie
      console.log("Step 1: GET / to get SERVERID...");
      await this.fetchWithCookies(BASE);
      console.log("OK");

      // 2: GET /vtop/ to get JSESSIONID cookie
      console.log("Step 2: GET /vtop/ to get JSESSIONID...");
      await this.fetchWithCookies(VTOP);
      console.log("OK");

      // 3: GET /vtop/openPage for CSRF token
      console.log("Step 3: GET /vtop/openPage for CSRF...");
      const openPageRes = await this.fetchWithCookies(OPEN_PAGE);
      const openPageHtml = await openPageRes.text();
      console.log("OK");

      const csrf = extractCsrf(openPageHtml);
      if (!csrf) {
        console.warn("Warning: _csrf not found on /vtop/openPage.");
      } else {
        this.state.csrf = csrf;
        console.log(`Found _csrf: ${csrf.substring(0, 20)}...`);
      }

      // 4: POST /vtop/prelogin/setup
      console.log("Step 4: POST /vtop/prelogin/setup flag=VTOP");
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

  async login(
    username: string,
    password: string,
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
          detectCaptcha(body);

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
            ...LOGIN_POST_HEADERS,
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
      ...POST_LOGIN_HEADERS,
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

      const newCsrf = extractCsrf(contentHtml);
      if (newCsrf) {
        this.state.csrf = newCsrf;
        console.log(`Updated CSRF token from content page`);
      }

      const regNo = extractRegNo(contentHtml);
      if (regNo) {
        this.state.regNo = regNo;
        console.log(`Extracted registration number: ${regNo}`);
      } else {
        console.warn("Failed to extract registration number from content page");
      }

      console.log("Post-login navigation complete");
      return true;
    } catch (e) {
      console.error("Post-login navigation failed:", e);
      return false;
    }
  }

  public async performAcademicsCheck(headers?: any): Promise<void> {
    if (!headers) {
      headers = {
        ...ACADEMICS_CHECK_HEADERS,
        Cookie: this.getCookieHeader(),
      };
    }

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
      ...API_REQUEST_HEADERS,
      Cookie: cookies,
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

      const courses = parseCourseDetailsHtml(html);
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

    // await this.navigatePostLogin();

    const cookies = this.getCookieHeader();
    const now = new Date();

    const apiHeaders = {
      ...API_REQUEST_HEADERS,
      Cookie: cookies,
    };

    // await this.performAcademicsCheck(apiHeaders);

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
        const assignments = parseAssignmentsHtml(assBody);
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
