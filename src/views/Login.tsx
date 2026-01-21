import type { FC } from "hono/jsx";
import { BaseLayout } from "./layouts/Base.js";

export const Login: FC = () => {
  return (
    <BaseLayout title="Login - Open-VTOP">
      <div
        class="min-h-[80vh] flex flex-col items-center justify-center w-full max-w-md mx-auto"
        x-data="{
          showPassword: false,
          loading: false
        }"
      >
        <div class="w-full space-y-8">
          <div class="flex flex-col items-center text-center">
            <div class="h-12 w-12 rounded-xl bg-white text-black flex items-center justify-center mb-6 shadow-lg shadow-white/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.258 50.558 50.558 0 01-2.658.812m-15.482 0a50.553 50.553 0 0115.482 0m-1.566-4.346a6.053 6.053 0 01-5.91 5.863 6.053 6.053 0 00-5.9-5.863"
                />
              </svg>
            </div>
            <h1 class="text-2xl font-bold tracking-tight text-white">
              Welcome back
            </h1>
            <p class="text-sm text-muted mt-2">
              Enter your credentials to access the portal
            </p>
          </div>

          <div class="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-8 shadow-xl">
            <form
              id="login-form"
              hx-post="/api/login/form"
              hx-target="body"
              hx-swap="outerHTML"
              {...{ "x-on:submit": "loading = true" }}
              {...{ "x-on:htmx:after-request": "loading = false" }}
              class="space-y-5"
            >
              <div class="space-y-2">
                <label
                  class="text-xs font-medium text-muted uppercase tracking-wider"
                  for="username"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  autofocus
                  placeholder="Enter your username"
                  class="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all placeholder-muted/50"
                />
              </div>

              <div class="space-y-2">
                <label
                  class="text-xs font-medium text-muted uppercase tracking-wider"
                  for="password"
                >
                  Password
                </label>
                <div class="relative">
                  <input
                    {...{ "x-bind:type": "showPassword ? 'text' : 'password'" }}
                    id="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    class="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all placeholder-muted/50 pr-12"
                  />
                  <button
                    type="button"
                    {...{ "x-on:click": "showPassword = !showPassword" }}
                    class="absolute inset-y-0 right-0 px-3 flex items-center text-muted hover:text-foreground transition-colors"
                  >
                    <span
                      x-show="!showPassword"
                      class="text-[0.65rem] font-bold tracking-wider opacity-70"
                    >
                      SHOW
                    </span>
                    <span
                      x-show="showPassword"
                      style="display: none;"
                      class="text-[0.65rem] font-bold tracking-wider opacity-70"
                    >
                      HIDE
                    </span>
                  </button>
                </div>
              </div>

              <div class="space-y-2">
                <label
                  class="text-xs font-medium text-muted uppercase tracking-wider"
                  for="regNo"
                >
                  Reg No
                </label>
                <input
                  type="text"
                  id="regNo"
                  name="regNo"
                  required
                  placeholder="e.g. 22BCE0001"
                  class="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all placeholder-muted/50"
                />
              </div>

              <button
                type="submit"
                class="w-full bg-white text-black font-bold text-sm py-3 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2"
                {...{ "x-bind:disabled": "loading" }}
              >
                <span x-show="!loading">Sign In</span>
                <span
                  x-show="loading"
                  style="display: none;"
                  class="flex items-center gap-2"
                >
                  <svg
                    class="animate-spin h-4 w-4 text-black"
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
                  Authenticating...
                </span>
              </button>

              <div id="error-message"></div>
            </form>
          </div>

          <p class="text-center text-xs text-muted/50">Open-VTOP &copy; 2026</p>
        </div>
      </div>
    </BaseLayout>
  );
};
