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
            <h1 class="text-2xl font-bold tracking-tight text-white">
              Welcome back
            </h1>
            <p class="text-sm mt-2">
              Enter your vtop username and password.This app runs completely
              clientside and has no telemetry{" "}
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

            {/*fix this i don't know tailwind bruh :crying:*/}
            <template x-if="loading">
              <div class="mt-6" x-init="htmx.process($el)">
                <div class="relative bg-black/40 border border-white/10 rounded-lg p-4 overflow-hidden group">
                  <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  <div class="flex items-center gap-3">
                    <div class="flex-shrink-0">
                      <div class="relative flex h-3 w-3">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </div>
                    </div>
                    <div
                      class="font-mono text-xs text-green-200/90 w-full truncate"
                      hx-ext="sse"
                      sse-connect="/api/login/events"
                      sse-swap="log"
                      sse-close="login-complete"
                      hx-swap="innerHTML"
                    >
                      Initializing connection...
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};
