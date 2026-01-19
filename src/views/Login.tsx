import type { FC } from "hono/jsx";
import { BaseLayout } from "./layouts/Base.js";

export const Login: FC = () => {
  return (
    <BaseLayout title="Login - Open-VTOP">
      <div
        x-data="{ 
          showPassword: false, 
          loading: false 
        }"
        class="w-full"
      >
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold tracking-tight mb-2">Log In</h1>
          <p class="text-muted text-sm">
            Enter your VTOP credentials to continue.
          </p>
        </div>

        <div class="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <form
            id="login-form"
            hx-post="/api/login/form"
            hx-target="body"
            hx-swap="outerHTML"
            {...{ "x-on:submit": "loading = true" }}
            {...{ "x-on:htmx:after-request": "loading = false" }}
          >
            <div class="mb-4">
              <label class="block text-sm text-muted mb-2" for="username">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                autofocus
                class="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-white transition-colors placeholder-muted"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm text-muted mb-2" for="password">
                Password
              </label>
              <div class="relative">
                <input
                  {...{ "x-bind:type": "showPassword ? 'text' : 'password'" }}
                  id="password"
                  name="password"
                  required
                  class="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-white transition-colors placeholder-muted pr-10"
                />
                <button
                  type="button"
                  {...{ "x-on:click": "showPassword = !showPassword" }}
                  class="absolute inset-y-0 right-0 px-3 flex items-center text-muted hover:text-foreground transition-colors"
                >
                  <span x-show="!showPassword" class="text-xs font-medium">
                    SHOW
                  </span>
                  <span
                    x-show="showPassword"
                    style="display: none;"
                    class="text-xs font-medium"
                  >
                    HIDE
                  </span>
                </button>
              </div>
            </div>

            <div class="mb-6">
              <label class="block text-sm text-muted mb-2" for="regNo">
                Registration Number
              </label>
              <input
                type="text"
                id="regNo"
                name="regNo"
                required
                class="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-white transition-colors placeholder-muted"
              />
            </div>

            <button
              type="submit"
              class="w-full bg-white text-black font-semibold py-2.5 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              {...{ "x-bind:disabled": "loading" }}
            >
              <span x-show="!loading">Log In</span>
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

        <div class="text-center mt-8 text-muted text-xs">
          <p>Open-VTOP &copy; 2026</p>
        </div>
      </div>
    </BaseLayout>
  );
};
