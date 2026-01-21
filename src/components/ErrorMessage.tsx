export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      id="error-message"
      class="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-500 text-sm"
    >
      {message}
    </div>
  );
}
