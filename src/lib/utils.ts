import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '--';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Date compacte jj/mm/aa, pour les colonnes de tableau où la place manque. */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '--';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '--';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(num);
}

// Tags/attributes the rich-text editor is allowed to produce. Anything else is
// stripped so user-supplied comment HTML can't carry scripts or event handlers.
const ALLOWED_TAGS = new Set([
  'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'A', 'UL', 'OL', 'LI',
  'BLOCKQUOTE', 'CODE', 'PRE', 'H1', 'H2', 'H3', 'H4', 'SPAN', 'IMG',
]);
const ALLOWED_ATTRS = new Set(['href', 'src', 'alt', 'title', 'target', 'rel']);
const SAFE_URL = /^(https?:|mailto:|data:image\/)/i;

/**
 * Sanitize untrusted HTML before injecting it via dangerouslySetInnerHTML.
 * Removes disallowed elements, all event handlers (on*), and unsafe URLs
 * (javascript:, etc.). Uses the browser DOM parser — no external dependency.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  if (typeof document === 'undefined') return ''; // SSR / non-DOM guard

  const template = document.createElement('template');
  template.innerHTML = dirty;

  const walk = (node: Element) => {
    // Iterate over a static copy since we mutate the tree as we go.
    for (const child of Array.from(node.children)) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.remove();
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        if (!ALLOWED_ATTRS.has(name) || name.startsWith('on')) {
          child.removeAttribute(attr.name);
          continue;
        }
        if ((name === 'href' || name === 'src') && !SAFE_URL.test(attr.value.trim())) {
          child.removeAttribute(attr.name);
        }
      }
      walk(child);
    }
  };

  walk(template.content as unknown as Element);
  // Force external links to be safe.
  template.content.querySelectorAll('a[target="_blank"]').forEach((a) =>
    a.setAttribute('rel', 'noopener noreferrer'),
  );
  return template.innerHTML;
}
