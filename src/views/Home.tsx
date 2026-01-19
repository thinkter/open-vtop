import type { FC } from "hono/jsx";
import { BaseLayout } from "./layouts/Base.js";

export const Home: FC = () => {
  return (
    <BaseLayout title="HTMX + Hono Example">
      <h1>🚀 HTMX + Hono</h1>

      <div class="section">
        <h2>Example: Simple Click</h2>
        <button hx-get="/api/hello" hx-target="#result" hx-swap="innerHTML">
          Click Me
        </button>
        <div id="result"></div>
      </div>
    </BaseLayout>
  );
};
