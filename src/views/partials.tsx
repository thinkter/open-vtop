import type { FC } from "hono/jsx";

type SuccessMessageProps = {
  message: string;
};

export const SuccessMessage: FC<SuccessMessageProps> = ({ message }) => {
  return <p class="success">✓ {message}</p>;
};
