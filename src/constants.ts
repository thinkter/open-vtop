// VTOP API endpoints and constants

export const BASE = "https://vtop.vit.ac.in";
export const VTOP = `${BASE}/vtop/`;
export const OPEN_PAGE = `${BASE}/vtop/openPage`;
export const OPEN_PAGE_ALT = `${BASE}/vtop/open/page`;
export const PRELOGIN_SETUP = `${BASE}/vtop/prelogin/setup`;
export const LOGIN_PAGE = `${BASE}/vtop/login`;

export const INIT_PAGE = `${BASE}/vtop/init/page`;
export const MAIN_PAGE = `${BASE}/vtop/main/page`;
export const VTOP_OPEN = `${BASE}/vtop/open`;
export const CONTENT = `${BASE}/vtop/content`;
export const ACADEMICS_CHECK = `${BASE}/vtop/academics/common/AcademicsDefaultCheck`;
export const UPCOMING_ASSIGNMENTS = `${BASE}/vtop/get/upcoming/digital/assignments`;
export const COURSE_DETAILS = `${BASE}/vtop/get/dashboard/current/semester/course/details`;
export const EXAM_SCHEDULE = `${BASE}/vtop/examinations/doSearchExamScheduleForStudent`;

// HTTP Headers

// Common browser headers
export const USER_AGENT_CHROME =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
export const USER_AGENT_CHROME_139 =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";
export const USER_AGENT_CHROME_140 =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

export const ACCEPT_HTML =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8";
export const ACCEPT_HTML_EXTENDED =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8";
export const ACCEPT_ALL = "*/*";

export const ACCEPT_LANGUAGE = "en-US,en;q=0.9";
export const ACCEPT_LANGUAGE_ALT = "en-US,en;q=0.7";

export const ACCEPT_ENCODING = "gzip, deflate, br";
export const ACCEPT_ENCODING_ZSTD = "gzip, deflate, br, zstd";

// Standard headers for fetch requests
export const BROWSER_HEADERS = {
  "User-Agent": USER_AGENT_CHROME,
  Accept: ACCEPT_HTML,
  "Accept-Language": ACCEPT_LANGUAGE,
  "Accept-Encoding": ACCEPT_ENCODING,
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
} as const;

// Headers for login POST request
export const LOGIN_POST_HEADERS = {
  "Cache-Control": "max-age=0",
  Origin: BASE,
  Referer: OPEN_PAGE_ALT,
  "Content-Type": "application/x-www-form-urlencoded",
  Accept: ACCEPT_HTML_EXTENDED,
  "Accept-Encoding": ACCEPT_ENCODING_ZSTD,
  "Accept-Language": ACCEPT_LANGUAGE,
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  Priority: "u=0, i",
} as const;

// Headers for post-login navigation
export const POST_LOGIN_HEADERS = {
  Referer: LOGIN_PAGE,
  "User-Agent": USER_AGENT_CHROME_140,
  Accept: ACCEPT_HTML_EXTENDED,
  "Accept-Encoding": ACCEPT_ENCODING_ZSTD,
  "Cache-Control": "max-age=0",
  "Upgrade-Insecure-Requests": "1",
  Origin: BASE,
  "Content-Type": "application/x-www-form-urlencoded",
} as const;

// Headers for API requests (assignments, courses)
export const API_REQUEST_HEADERS = {
  Accept: ACCEPT_ALL,
  "Accept-Encoding": ACCEPT_ENCODING_ZSTD,
  "Accept-Language": ACCEPT_LANGUAGE_ALT,
  "Content-Type": "application/x-www-form-urlencoded",
  Origin: BASE,
  Priority: "u=1, i",
  Referer: CONTENT,
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "User-Agent": USER_AGENT_CHROME_139,
} as const;

// Headers for academics check
export const ACADEMICS_CHECK_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  Referer: CONTENT,
  "User-Agent": USER_AGENT_CHROME_139,
} as const;

export const LOGOUT_URL = `${BASE}/vtop/logout`;

export const LOGOUT_HEADERS = {
  Accept: ACCEPT_HTML_EXTENDED,
  "Accept-Encoding": ACCEPT_ENCODING_ZSTD,
  "Accept-Language": ACCEPT_LANGUAGE,
  "Cache-Control": "no-cache",
  "Content-Type": "application/x-www-form-urlencoded",
  Origin: BASE,
  Pragma: "no-cache",
  Priority: "u=0, i",
  Referer: CONTENT,
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
} as const;
