//seperations of concerns my arse
//nvm i did sepearations of concerns
import {
  solve,
  extractDataUriParts,
  saveCaptchaImage,
} from "./captcha-solver.js";
import * as path from "path";
import * as fs from "fs/promises";
import { EventEmitter } from "events";
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
  LOGOUT_URL,
  LOGOUT_HEADERS,
  EXAM_SCHEDULE,
} from "./constants.js";
import {
  extractCsrf,
  extractRegNo,
  detectCaptcha,
  parseAssignmentsHtml,
  parseCourseDetailsHtml,
  parseExamScheduleHtml,
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

export interface ExamSchedule {
  sNo: string;
  courseCode: string;
  courseTitle: string;
  courseType: string;
  classId: string;
  slot: string;
  examDate: string;
  examSession: string;
  reportingTime: string;
  examTime: string;
  venue: string;
  seatLocation: string;
  seatNo: string;
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

const CREDENTIALS_FILE = path.resolve(process.cwd(), ".credentials.json");

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

  public readonly events = new EventEmitter();

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
    maxAttempts: number = 30, // Increased default for parallel attempts total buffer
    concurrency: number = 3,
  ): Promise<boolean> {
    const startTime = Date.now();
    if (!this.state.initialized) {
      console.log("Session not initialized, initializing first...");
      await this.initialize();
    }

    console.log(`Starting parallel VTOP login (concurrency=${concurrency})...`);
    this.events.emit(
      "log",
      `Starting parallel login with ${concurrency} workers...`,
    );

    const abortController = new AbortController();
    const signal = abortController.signal;
    let winnerDetected = false;
    let loginSuccess = false;

    // We'll trust the first worker that finds a text captcha to handle the login.
    // If it fails the POST, we fail the whole batch for simplicity,
    // or we could retry, but let's stick to "first valid captcha wins" for now.

    const pollWorker = async (workerId: number) => {
      let attempts = 0;
      const logPrefix = `[Worker ${workerId}]`;

      try {
        while (!signal.aborted && !winnerDetected) {
          attempts++;
          if (attempts > maxAttempts) {
            console.log(`${logPrefix} Max attempts reached.`);
            return;
          }

          try {
            // Check signal before fetch
            if (signal.aborted) break;

            // console.log(`${logPrefix} Fetching login page...`); // verbose
            const res = await this.fetchWithCookies(LOGIN_PAGE, {
              signal,
            } as RequestInit);

            // Check signal after fetch (in case it aborted during fetch)
            if (signal.aborted) break;

            const body = await res.text();

            // Re-check detection
            if (winnerDetected || signal.aborted) break;

            const { isTextCaptcha, isRecaptcha, csrf, imgDataUri } =
              detectCaptcha(body);

            this.events.emit(
              "log",
              `${logPrefix} text=${isTextCaptcha} recap=${isRecaptcha}`,
            );

            if (isTextCaptcha && !winnerDetected) {
              // ATOMIC CLAIM
              if (winnerDetected) break; // Double check
              winnerDetected = true;

              console.log(`${logPrefix} !!! WINNER detected Text CAPTCHA !!!`);
              this.events.emit(
                "log",
                `${logPrefix} WINNER! Claiming login task.`,
              );

              // Cancel other workers immediately
              abortController.abort();

              // Proceed with solving and login
              const curJsession = this.state.cookies.get("JSESSIONID") || "(?)";
              const curServerID = this.state.cookies.get("SERVERID") || "(?)";

              let solvedCaptcha = "";
              if (imgDataUri) {
                const cleanDataUri = imgDataUri.trim();
                try {
                  solvedCaptcha = await solve(cleanDataUri);
                  console.log(`${logPrefix} Solved: ${solvedCaptcha}`);
                  this.events.emit(
                    "log",
                    `${logPrefix} Solved CAPTCHA: ${solvedCaptcha}`,
                  );
                } catch (e) {
                  console.error(`${logPrefix} Solve failed:`, e);
                  this.events.emit("log", `${logPrefix} Solve failed.`);
                }
              }

              console.log(`${logPrefix} Submitting Login POST...`);
              this.events.emit("log", `${logPrefix} Submitting credentials...`);

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

              const postRes = await fetch(LOGIN_PAGE, {
                method: "POST",
                headers: postHeaders,
                body: loginForm.toString(),
                redirect: "manual",
              });

              this.storeCookies(postRes);

              // Follow redirect if existing
              const location = postRes.headers.get("Location");
              if (location) {
                const redirectUrl = location.startsWith("http")
                  ? location
                  : new URL(location, LOGIN_PAGE).toString();
                await this.fetchWithCookies(redirectUrl);
              }

              this.state.loggedIn = true;
              this.state.username = username;

              // Save credentials asynchronously
              this.saveCredentials(username, password).catch((err) =>
                console.error("Save creds failed", err),
              );

              const duration = (Date.now() - startTime) / 1000;
              console.log(`${logPrefix} Login success in ${duration}s`);
              this.events.emit(
                "log",
                `${logPrefix} Login SUCCESS in ${duration}s`,
              );

              const logEntry = `[${new Date().toISOString()}] Login took ${duration} seconds (Workers: ${concurrency})\n`;
              try {
                await fs.appendFile("login_times.txt", logEntry);
                console.log(`${logPrefix} Login time recorded to file.`);
              } catch (err) {
                console.error(`${logPrefix} Failed to write login time:`, err);
              }

              loginSuccess = true;
              return;
            } else {
              // Not text captcha, retry
              if (isRecaptcha) {
                this.events.emit(
                  "log",
                  `${logPrefix} Saw reCAPTCHA, skipping...`,
                );
              }
              // Random delay/jitter to desynchronize workers
              const delay = 500 + Math.random() * 500;
              await new Promise((r) => setTimeout(r, delay));
            }
          } catch (e: any) {
            if (e.name === "AbortError") {
              // Ignore aborts
              break;
            }
            console.error(`${logPrefix} error:`, e);
            this.events.emit("log", `${logPrefix} error: ${e.message}`);
            // Short delay on error
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(`${logPrefix} unexpected fatal error:`, err);
        }
      }
    };

    const workers = [];
    for (let i = 1; i <= concurrency; i++) {
      workers.push(pollWorker(i));
    }

    await Promise.all(workers);

    if (loginSuccess) {
      this.events.emit("login-complete");
      return true;
    } else {
      console.log("All workers finished without success.");
      this.events.emit("log", "All workers failed/exhausted.");
      this.events.emit("login-complete");
      return false;
    }
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

  async fetchExamSchedule(): Promise<ExamSchedule[]> {
    if (!this.state.loggedIn || !this.state.regNo) {
      console.error("Cannot fetch exam schedule: not logged in or no regNo");
      return [];
    }

    const cookies = this.getCookieHeader();
    const now = new Date(); // Although payload doesn't seem to use 'x' timestamp, we'll keep it consistent if needed or omit.
    // Based on user image, payload is: authorizedID, _csrf, semesterSubId.

    const apiHeaders = {
      ...API_REQUEST_HEADERS,
      Cookie: cookies,
    };

    const params = new URLSearchParams();
    params.set("authorizedID", this.state.regNo);
    if (this.state.csrf) params.set("_csrf", this.state.csrf);
    params.set("semesterSubId", "VL20252605"); // Hardcoded as requested

    try {
      console.log("Fetching exam schedule...");
      const res = await fetch(EXAM_SCHEDULE, {
        method: "POST",
        headers: apiHeaders,
        body: params.toString(),
      });

      console.log(` -> Exam schedule status: ${res.status}`);
      const html = await res.text();
      // console.log(` -> Exam schedule response length: ${html.length}`);

      if (html) {
        const schedule = parseExamScheduleHtml(html);
        console.log(` Parsed ${schedule.length} exam entries`);
        return schedule;
      }
    } catch (e) {
      console.error("Failed to fetch exam schedule:", e);
    }
    return [];
  }

  async logout(): Promise<boolean> {
    if (!this.state.loggedIn) {
      console.log("Already logged out or not logged in.");
      return true;
    }

    console.log("Logging out...");

    // Attempt to notify VTOP server
    try {
      const cookies = this.getCookieHeader();
      const headers = {
        ...LOGOUT_HEADERS,
        Cookie: cookies,
      };

      const formData = new URLSearchParams();
      if (this.state.csrf) {
        formData.set("_csrf", this.state.csrf);
      }

      const res = await fetch(LOGOUT_URL, {
        method: "POST",
        headers,
        body: formData.toString(),
        redirect: "manual",
      });

      console.log(` -> Logout POST status: ${res.status}`);
      if (res.status === 302 || res.status === 200) {
        console.log("Server session cleared effectively.");
      }
    } catch (e) {
      console.warn(
        "Logout request failed (network error?), clearing local session anyway.",
        e,
      );
    }

    // Clear local session
    this.state.cookies.clear();
    this.state.csrf = null;
    this.state.initialized = false;
    this.state.loggedIn = false;
    this.state.username = null;
    this.state.regNo = null;

    this.events.emit("logout");
    console.log("Local session cleared.");
    return true;
  }

  private async saveCredentials(username: string, password: string) {
    try {
      await fs.writeFile(
        CREDENTIALS_FILE,
        JSON.stringify({ username, password }),
      );
      console.log("Credentials saved locally.");
    } catch (e) {
      console.error("Failed to save credentials:", e);
    }
  }

  private async loadCredentials(): Promise<{
    username: string;
    password: string;
  } | null> {
    try {
      const data = await fs.readFile(CREDENTIALS_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  async tryAutoLogin() {
    const creds = await this.loadCredentials();
    if (creds) {
      console.log(`Found saved credentials for user: ${creds.username}`);
      console.log("Attemping auto-login...");
      const success = await this.login(creds.username, creds.password);
      if (success) {
        console.log("Auto-login successful!");
        await this.navigatePostLogin();
        await this.performAcademicsCheck();
      } else {
        console.log("Auto-login failed.");
      }
    } else {
      console.log("No saved credentials found.");
    }
  }
}

export const sessionManager = new VTOPSessionManager();
