export function EmptyState({ message }: { message: string }) {
  return (
    <div class="p-8 text-center bg-surface border border-border rounded-lg text-muted text-sm">
      {message}
    </div>
  );
}
