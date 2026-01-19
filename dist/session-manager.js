/**
 * Session Manager for VTOP
 * Automatically initializes and maintains VTOP session cookies and CSRF tokens
 */
const BASE = "https://vtop.vit.ac.in";
const VTOP = `${BASE}/vtop/`;
const OPEN_PAGE = `${BASE}/vtop/openPage`;
const OPEN_PAGE_ALT = `${BASE}/vtop/open/page`;
const PRELOGIN_SETUP = `${BASE}/vtop/prelogin/setup`;
class VTOPSessionManager {
    state = {
        cookies: new Map(),
        csrf: null,
        initialized: false,
        lastInitialized: null,
    };
    /**
     * Extract CSRF token from HTML response
     */
    extractCsrf(html) {
        // Look for _csrf token in various forms
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
     * Parse Set-Cookie headers and store cookies
     */
    storeCookies(response) {
        const setCookieHeaders = response.headers.getSetCookie?.() || [];
        for (const cookieStr of setCookieHeaders) {
            const [nameValue] = cookieStr.split(";");
            const [name, value] = nameValue.split("=");
            if (name && value) {
                this.state.cookies.set(name.trim(), value.trim());
            }
        }
    }
    /**
     * Get cookie header string for requests
     */
    getCookieHeader() {
        return Array.from(this.state.cookies.entries())
            .map(([name, value]) => `${name}=${value}`)
            .join("; ");
    }
    /**
     * Make a fetch request with cookie handling
     */
    async fetchWithCookies(url, options = {}) {
        const cookieHeader = this.getCookieHeader();
        const headers = new Headers(options.headers);
        if (cookieHeader) {
            headers.set("Cookie", cookieHeader);
        }
        // Add common browser headers
        headers.set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        headers.set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
        headers.set("Accept-Language", "en-US,en;q=0.9");
        headers.set("Accept-Encoding", "gzip, deflate, br");
        headers.set("Connection", "keep-alive");
        headers.set("Upgrade-Insecure-Requests", "1");
        const response = await fetch(url, {
            ...options,
            headers,
            redirect: "manual", // Handle redirects manually to capture cookies
        });
        // Store any cookies from the response
        this.storeCookies(response);
        // Follow redirects manually if needed
        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("Location");
            if (location) {
                const redirectUrl = location.startsWith("http")
                    ? location
                    : new URL(location, url).toString();
                // Create new options without body for GET redirect
                const redirectOptions = {
                    headers: options.headers,
                    redirect: options.redirect,
                };
                return this.fetchWithCookies(redirectUrl, redirectOptions);
            }
        }
        return response;
    }
    /**
     * Initialize VTOP session
     */
    async initialize() {
        try {
            console.log("🔄 Initializing VTOP session...");
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
                console.warn("⚠️  Warning: _csrf not found on /vtop/openPage. Continuing anyway...");
            }
            else {
                this.state.csrf = csrf;
                console.log(` ✓ Found _csrf: ${csrf.substring(0, 20)}...`);
            }
            // Optional: Visit alternate open page (used as Referer in browser)
            await this.fetchWithCookies(OPEN_PAGE_ALT).catch(() => {
                // Ignore errors on this optional step
            });
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
            console.log(` ✓ Prelogin status: ${preloginRes.status}`);
            // Mark as initialized
            this.state.initialized = true;
            this.state.lastInitialized = new Date();
            console.log("✅ VTOP session initialized successfully!");
            console.log(`   Cookies stored: ${this.state.cookies.size}`);
            console.log(`   Cookie names: ${Array.from(this.state.cookies.keys()).join(", ")}`);
        }
        catch (error) {
            console.error("❌ Failed to initialize VTOP session:", error);
            throw error;
        }
    }
    /**
     * Get current session state
     */
    getState() {
        return {
            ...this.state,
            cookies: new Map(this.state.cookies),
        };
    }
    /**
     * Get CSRF token
     */
    getCsrf() {
        return this.state.csrf;
    }
    /**
     * Get cookies as a header string
     */
    getCookies() {
        return this.getCookieHeader();
    }
    /**
     * Check if session is initialized
     */
    isInitialized() {
        return this.state.initialized;
    }
    /**
     * Re-initialize session (useful for periodic refresh)
     */
    async refresh() {
        console.log("🔄 Refreshing VTOP session...");
        this.state.cookies.clear();
        this.state.csrf = null;
        this.state.initialized = false;
        await this.initialize();
    }
}
// Export singleton instance
export const sessionManager = new VTOPSessionManager();
// Auto-initialize on module load
sessionManager.initialize().catch((error) => {
    console.error("Failed to auto-initialize session:", error);
});
