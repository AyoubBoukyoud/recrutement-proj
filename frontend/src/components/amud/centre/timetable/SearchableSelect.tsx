'use client';

import { useId, useState } from 'react';
import type { TimetableResource } from '@/lib/amud/services/timetableService';
import { useDropdown } from '@/components/amud/ui';

/** A keyboard-operable combobox shared by the session assignment fields. */
export function SearchableSelect({ label, value, options, onChange, disabled = false }: { label: string; value: number; options: TimetableResource[]; onChange: (id: number) => void; disabled?: boolean }) {
  const id = useId();
  const dropdown = useDropdown<HTMLDivElement>();
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(0);
  const filtered = options.filter((option) => option.name.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr')));
  const current = options.find((option) => option.id === value);
  function choose(id: number) { onChange(id); dropdown.setOpen(false); setSearch(''); }
  return <div ref={dropdown.ref} className="relative">
    <label htmlFor={id} className="mb-1 block text-label-md text-amud-on-surface-variant">{label} *</label>
    <input id={id} role="combobox" aria-expanded={dropdown.open} aria-controls={`${id}-options`} aria-autocomplete="list" aria-activedescendant={dropdown.open && filtered[active] ? `${id}-${filtered[active].id}` : undefined}
      autoComplete="off" disabled={disabled} value={dropdown.open ? search : current?.name ?? ''} placeholder={`Choisir — ${label.toLowerCase()}`}
      onFocus={() => { dropdown.setOpen(true); setSearch(''); setActive(0); }}
      onChange={(event) => { setSearch(event.target.value); setActive(0); dropdown.setOpen(true); }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); dropdown.setOpen(true); setActive((index) => Math.max(0, Math.min(filtered.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))); }
        if (event.key === 'Enter' && dropdown.open) { event.preventDefault(); if (filtered[active]) choose(filtered[active].id); }
        if (event.key === 'Escape' && dropdown.open) { event.stopPropagation(); dropdown.setOpen(false); }
        if (event.key === 'Tab') dropdown.setOpen(false);
      }}
      className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" />
    {dropdown.open && <ul id={`${id}-options`} role="listbox" aria-label={label} className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl">
      {filtered.map((option, index) => <li key={option.id} id={`${id}-${option.id}`} role="option" aria-selected={option.id === value} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option.id)} onMouseEnter={() => setActive(index)} className={`cursor-pointer px-3 py-2 text-body-md ${active === index ? 'bg-amud-primary/10 text-amud-primary' : ''}`}>{option.name}</li>)}
      {!filtered.length && <li className="p-3 text-body-md text-amud-on-surface-variant">Aucun résultat.</li>}
    </ul>}
  </div>;
}
