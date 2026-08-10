// Génération du planning des matchs sur un créneau fixe (un seul terrain, matchs séquentiels).

export interface ScheduleParams {
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  matchDurationMinutes: number;
  transitionMinutes: number;
  matchCount: number;
}

export interface ScheduleSlot {
  start: string; // 'HH:mm'
  end: string; // 'HH:mm'
}

export interface ScheduleResult {
  slots: ScheduleSlot[];
  overflow: boolean; // true si le dernier match dépasse endTime
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function toTimeStr(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generateSchedule(params: ScheduleParams): ScheduleResult {
  const { startTime, endTime, matchDurationMinutes, transitionMinutes, matchCount } = params;
  const startMin = toMinutes(startTime);
  const endMin = toMinutes(endTime);

  const slots: ScheduleSlot[] = [];
  let cursor = startMin;
  for (let i = 0; i < matchCount; i++) {
    const slotStart = cursor;
    const slotEnd = slotStart + matchDurationMinutes;
    slots.push({ start: toTimeStr(slotStart), end: toTimeStr(slotEnd) });
    cursor = slotEnd + transitionMinutes;
  }

  const lastEnd = slots.length > 0 ? toMinutes(slots[slots.length - 1].end) : startMin;
  return { slots, overflow: lastEnd > endMin };
}
