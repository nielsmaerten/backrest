import { DisplaySettings, DisplaySettings_DateTimeFormatMode } from "../../gen/ts/v1/config_pb";

const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
export const formatBytes = (bytes?: number | string) => {
  if (!bytes) {
    return "0B";
  }
  if (typeof bytes === "string") {
    bytes = parseInt(bytes);
  }

  let unit = 0;
  while (bytes > 1024) {
    bytes /= 1024;
    unit++;
  }
  return `${Math.round(bytes * 100) / 100} ${units[unit]}`;
};

// Date/time formatting settings - globally accessible
let dateTimeSettings: DisplaySettings | undefined = undefined;
let cachedFormatters: {
  fmtTime?: Intl.DateTimeFormat;
  fmtDate?: Intl.DateTimeFormat;
  fmtMonth?: Intl.DateTimeFormat;
  locale?: string | undefined;
  customFormat?: string;
} = {};

// Set the global date/time display settings
export const setDateTimeDisplaySettings = (settings: DisplaySettings | undefined) => {
  dateTimeSettings = settings;
  // Clear cached formatters when settings change
  cachedFormatters = {};
};

// Get the current date/time display settings
export const getDateTimeDisplaySettings = (): DisplaySettings | undefined => {
  return dateTimeSettings;
};

// Get the locale to use based on settings
const getLocale = (): string | undefined => {
  if (!dateTimeSettings) {
    return undefined; // Browser default
  }
  
  switch (dateTimeSettings.dateTimeFormatMode) {
    case DisplaySettings_DateTimeFormatMode.DATE_TIME_FORMAT_PREDEFINED:
      return dateTimeSettings.dateTimeFormatLocale || undefined;
    case DisplaySettings_DateTimeFormatMode.DATE_TIME_FORMAT_CUSTOM:
      // For custom format, we still use browser locale for Intl (fallback)
      // but we'll handle custom formatting separately
      return undefined;
    case DisplaySettings_DateTimeFormatMode.DATE_TIME_FORMAT_BROWSER:
    default:
      return undefined;
  }
};

// Check if custom format is being used
const isCustomFormat = (): boolean => {
  return dateTimeSettings?.dateTimeFormatMode === DisplaySettings_DateTimeFormatMode.DATE_TIME_FORMAT_CUSTOM;
};

// Custom format string parser
// Supports: YYYY, MM, DD, HH, mm, ss, hh (12-hour), A/a (AM/PM)
const formatWithCustomString = (date: Date, formatStr: string): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const ampm = hours24 >= 12 ? "PM" : "AM";
  
  return formatStr
    .replace(/YYYY/g, date.getFullYear().toString())
    .replace(/YY/g, date.getFullYear().toString().slice(-2))
    .replace(/MM/g, pad(date.getMonth() + 1))
    .replace(/M(?!O)/g, (date.getMonth() + 1).toString())
    .replace(/DD/g, pad(date.getDate()))
    .replace(/D(?!E)/g, date.getDate().toString())
    .replace(/HH/g, pad(hours24))
    .replace(/H(?!O)/g, hours24.toString())
    .replace(/hh/g, pad(hours12))
    .replace(/h(?!o)/g, hours12.toString())
    .replace(/mm/g, pad(date.getMinutes()))
    .replace(/m(?!i)/g, date.getMinutes().toString())
    .replace(/ss/g, pad(date.getSeconds()))
    .replace(/s(?!e)/g, date.getSeconds().toString())
    .replace(/A/g, ampm)
    .replace(/a/g, ampm.toLowerCase());
};

// Get or create cached time formatter
const getTimeFormatter = (): Intl.DateTimeFormat => {
  const locale = getLocale();
  if (cachedFormatters.fmtTime && cachedFormatters.locale === locale) {
    return cachedFormatters.fmtTime;
  }
  cachedFormatters.locale = locale;
  cachedFormatters.fmtTime = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return cachedFormatters.fmtTime;
};

// Get or create cached date formatter
const getDateFormatter = (): Intl.DateTimeFormat => {
  const locale = getLocale();
  if (cachedFormatters.fmtDate && cachedFormatters.locale === locale) {
    return cachedFormatters.fmtDate;
  }
  cachedFormatters.locale = locale;
  cachedFormatters.fmtDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return cachedFormatters.fmtDate;
};

// Get or create cached month formatter
const getMonthFormatter = (): Intl.DateTimeFormat => {
  const locale = getLocale();
  if (cachedFormatters.fmtMonth && cachedFormatters.locale === locale) {
    return cachedFormatters.fmtMonth;
  }
  cachedFormatters.locale = locale;
  cachedFormatters.fmtMonth = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
  });
  return cachedFormatters.fmtMonth;
};

const timezoneOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;

// formatTime formats a time with date and time components
export const formatTime = (time: number | string | Date) => {
  if (typeof time === "string") {
    time = parseInt(time);
  } else if (time instanceof Date) {
    time = time.getTime();
  }
  const d = new Date(time);
  
  if (isCustomFormat() && dateTimeSettings?.dateTimeFormatCustom) {
    return formatWithCustomString(d, dateTimeSettings.dateTimeFormatCustom);
  }
  
  return getTimeFormatter().format(d);
};

export const localISOTime = (time: number | string | Date) => {
  if (typeof time === "string") {
    time = parseInt(time);
  } else if (time instanceof Date) {
    time = time.getTime();
  }

  const d = new Date();
  d.setTime(time - timezoneOffsetMs);
  return d.toISOString();
};

export const formatDate = (time: number | string | Date) => {
  if (typeof time === "string") {
    time = parseInt(time);
  } else if (time instanceof Date) {
    time = time.getTime();
  }
  let d = new Date();
  d.setTime(time);
  
  if (isCustomFormat() && dateTimeSettings?.dateTimeFormatCustom) {
    // Use a simplified date-only version of the custom format
    // Or just use the date portion from the custom format
    const customFormat = dateTimeSettings.dateTimeFormatCustom;
    // Try to extract just the date part (before any time-related tokens)
    const dateOnlyFormat = customFormat.replace(/[\s,]*[Hh]+:?[m]*:?[s]*[\s,]*[AaPp]*[Mm]*/g, '').trim();
    return formatWithCustomString(d, dateOnlyFormat || "YYYY-MM-DD");
  }
  
  return getDateFormatter().format(d);
};

export const formatMonth = (time: number | string | Date) => {
  if (typeof time === "string") {
    time = parseInt(time);
  } else if (time instanceof Date) {
    time = time.getTime();
  }
  let d = new Date();
  d.setTime(time);
  return getMonthFormatter().format(d);
};

// Preview formatter for settings UI
export const formatTimePreview = (
  time: Date,
  mode: DisplaySettings_DateTimeFormatMode,
  locale?: string,
  customFormat?: string
): string => {
  switch (mode) {
    case DisplaySettings_DateTimeFormatMode.DATE_TIME_FORMAT_PREDEFINED:
      return new Intl.DateTimeFormat(locale || undefined, {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(time);
    case DisplaySettings_DateTimeFormatMode.DATE_TIME_FORMAT_CUSTOM:
      if (customFormat) {
        return formatWithCustomString(time, customFormat);
      }
      return formatWithCustomString(time, "YYYY-MM-DD HH:mm");
    case DisplaySettings_DateTimeFormatMode.DATE_TIME_FORMAT_BROWSER:
    default:
      return new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(time);
  }
};

const durationSteps = [1000, 60, 60, 24, Number.MAX_VALUE];
const durationFactors = [1, 1000, 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000];
const shortDurationUnits = ["ms", "s", "m", "h", "d"];
type DurationUnit = typeof shortDurationUnits[number];

export interface FormatDurationOptions {
  minUnit?: DurationUnit;
  maxUnit?: DurationUnit;
}

export const formatDuration = (ms: number, options?: FormatDurationOptions) => {
  if (!ms && ms !== 0) return "";

  if (!options && ms < 60 * 1000) {
    // If no options and less than a minute, show seconds
    // Performance optimization
    return `${Math.round(ms / 1000)}s`;
  }

  const minUnitIndex = options?.minUnit ? shortDurationUnits.indexOf(options.minUnit) : 1; // Don't show ms by default
  const maxUnitIndex = options?.maxUnit ? shortDurationUnits.indexOf(options.maxUnit) : shortDurationUnits.length - 1;

  const absMs = Math.abs(ms);
  let result = "";

  for (let i = maxUnitIndex; i >= minUnitIndex; i--) {
    const value = Math.floor(absMs / durationFactors[i]) % durationSteps[i];
    if (value > 0) {
      result += `${value}${shortDurationUnits[i]}`;
    }
  }

  if (!result) {
    result = `0${shortDurationUnits[minUnitIndex]}`;
  }

  return ms < 0 ? `-${result}` : result;
};

export const normalizeSnapshotId = (id: string) => {
  return id.substring(0, 8);
};
