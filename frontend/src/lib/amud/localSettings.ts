'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CompanySettings } from '@/data/amud/settings';

const collection = createCollection<CompanySettings>(AMUD_KEYS.settings);

export function saveCompanySettings(id: string, patch: Partial<CompanySettings>) {
  const current = collection.getById(id);
  if (current) collection.update(id, patch);
  else collection.add({ ...patch, id } as CompanySettings);
}

export { collection as settingsCollection };
