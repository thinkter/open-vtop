import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { Home } from "./views/Home.js";
import { SuccessMessage } from "./views/partials.js";

const app = new Hono();

// Serve htmx from node_modules
app.use(
  "/static/htmx.js",
  serveStatic({ path: "./node_modules/htmx.org/dist/htmx.min.js" }),
);

// Main page
app.get("/", (c) => {
  return c.html(<Home />);
});

// API Endpoints
app.get("/api/hello", (c) => {
  return c.html(<SuccessMessage message="Hello from HTMX!" />);
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
