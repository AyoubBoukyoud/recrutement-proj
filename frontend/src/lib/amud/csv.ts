'use client';

/**
 * Export CSV côté client pour les boutons "Exporter" du module `/amud`
 * (aucun backend derrière ces pages — cf. mémoire du projet). Génère un
 * blob téléchargé directement par le navigateur.
 */
export function exportCsv(filename: string, rows: Record<string, string | number>[]) {
  if (typeof window === 'undefined' || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(','), ...rows.map((r) => headers.map((h) => escape(r[h] ?? '')).join(','))];
  const blob = new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
