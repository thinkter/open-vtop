import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
export const Item = ({ id, name }) => {
    return (_jsxs("div", { id: `item-${id}`, class: "item", children: [name, _jsx("button", { "hx-delete": `/api/items/${id}`, "hx-confirm": "Are you sure you want to delete this item?", "hx-target": `#item-${id}`, "hx-swap": "outerHTML", class: "danger", children: "Delete" })] }));
};
