import type { FC } from "hono/jsx";

export const BaseLayout: FC<{ title: string; children: any }> = ({
  title,
  children,
}) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <script src="/static/htmx.js"></script>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Dank Mono', 'Source Code Pro', monospace;
            background: #000;
            color: #fff;
            min-height: 100vh;
            padding: 2rem;
            line-height: 1.6;
          }

          h1 {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 2rem;
            letter-spacing: -0.02em;
          }

          h2 {
            font-size: 1.25rem;
            font-weight: 500;
            margin-bottom: 1rem;
            letter-spacing: -0.01em;
          }

          .container {
            max-width: 800px;
            margin: 0 auto;
          }

          .section {
            background: #111;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 2rem;
            margin-bottom: 2rem;
            transition: border-color 0.2s ease;
          }

          .section:hover {
            border-color: #555;
          }

          button {
            background: #fff;
            color: #000;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
            font-family: inherit;
            font-weight: 500;
            transition: all 0.2s ease;
          }

          button:hover {
            background: #e6e6e6;
            transform: translateY(-1px);
          }

          button:active {
            transform: translateY(0);
          }

          input {
            background: #111;
            color: #fff;
            border: 1px solid #333;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-family: inherit;
            width: 100%;
            transition: border-color 0.2s ease;
          }

          input:focus {
            outline: none;
            border-color: #fff;
          }

          input::placeholder {
            color: #666;
          }

          #result {
            margin-top: 1rem;
            padding: 1rem;
            background: #0a0a0a;
            border: 1px solid #222;
            border-radius: 6px;
            min-height: 2rem;
            font-size: 0.875rem;
          }

          .success {
            color: #0f0;
          }

          .error {
            color: #f00;
          }

          .htmx-swapping {
            opacity: 0.5;
            transition: opacity 0.2s;
          }

          .htmx-request {
            opacity: 0.8;
          }
        `}</style>
      </head>
      <body>
        <div class="container">{children}</div>
      </body>
    </html>
  );
};
