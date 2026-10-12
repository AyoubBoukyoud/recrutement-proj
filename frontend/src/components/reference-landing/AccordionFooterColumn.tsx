'use client';

import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

/** Native disclosure remains keyboard accessible even before hydration. */
export function AccordionFooterColumn({ title, links }: { title: string; links: string[][] }) {
  const id = useId();
  const items = <ul>{links.map(([href, label]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>;
  return <div className="premium-footer-column">
    <details className="premium-footer-disclosure">
      <summary aria-controls={id}>{title}<ChevronDown size={18} aria-hidden="true"/></summary>
      <div id={id}>{items}</div>
    </details>
    <div className="premium-footer-desktop"><h2>{title}</h2>{items}</div>
  </div>;
}
