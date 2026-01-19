# Template Structure

This directory contains all the JSX templates for the application.

## Directory Structure

```
views/
├── layouts/         # Layout templates
│   └── Base.tsx     # Main HTML layout with head, body, styles
├── components/      # Reusable components
│   ├── Container.tsx  # Section container wrapper
│   └── Item.tsx       # Item component with delete action
├── partials.tsx     # Small partial templates for API responses
└── Home.tsx         # Main home page
```

## Usage

### Creating a New Page

1. Create a new file in `views/`, e.g., `About.tsx`
2. Import the `BaseLayout` and any components you need
3. Export your component as a named export

```tsx
import type { FC } from "hono/jsx";
import { BaseLayout } from "./layouts/Base.js";
import { Container } from "./components/Container.js";

export const About: FC = () => {
  return (
    <BaseLayout title="About Us">
      <h1>About Page</h1>
      <Container title="Our Story">
        <p>Content goes here...</p>
      </Container>
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
  return <div class="my-class">{data}</div>;
};
```

### Creating Components

Reusable components go in `components/`:

```tsx
import type { FC } from "hono/jsx";

type MyComponentProps = {
  title: string;
  children?: any;
};

export const MyComponent: FC<MyComponentProps> = ({ title, children }) => {
  return (
    <div class="my-component">
      <h3>{title}</h3>
      {children}
    </div>
  );
};
```

## Important Notes

- All imports must use `.js` extensions (not `.tsx`) due to ESM module resolution
- Use `type { FC } from "hono/jsx"` for component types
- Use `class` instead of `className` for CSS classes (Hono JSX uses HTML attribute names)
- HTMX attributes work directly: `hx-get`, `hx-post`, `hx-target`, etc.

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