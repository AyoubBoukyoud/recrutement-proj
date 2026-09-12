'use client';

import { useEffect, useState } from 'react';
import { Modal, ModalActions } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { ATTENDANCE_LABELS, type AttendanceStatus, type CenterAttendanceRecord } from '@/data/amud/centerTypes';
import { correctAttendance } from '@/lib/amud/attendanceCascades';

const STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'RETARD', 'EXCUSE'];

/** Corrige une ligne de présence QR (statut, ou une sortie non scannée) — réservé à `record-attendance`. */
export function AttendanceCorrectionModal({
  open,
  onClose,
  record,
  actor,
}: {
  open: boolean;
  onClose: () => void;
  record?: CenterAttendanceRecord;
  actor: { utilisateur: string; role: string };
}) {
  const notify = useToast();
  const [statut, setStatut] = useState<AttendanceStatus>('PRESENT');
  const [checkOutTime, setCheckOutTime] = useState('');

  useEffect(() => {
    if (!open || !record) return;
    setStatut(record.statut);
    setCheckOutTime(record.checkOutTime ? record.checkOutTime.slice(11, 16) : '');
  }, [open, record]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!record) return;
    const patch: Parameters<typeof correctAttendance>[1] = { statut };
    if (checkOutTime) {
      const base = record.checkInTime ? record.checkInTime.slice(0, 10) : record.date;
      const iso = new Date(`${base}T${checkOutTime}:00`).toISOString();
      patch.checkOutTime = iso;
      if (record.checkInTime) {
        patch.durationMinutes = Math.max(0, Math.round((new Date(iso).getTime() - new Date(record.checkInTime).getTime()) / 60000));
      }
    }
    correctAttendance(record, patch, actor);
    notify('Présence corrigée.');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Corriger la présence" footer={<ModalActions onCancel={onClose} form="attendance-correction-form" submitLabel="Enregistrer" />}>
      <form id="attendance-correction-form" onSubmit={handleSubmit} className="flex flex-col gap-md">
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut</label>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value as AttendanceStatus)}
            className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {ATTENDANCE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">
            Heure de sortie {record && record.checkInTime && !record.checkOutTime ? '(non enregistrée)' : ''}
          </label>
          <input
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
            type="time"
            className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
          />
        </div>
      </form>
    </Modal>
  );
}
