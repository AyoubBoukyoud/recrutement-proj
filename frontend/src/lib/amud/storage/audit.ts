'use client';

import { createCollection } from './collection';
import { AMUD_KEYS } from './keys';
import { generateId } from './ids';
import type { AuditLog } from '@/data/amud/auditLog';

const auditLogs = createCollection<AuditLog>(AMUD_KEYS.auditLogs);

/**
 * Écrit une entrée d'audit réelle (cahier des charges §28). Même forme que
 * le `LogEntry` déjà affiché par `admin/journal-activite/page.tsx`, pour que
 * cette page puisse lire directement cette collection au lieu de son SEED
 * inline. `ip`/`localisation` restent des valeurs de convenance (aucune
 * détection réseau/géoloc n'est faite côté client dans ce prototype).
 */
export function logAudit(input: {
  utilisateur: string;
  role: AuditLog['role'];
  action: string;
  actionType: AuditLog['actionType'];
  module: string;
  reference: string;
  diff?: { before: string; after: string };
  resultat?: AuditLog['resultat'];
}): AuditLog {
  const now = new Date();
  const entry: AuditLog = {
    id: generateId('log'),
    date: now.toLocaleDateString('fr-FR'),
    heure: now.toLocaleTimeString('fr-FR'),
    utilisateur: input.utilisateur,
    role: input.role,
    action: input.action,
    actionType: input.actionType,
    module: input.module,
    reference: input.reference,
    ip: 'Session locale',
    localisation: 'Session locale',
    resultat: input.resultat ?? 'Succès',
    diff: input.diff,
  };
  auditLogs.add(entry);
  return entry;
}

export { auditLogs };
