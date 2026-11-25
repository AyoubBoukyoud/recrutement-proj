import { AMUD_KEYS } from './storage/keys';
import { emitAmudChange } from './storage/events';
import { hasPresentationAccess, PRESENTATION_EVENT } from './presentationAccess';

export const TRAINING_DEMO_KEY = 'amud_training_demo_enabled';
export const TRAINING_DEMO_EVENT = 'amud:training-demo-change';
export const TRAINING_DEMO_PREFIX = 'amud_training_demo:';

// Only training data changes namespace. Authentication and other CRM data retain
// their original storage, including while editing a demonstration.
const trainingKeys = new Set<string>([
  AMUD_KEYS.centres, ...Object.entries(AMUD_KEYS)
    .filter(([name]) => name.startsWith('center') || name.startsWith('quiz') || ['studentResults', 'teacherResources'].includes(name))
    .map(([, key]) => key),
  'amud_current_center_id', 'amud_current_center_role', 'amud_current_teacher_id',
]);

export function isTrainingDemo(): boolean {
  if (typeof window === 'undefined') return false;
  // The local switch only counts with a server-verified presentation grant.
  if (!hasPresentationAccess()) return false;
  try { return window.localStorage.getItem(TRAINING_DEMO_KEY) === '1'; }
  catch { return false; }
}

export function trainingStorageKey(key: string): string {
  return trainingKeys.has(key) && isTrainingDemo() ? TRAINING_DEMO_PREFIX + key : key;
}

function broadcastTrainingMode() {
  for (const key of trainingKeys) emitAmudChange(key);
  window.dispatchEvent(new Event(TRAINING_DEMO_EVENT));
  window.dispatchEvent(new Event('amud:current-center-change'));
  window.dispatchEvent(new Event('amud:current-teacher-change'));
}

export function setTrainingDemo(enabled: boolean) {
  window.localStorage.setItem(TRAINING_DEMO_KEY, enabled ? '1' : '0');
  broadcastTrainingMode();
}

// Gaining or losing the grant switches every training store at once.
if (typeof window !== 'undefined') window.addEventListener(PRESENTATION_EVENT, broadcastTrainingMode);
