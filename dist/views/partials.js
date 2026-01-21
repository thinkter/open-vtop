import { jsx as _jsx } from "hono/jsx/jsx-runtime";
export const SuccessMessage = ({ message }) => {
    return _jsx("p", { class: "success", children: message });
};
