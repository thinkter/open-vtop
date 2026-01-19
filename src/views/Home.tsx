import type { FC } from "hono/jsx";
import { BaseLayout } from "./layouts/Base.js";
import { Container } from "./components/Container.js";
import { Item } from "./components/Item.js";

export const Home: FC = () => {
  return (
    <BaseLayout title="HTMX + Hono Example">
      <h1>🚀 HTMX + Hono Boilerplate</h1>

      {/* Example 1: Simple Click */}
      <Container title="Example 1: Simple Click">
        <button hx-get="/api/hello" hx-target="#result1" hx-swap="innerHTML">
          Click Me!
        </button>
        <div id="result1" style="margin-top: 1rem;"></div>
      </Container>

      {/* Example 2: Form Submission */}
      <Container title="Example 2: Form Submission">
        <form hx-post="/api/submit" hx-target="#result2" hx-swap="innerHTML">
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            required
          />
          <button type="submit">Submit</button>
        </form>
        <div id="result2" style="margin-top: 1rem;"></div>
      </Container>

      {/* Example 3: Live Search */}
      <Container title="Example 3: Live Search">
        <input
          type="search"
          name="search"
          placeholder="Search..."
          hx-get="/api/search"
          hx-trigger="keyup changed delay:300ms"
          hx-target="#search-results"
          hx-indicator="#spinner"
        />
        <span id="spinner" class="htmx-indicator">
          🔄 Searching...
        </span>
        <div id="search-results" style="margin-top: 1rem;"></div>
      </Container>

      {/* Example 4: Delete with Confirmation */}
      <Container title="Example 4: Delete Items">
        <div id="items">
          <Item id={1} name="Item 1" />
          <Item id={2} name="Item 2" />
        </div>
      </Container>

      {/* Example 5: Load More */}
      <Container title="Example 5: Load More Content">
        <div id="content-list">
          <p>Initial content...</p>
        </div>
        <button
          hx-get="/api/load-more"
          hx-target="#content-list"
          hx-swap="beforeend"
        >
          Load More
        </button>
      </Container>
    </BaseLayout>
  );
};
