'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CommercialProfileSettings } from '@/data/amud/commercialProfileSettings';

const collection = createCollection<CommercialProfileSettings>(AMUD_KEYS.commercialProfileSettings);

export function saveCommercialProfileSettings(id: string, patch: Partial<CommercialProfileSettings>) {
  const current = collection.getById(id);
  if (current) collection.update(id, patch);
  else collection.add({ ...patch, id } as CommercialProfileSettings);
}

export { collection as commercialProfileSettingsCollection };
