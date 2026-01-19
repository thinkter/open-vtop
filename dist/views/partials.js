import { jsxs as _jsxs, jsx as _jsx } from "hono/jsx/jsx-runtime";
export const SuccessMessage = ({ message }) => {
    return _jsxs("p", { class: "success", children: ["\u2705 ", message] });
};
export const ErrorMessage = ({ message }) => {
    return _jsxs("p", { class: "error", children: ["\u274C ", message] });
};
export const WelcomeMessage = ({ name }) => {
    return (_jsxs("p", { class: "success", children: ["\u2705 Welcome, ", _jsx("strong", { children: name }), "!"] }));
};
export const SearchResults = ({ query, results }) => {
    if (!query) {
        return _jsx("p", { children: "Start typing to search..." });
    }
    if (results.length === 0) {
        return _jsx("p", { class: "error", children: "No results found" });
    }
    return (_jsxs("div", { children: [_jsxs("p", { children: ["Found ", results.length, " result(s):"] }), _jsx("ul", { children: results.map((item) => (_jsx("li", { children: item }))) })] }));
};
export const ContentItem = ({ count }) => {
    return _jsxs("div", { class: "content-item", children: ["\uD83D\uDCE6 Loaded content #", count] });
};
