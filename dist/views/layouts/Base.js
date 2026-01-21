import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
export const BaseLayout = ({ title, children, }) => {
    return (_jsxs("html", { lang: "en", children: [_jsxs("head", { children: [_jsx("meta", { charset: "UTF-8" }), _jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }), _jsx("title", { children: title }), _jsx("script", { src: "/static/htmx.js" }), _jsx("script", { src: "https://cdn.tailwindcss.com" }), _jsx("script", { dangerouslySetInnerHTML: {
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
                        } }), _jsx("script", { defer: true, src: "https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/cdn.min.js" }), _jsx("style", { dangerouslySetInnerHTML: {
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
                        } })] }), _jsx("body", { class: "bg-background text-foreground antialiased min-h-screen", children: _jsx("main", { class: "w-full max-w-[1800px] mx-auto p-4 md:p-6 flex flex-col gap-6", children: children }) })] }));
};
