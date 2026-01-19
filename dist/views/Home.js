import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { BaseLayout } from "./layouts/Base.js";
export const Home = () => {
    return (_jsxs(BaseLayout, { title: "HTMX + Hono Example", children: [_jsx("h1", { children: "\uD83D\uDE80 HTMX + Hono" }), _jsxs("div", { class: "section", children: [_jsx("h2", { children: "Example: Simple Click" }), _jsx("button", { "hx-get": "/api/hello", "hx-target": "#result", "hx-swap": "innerHTML", children: "Click Me" }), _jsx("div", { id: "result" })] })] }));
};
