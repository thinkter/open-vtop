# Template Structure

This directory contains all the JSX templates for the application.

## Directory Structure

```
views/
├── layouts/         # Layout templates
│   └── Base.tsx     # Main HTML layout with Vercel-style dark theme
├── partials.tsx     # Small partial templates for HTMX responses
└── Home.tsx         # Main home page
```

## Design System

The project uses a **Vercel-inspired dark theme**:
- Full black background (#000)
- Monospace font stack (SF Mono, Monaco, etc.)
- Minimal, clean UI with subtle borders
- White text on black background
- Smooth transitions and hover effects

## Usage

### Creating a New Page

1. Create a new file in `views/`, e.g., `About.tsx`
2. Import the `BaseLayout`
3. Export your component as a named export

```tsx
import type { FC } from "hono/jsx";
import { BaseLayout } from "./layouts/Base.js";

export const About: FC = () => {
  return (
    <BaseLayout title="About">
      <h1>About Page</h1>
      <div class="section">
        <h2>Our Story</h2>
        <p>Content goes here...</p>
      </div>
    </BaseLayout>
  );
};
```

4. Import and use it in your route:

```tsx
import { About } from "./views/About.js";

app.get("/about", (c) => {
  return c.html(<About />);
});
```

### Creating Partials

Partials are small components used for HTMX responses. Add them to `partials.tsx`:

```tsx
export const MyPartial: FC<{ data: string }> = ({ data }) => {
  return <div>{data}</div>;
};
```

Use in routes:
```tsx
app.get("/api/data", (c) => {
  return c.html(<MyPartial data="Hello!" />);
});
```

## Important Notes

- All imports must use `.js` extensions (not `.tsx`) due to ESM module resolution
- Use `type { FC } from "hono/jsx"` for component types
- Use `class` instead of `className` for CSS classes (Hono JSX uses HTML attribute names)
- HTMX attributes work directly: `hx-get`, `hx-post`, `hx-target`, etc.

## CSS Classes

Available utility classes from Base layout:
- `.section` - Card-like container with dark background and border
- `.success` - Green success text color
- `.error` - Red error text color

## HTMX Integration

HTMX attributes are applied directly to elements:

```tsx
<button
  hx-get="/api/data"
  hx-target="#result"
  hx-swap="innerHTML"
>
  Load Data
</button>
```

Common patterns:
- `hx-get/post/delete`: HTTP method and endpoint
- `hx-target`: CSS selector for where to insert response
- `hx-swap`: How to insert (innerHTML, outerHTML, beforeend, etc.)
- `hx-trigger`: When to trigger (click, keyup, etc.)
- `hx-confirm`: Show confirmation dialog