import type { FC } from "hono/jsx";

type ItemProps = {
  id: string | number;
  name: string;
};

export const Item: FC<ItemProps> = ({ id, name }) => {
  return (
    <div id={`item-${id}`} class="item">
      {name}
      <button
        hx-delete={`/api/items/${id}`}
        hx-confirm="Are you sure you want to delete this item?"
        hx-target={`#item-${id}`}
        hx-swap="outerHTML"
        class="danger"
      >
        Delete
      </button>
    </div>
  );
};
