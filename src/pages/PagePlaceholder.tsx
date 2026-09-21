import type { ReactNode } from 'react';

interface PagePlaceholderProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
}

export function PagePlaceholder({ eyebrow, title, children }: PagePlaceholderProps) {
  return (
    <section className="page-placeholder" aria-labelledby="page-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1 id="page-title">{title}</h1>
      <div className="page-copy">{children}</div>
    </section>
  );
}
