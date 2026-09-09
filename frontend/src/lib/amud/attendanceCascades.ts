'use client';

import { generateId } from './storage/ids';
import { logAudit } from './storage/audit';
import { pushNotification } from './storage/notify';
import { logCenterActivity } from './localCenterActivities';
import { centerSessionStatesCollection, getSessionStateBySchedule } from './localCenterSessionStates';
import { centerAttendanceCollection } from './localCenterAttendance';
import type { CenterSessionState, CenterAttendanceRecord, QrPayload } from '@/data/amud/centerTypes';
import type { CenterSchedule } from '@/data/amud/centerSchedules';

/**
 * Écritures cascade pour le Smart Attendance QR (cahier des charges §11-17) —
 * même gabarit que `offerCascades.ts` : une fonction par action métier,
 * `logAudit` systématique, `logCenterActivity`/`pushNotification` quand
 * pertinent. `checkInStudent`/`checkOutStudent` renvoient un résultat typé
 * plutôt que de lever une exception, pour que l'écran de scan puisse afficher
 * un toast précis ("déjà pointé", "mauvais groupe"…) sans try/catch.
 */

type Actor = { utilisateur: string; role: string };

export type AttendanceActionError = {
  code: 'INVALID_PAYLOAD' | 'SESSION_NOT_OPEN' | 'WRONG_GROUP' | 'ALREADY_CHECKED_IN' | 'ALREADY_CHECKED_OUT' | 'NOT_CHECKED_IN';
  message: string;
};
export type AttendanceActionResult = { ok: true; record: CenterAttendanceRecord } | { ok: false; error: AttendanceActionError };

function newToken(): string {
  return generateId('tok');
}

/** "Commencer la séance" côté enseignant — (ré)ouvre le QR d'entrée pour un créneau. */
export function startSession(schedule: CenterSchedule, teacherId: string, actor: Actor): CenterSessionState {
  const existing = getSessionStateBySchedule(schedule.id);
  const token = newToken();
  const startedAt = new Date().toISOString();
  let state: CenterSessionState;
  if (existing) {
    state = { ...existing, status: 'CHECKIN_OPEN', checkInToken: token, startedAt, startedBy: teacherId };
    centerSessionStatesCollection.update(existing.id, state);
  } else {
    state = { id: generateId('sess'), centerId: schedule.centerId, scheduleId: schedule.id, status: 'CHECKIN_OPEN', checkInToken: token, startedAt, startedBy: teacherId };
    centerSessionStatesCollection.add(state);
  }
  logCenterActivity({ centerId: schedule.centerId, type: 'SESSION_STARTED', message: `Séance démarrée (créneau du ${schedule.date}).`, utilisateur: actor.utilisateur, role: actor.role });
  logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: 'Démarrage de séance (QR)', actionType: 'update', module: 'Centres de formation — Présences QR', reference: `Créneau ${schedule.date} · #${schedule.id}`, centerId: schedule.centerId });
  return state;
}

/** "Afficher QR Sortie" côté enseignant — ouvre le QR de sortie pour le même créneau. */
export function openCheckOut(sessionState: CenterSessionState, actor: Actor): CenterSessionState {
  const token = newToken();
  const checkOutOpenedAt = new Date().toISOString();
  centerSessionStatesCollection.update(sessionState.id, { status: 'CHECKOUT_OPEN', checkOutToken: token, checkOutOpenedAt });
  logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: 'Ouverture du QR de sortie', actionType: 'update', module: 'Centres de formation — Présences QR', reference: `Créneau #${sessionState.scheduleId}`, centerId: sessionState.centerId });
  return { ...sessionState, status: 'CHECKOUT_OPEN', checkOutToken: token, checkOutOpenedAt };
}

/** Scan côté étudiant d'un QR_CHECK_IN. */
export function checkInStudent(payload: QrPayload, studentId: string, groupStudentIds: string[], actor: Actor): AttendanceActionResult {
  if (payload.type !== 'CHECK_IN') return { ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Ce QR ne correspond pas à une entrée de cours.' } };
  const state = centerSessionStatesCollection.getById(payload.sessionStateId);
  if (!state || state.status !== 'CHECKIN_OPEN' || state.checkInToken !== payload.token) {
    return { ok: false, error: { code: 'SESSION_NOT_OPEN', message: 'Ce QR d’entrée n’est plus valide — demandez à votre enseignant de le réafficher.' } };
  }
  if (!groupStudentIds.includes(studentId)) {
    return { ok: false, error: { code: 'WRONG_GROUP', message: 'Vous n’êtes pas inscrit(e) dans ce groupe.' } };
  }
  const existing = centerAttendanceCollection.getAll().find((a) => a.scheduleId === state.scheduleId && a.studentId === studentId);
  if (existing?.checkInTime) {
    return { ok: false, error: { code: 'ALREADY_CHECKED_IN', message: 'Vous êtes déjà pointé(e) pour ce cours.' } };
  }
  const now = new Date().toISOString();
  const patch: Pick<CenterAttendanceRecord, 'statut' | 'source' | 'checkInTime'> = { statut: 'PRESENT', source: 'QR', checkInTime: now };
  let record: CenterAttendanceRecord;
  if (existing) {
    centerAttendanceCollection.update(existing.id, patch);
    record = { ...existing, ...patch };
  } else {
    record = { id: generateId('att'), centerId: payload.centerId, scheduleId: state.scheduleId, groupId: payload.groupId, studentId, date: now.slice(0, 10), ...patch };
    centerAttendanceCollection.add(record);
  }
  logCenterActivity({ centerId: payload.centerId, type: 'CHECK_IN', message: `Check-in QR enregistré pour le créneau #${state.scheduleId}.`, utilisateur: actor.utilisateur, role: actor.role });
  logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: 'Check-in QR', actionType: 'update', module: 'Centres de formation — Présences QR', reference: `Créneau #${state.scheduleId}`, centerId: payload.centerId });
  pushNotification({ scope: 'teacher', targetId: payload.teacherId, title: 'Un(e) étudiant(e) vient de pointer son entrée.', category: 'Présence', href: '/amud/teacher/attendance' });
  return { ok: true, record };
}

/** Scan côté étudiant d'un QR_CHECK_OUT. */
export function checkOutStudent(payload: QrPayload, studentId: string, groupStudentIds: string[], actor: Actor): AttendanceActionResult {
  if (payload.type !== 'CHECK_OUT') return { ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Ce QR ne correspond pas à une sortie de cours.' } };
  const state = centerSessionStatesCollection.getById(payload.sessionStateId);
  if (!state || state.status !== 'CHECKOUT_OPEN' || state.checkOutToken !== payload.token) {
    return { ok: false, error: { code: 'SESSION_NOT_OPEN', message: 'Ce QR de sortie n’est plus valide — demandez à votre enseignant de le réafficher.' } };
  }
  if (!groupStudentIds.includes(studentId)) {
    return { ok: false, error: { code: 'WRONG_GROUP', message: 'Vous n’êtes pas inscrit(e) dans ce groupe.' } };
  }
  const existing = centerAttendanceCollection.getAll().find((a) => a.scheduleId === state.scheduleId && a.studentId === studentId);
  if (!existing?.checkInTime) {
    return { ok: false, error: { code: 'NOT_CHECKED_IN', message: 'Vous devez d’abord pointer votre entrée.' } };
  }
  if (existing.checkOutTime) {
    return { ok: false, error: { code: 'ALREADY_CHECKED_OUT', message: 'Votre sortie est déjà enregistrée.' } };
  }
  const now = new Date();
  const durationMinutes = Math.max(0, Math.round((now.getTime() - new Date(existing.checkInTime).getTime()) / 60000));
  const patch = { checkOutTime: now.toISOString(), durationMinutes };
  centerAttendanceCollection.update(existing.id, patch);
  logCenterActivity({ centerId: payload.centerId, type: 'CHECK_OUT', message: `Check-out QR enregistré pour le créneau #${state.scheduleId}.`, utilisateur: actor.utilisateur, role: actor.role });
  logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: 'Check-out QR', actionType: 'update', module: 'Centres de formation — Présences QR', reference: `Créneau #${state.scheduleId}`, centerId: payload.centerId });
  return { ok: true, record: { ...existing, ...patch } };
}

/**
 * "Clôturer la séance" côté enseignant — crée une ligne ABSENT pour tout
 * étudiant inscrit sans aucun pointage ; laisse les entrées sans sortie
 * telles quelles (l'UI dérive "sortie non enregistrée" de `checkInTime &&
 * !checkOutTime`, pas une deuxième source de vérité).
 */
export function endSession(sessionState: CenterSessionState, groupId: string, enrolledStudentIds: string[], actor: Actor): CenterSessionState {
  const attendance = centerAttendanceCollection.getAll().filter((a) => a.scheduleId === sessionState.scheduleId);
  const pointedIds = new Set(attendance.map((a) => a.studentId));
  const today = new Date().toISOString().slice(0, 10);
  enrolledStudentIds.forEach((studentId) => {
    if (pointedIds.has(studentId)) return;
    centerAttendanceCollection.add({ id: generateId('att'), centerId: sessionState.centerId, scheduleId: sessionState.scheduleId, groupId, studentId, date: today, statut: 'ABSENT', source: 'QR' });
  });
  const endedAt = new Date().toISOString();
  centerSessionStatesCollection.update(sessionState.id, { status: 'ENDED', endedAt });
  logCenterActivity({ centerId: sessionState.centerId, type: 'SESSION_COMPLETED', message: `Séance clôturée (créneau #${sessionState.scheduleId}).`, utilisateur: actor.utilisateur, role: actor.role });
  logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: 'Clôture de séance (QR)', actionType: 'update', module: 'Centres de formation — Présences QR', reference: `Créneau #${sessionState.scheduleId}`, centerId: sessionState.centerId });
  pushNotification({ scope: 'centre', title: 'Une séance vient d’être clôturée.', category: 'Présence', href: '/amud/centre/presences' });
  return { ...sessionState, status: 'ENDED', endedAt };
}

/** Correction manuelle d'une présence (sortie manquante, erreur de statut…), réservée à `record-attendance`. */
export function correctAttendance(record: CenterAttendanceRecord, patch: Partial<Pick<CenterAttendanceRecord, 'statut' | 'checkOutTime' | 'durationMinutes'>>, actor: Actor): CenterAttendanceRecord {
  const correctedAt = new Date().toISOString();
  const full = { ...patch, correctedBy: actor.utilisateur, correctedAt };
  centerAttendanceCollection.update(record.id, full);
  logAudit({
    utilisateur: actor.utilisateur,
    role: 'Centre',
    action: 'Correction manuelle de présence',
    actionType: 'update',
    module: 'Centres de formation — Présences QR',
    reference: `Présence #${record.id}`,
    centerId: record.centerId,
    diff: { before: JSON.stringify({ statut: record.statut, checkOutTime: record.checkOutTime ?? null }), after: JSON.stringify(patch) },
  });
  return { ...record, ...full };
}
