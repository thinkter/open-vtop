import type { FC } from "hono/jsx";

type BaseLayoutProps = {
  title?: string;
  children?: any;
};

export const BaseLayout: FC<BaseLayoutProps> = ({ title = "HTMX + Hono", children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <script src="/static/htmx.js"></script>
        <style>{`
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
          }
          button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
          }
          button:hover {
            background: #2563eb;
          }
          button.danger {
            background: #ef4444;
          }
          button.danger:hover {
            background: #dc2626;
          }
          input {
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
          }
          .success { color: #10b981; }
          .error { color: #ef4444; }
          .loading { opacity: 0.6; }
          .htmx-swapping { opacity: 0.5; transition: opacity 0.2s; }
          .item {
            padding: 0.5rem;
            border: 1px solid #ddd;
            margin: 0.5rem 0;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .content-item {
            padding: 0.5rem;
            background: #f0f9ff;
            margin: 0.5rem 0;
            border-radius: 4px;
          }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
};
