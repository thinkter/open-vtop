import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { BaseLayout } from "./layouts/Base.js";
export const Home = () => {
    return (_jsxs(BaseLayout, { title: "Open-VTOP", children: [_jsx("h1", { children: "Open-VTOP" }), _jsxs("div", { class: "section", children: [_jsx("h2", { children: "VTOP Session Status" }), _jsx("button", { "hx-get": "/api/session/status", "hx-target": "#session-status", "hx-swap": "innerHTML", "hx-trigger": "load, click", children: "Refresh Status" }), _jsx("div", { id: "session-status", children: "Loading session status..." })] }), _jsxs("div", { class: "section", children: [_jsx("h2", { children: "Example: Simple Click" }), _jsx("button", { "hx-get": "/api/hello", "hx-target": "#result", "hx-swap": "innerHTML", children: "Click Me" }), _jsx("div", { id: "result" })] })] }));
};
