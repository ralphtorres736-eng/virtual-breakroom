/**
 * Calculates the 4th Thursday of a given month and year.
 * @param year - Calendar year (e.g. 2026)
 * @param month - 0-indexed month (0 = January, 11 = December)
 * @returns Date object representing the 4th Thursday at 12:00 PM (Lunch time)
 */
export function getFourthThursday(year: number, month: number): Date {
  const firstDay = new Date(year, month, 1);
  const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, ..., 4 = Thursday

  let firstThursdayDay = 1;
  if (dayOfWeek <= 4) {
    firstThursdayDay = 1 + (4 - dayOfWeek);
  } else {
    firstThursdayDay = 1 + (11 - dayOfWeek);
  }

  const fourthThursdayDay = firstThursdayDay + 21;
  return new Date(year, month, fourthThursdayDay, 12, 0, 0, 0);
}

/**
 * Calculates the next Monthly Lunch Thursday relative to the current time.
 * If the current time has passed the current month's 4th Thursday lunch hour,
 * it returns the 4th Thursday of the next month.
 */
export function getNextMonthlyLunchThursday(now: Date): Date {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthLunch = getFourthThursday(currentYear, currentMonth);

  if (now.getTime() < currentMonthLunch.getTime()) {
    return currentMonthLunch;
  } else {
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    return getFourthThursday(nextYear, nextMonth);
  }
}

/**
 * Formats a duration in milliseconds into days, hours, minutes, and seconds.
 */
export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isCompleted: boolean;
}

export function calculateCountdown(target: Date, now: Date): CountdownTime {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isCompleted: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isCompleted: false };
}

/**
 * Returns a formatted "Month Year" string for a given date string or Date object.
 */
export function getMonthYearTag(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Returns the current month and year string (e.g. "July 2026").
 */
export function getCurrentMonthYear(): string {
  return getMonthYearTag(new Date());
}

