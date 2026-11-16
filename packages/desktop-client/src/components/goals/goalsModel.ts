import * as monthUtils from '@actual-app/core/shared/months';

export type GoalPriority = 'high' | 'medium' | 'low';

export type SavingsGoal = {
  id: string;
  categoryId: string;
  name: string;
  target: number;
  deadline: string | null;
  priority?: GoalPriority;
  link?: string;
  notes?: string;
};

export function parseGoals(raw: string | undefined): SavingsGoal[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (entry): entry is SavingsGoal =>
      entry &&
      typeof entry.id === 'string' &&
      typeof entry.categoryId === 'string' &&
      typeof entry.name === 'string' &&
      typeof entry.target === 'number',
  );
}

export function serializeGoals(goals: SavingsGoal[]): string {
  return JSON.stringify(goals);
}

export function newGoalId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function goalProgress(balance: number, target: number) {
  const saved = Math.max(balance, 0);
  const percent = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  return {
    saved,
    percent,
    remaining: Math.max(target - saved, 0),
    reached: target > 0 && saved >= target,
  };
}

export function monthlyNeeded(
  remaining: number,
  deadline: string | null,
): { amount: number; months: number } | null {
  if (!deadline || remaining <= 0) return null;
  const months = monthUtils.differenceInCalendarMonths(
    deadline,
    monthUtils.currentMonth(),
  );
  if (months < 0) return null;
  const span = months + 1;
  return { amount: Math.ceil(remaining / span), months: span };
}

export function imagePrefKey(goalId: string) {
  return `savings-goal-image-${goalId}` as const;
}

export function readImageAsThumbnail(file: File, maxWidth = 640) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas
        .getContext('2d')
        ?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

export function parseChecklist(notes: string | undefined) {
  const matches = [...(notes ?? '').matchAll(/^\s*[-*+]\s+\[( |x|X)\]/gm)];
  return {
    total: matches.length,
    done: matches.filter(match => match[1] !== ' ').length,
  };
}

export function toggleChecklistItem(notes: string, index: number) {
  let seen = -1;
  return notes.replace(/^(\s*[-*+]\s+)\[( |x|X)\]/gm, (whole, lead, mark) => {
    seen += 1;
    if (seen !== index) return whole;
    return `${lead}[${mark === ' ' ? 'x' : ' '}]`;
  });
}

export const priorityOrder: Record<GoalPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};
