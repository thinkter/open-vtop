import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { Home } from "./views/Home.js";
import {
  SuccessMessage,
  WelcomeMessage,
  SearchResults,
  ContentItem,
} from "./views/partials.js";

const app = new Hono();

// Serve htmx from node_modules
app.use(
  "/static/htmx.js",
  serveStatic({ path: "./node_modules/htmx.org/dist/htmx.min.js" }),
);

// Main page with htmx examples
app.get("/", (c) => {
  return c.html(<Home />);
});

// API Endpoints
app.get("/api/hello", (c) => {
  return c.html(<SuccessMessage message="Hello from HTMX!" />);
});

app.post("/api/submit", async (c) => {
  const formData = await c.req.parseBody();
  const name = formData.name as string;
  return c.html(<WelcomeMessage name={name} />);
});

app.get("/api/search", (c) => {
  const query = c.req.query("search") || "";

  const allItems = [
    "Apple",
    "Banana",
    "Cherry",
    "Date",
    "Elderberry",
    "Fig",
    "Grape",
    "Honeydew",
    "Kiwi",
    "Lemon",
  ];

  const results = query
    ? allItems.filter((item) =>
        item.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  return c.html(<SearchResults query={query} results={results} />);
});

app.delete("/api/items/:id", (c) => {
  const id = c.req.param("id");
  console.log(`Deleted item ${id}`);
  return c.html(<SuccessMessage message="Item deleted successfully" />);
});

let loadMoreCount = 0;
app.get("/api/load-more", (c) => {
  loadMoreCount++;
  return c.html(<ContentItem count={loadMoreCount} />);
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
