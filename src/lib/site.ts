/**
 * Site timezone: GMT+10. All "day" boundaries and date/time display use this.
 */
export const SITE_TIMEZONE = "Etc/GMT-10";

/** Format options for date-only (YYYY-MM-DD) display in site timezone. */
const dateOnlyOpts: Intl.DateTimeFormatOptions = {
  timeZone: SITE_TIMEZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
};

/** Format options for short date in site timezone. */
const shortDateOpts: Intl.DateTimeFormatOptions = {
  timeZone: SITE_TIMEZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
};

/** Format options for long weekday in site timezone. */
const longWeekdayOpts: Intl.DateTimeFormatOptions = {
  timeZone: SITE_TIMEZONE,
  weekday: "long",
  month: "short",
  day: "numeric",
};

/** Format options for long date (e.g. "March 28, 2025") in site timezone. */
const longDateOpts: Intl.DateTimeFormatOptions = {
  timeZone: SITE_TIMEZONE,
  dateStyle: "long",
};

/**
 * Format a date string (YYYY-MM-DD) for display in site timezone (GMT+10).
 */
export function formatDateInSiteTz(
  dateStr: string,
  options: "full" | "short" | "longWeekday" | "long" = "full"
): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const opts =
    options === "short"
      ? shortDateOpts
      : options === "longWeekday"
        ? longWeekdayOpts
        : options === "long"
          ? longDateOpts
          : dateOnlyOpts;
  return d.toLocaleDateString("en-US", opts);
}

/**
 * Format an ISO timestamp for display in site timezone (GMT+10).
 */
export function formatDateTimeInSiteTz(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: SITE_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Return current date as YYYY-MM-DD in site timezone (GMT+10).
 */
export function todayInSiteTz(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: SITE_TIMEZONE });
}
