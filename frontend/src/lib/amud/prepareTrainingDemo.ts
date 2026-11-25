'use client';

import { CENTER_DEMO } from '@/data/amud/centerDemoFactory';
import { centerStudentResultsSeed } from '@/data/amud/centerStudentResults';
import { teacherResourcesSeed } from '@/data/amud/teacherResources';
import { AMUD_KEYS } from './storage/keys';
import { TRAINING_DEMO_PREFIX } from './trainingDemo';
import { seedDemoTimetable } from './timetable/demoService';

/** Prepare a separate workspace before enabling it; preserve existing demo edits. */
export function prepareTrainingDemo() {
  const rows: Record<string, unknown> = {
    [AMUD_KEYS.centres]: CENTER_DEMO.centres,
    [AMUD_KEYS.centerStudents]: CENTER_DEMO.students,
    [AMUD_KEYS.centerTeachers]: CENTER_DEMO.teachers,
    [AMUD_KEYS.centerFormations]: CENTER_DEMO.formations,
    [AMUD_KEYS.centerGroups]: CENTER_DEMO.groups,
    [AMUD_KEYS.centerEnrollments]: CENTER_DEMO.enrollments,
    [AMUD_KEYS.centerSchedules]: CENTER_DEMO.schedules,
    [AMUD_KEYS.centerAttendance]: CENTER_DEMO.attendance,
    [AMUD_KEYS.centerStudentPayments]: CENTER_DEMO.studentPayments,
    [AMUD_KEYS.centerTeacherPayments]: CENTER_DEMO.teacherPayments,
    [AMUD_KEYS.centerTeacherHours]: CENTER_DEMO.teacherHoursRecords,
    [AMUD_KEYS.centerTarifs]: CENTER_DEMO.tarifs,
    [AMUD_KEYS.centerLeads]: CENTER_DEMO.leads,
    [AMUD_KEYS.centerUsers]: CENTER_DEMO.users,
    [AMUD_KEYS.centerModificationRequests]: CENTER_DEMO.modificationRequests,
    [AMUD_KEYS.studentResults]: centerStudentResultsSeed,
    [AMUD_KEYS.teacherResources]: teacherResourcesSeed,
  };
  for (const [key, value] of Object.entries(rows)) {
    if (localStorage.getItem(TRAINING_DEMO_PREFIX + key) === null) {
      localStorage.setItem(TRAINING_DEMO_PREFIX + key, JSON.stringify(value));
    }
  }
  seedDemoTimetable(CENTER_DEMO);
}
