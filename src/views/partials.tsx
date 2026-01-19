import type { FC } from "hono/jsx";

type SuccessMessageProps = {
  message: string;
};

export const SuccessMessage: FC<SuccessMessageProps> = ({ message }) => {
  return <p class="success">✅ {message}</p>;
};

type ErrorMessageProps = {
  message: string;
};

export const ErrorMessage: FC<ErrorMessageProps> = ({ message }) => {
  return <p class="error">❌ {message}</p>;
};

type WelcomeMessageProps = {
  name: string;
};

export const WelcomeMessage: FC<WelcomeMessageProps> = ({ name }) => {
  return (
    <p class="success">
      ✅ Welcome, <strong>{name}</strong>!
    </p>
  );
};

type SearchResultsProps = {
  query: string;
  results: string[];
};

export const SearchResults: FC<SearchResultsProps> = ({ query, results }) => {
  if (!query) {
    return <p>Start typing to search...</p>;
  }

  if (results.length === 0) {
    return <p class="error">No results found</p>;
  }

  return (
    <div>
      <p>Found {results.length} result(s):</p>
      <ul>
        {results.map((item) => (
          <li>{item}</li>
        ))}
      </ul>
    </div>
  );
};

type ContentItemProps = {
  count: number;
};

export const ContentItem: FC<ContentItemProps> = ({ count }) => {
  return <div class="content-item">📦 Loaded content #{count}</div>;
};
