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

        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  background: '#000000',
                  surface: '#111111',
                  border: '#333333',
                  foreground: '#ffffff',
                  muted: '#888888',
                  primary: '#ffffff',
                  'primary-fg': '#000000',
                },
                fontFamily: {
                  sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                }
              }
            }
          }
        `,
          }}
        />

        {/* Alpine.js */}
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/cdn.min.js"
        ></script>

        <style
          dangerouslySetInnerHTML={{
            __html: `
          body {
            background-color: theme('colors.background');
            color: theme('colors.foreground');
          }
          /* Custom spinner animation since Tailwind's animate-spin is utility based */
          .htmx-indicator {
            display: none;
            opacity: 0;
            transition: opacity 200ms ease-in;
          }
          .htmx-request .htmx-indicator,
          .htmx-request.htmx-indicator {
            display: inline-block;
            opacity: 1;
          }
        `,
          }}
        />
      </head>
      <body class="bg-background text-foreground antialiased min-h-screen">
        <main class="w-full max-w-[1800px] mx-auto p-4 md:p-6 flex flex-col gap-6">
          {children}
        </main>
      </body>
    </html>
  );
};
