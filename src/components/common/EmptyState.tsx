import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({
  title = 'Aucun résultat',
  description = 'Aucun élément à afficher pour le moment.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="w-12 h-12 text-[var(--k-border)] mb-4" />
      <h3 className="text-lg font-medium text-[var(--k-text)]">{title}</h3>
      <p className="text-[13px] text-[var(--k-muted)] mt-1">{description}</p>
    </div>
  );
}
