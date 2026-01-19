import type { FC } from "hono/jsx";

type ContainerProps = {
  title: string;
  children?: any;
};

export const Container: FC<ContainerProps> = ({ title, children }) => {
  return (
    <div class="container">
      <h2>{title}</h2>
      {children}
    </div>
  );
};
