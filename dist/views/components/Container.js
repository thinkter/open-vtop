import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
export const Container = ({ title, children }) => {
    return (_jsxs("div", { class: "container", children: [_jsx("h2", { children: title }), children] }));
};
