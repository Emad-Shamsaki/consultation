const TIMEZONE_FALLBACKS = [
  "UTC",
  "Europe/Rome",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney"
];

function getFormatter(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

function getParts(date, timeZone) {
  return Object.fromEntries(
    getFormatter(timeZone)
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
}

function getTimeZoneOffsetMs(date, timeZone) {
  const parts = getParts(date, timeZone);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(dateText, timeText, timeZone) {
  const [year, month, day] = dateText.split("-").map(Number);
  const [hour, minute] = timeText.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);

  let result = utcGuess - getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  const refined = utcGuess - getTimeZoneOffsetMs(new Date(result), timeZone);

  if (refined !== result) {
    result = refined;
  }

  return new Date(result);
}

function formatDateLabel(date, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatDateKey(date, timeZone) {
  const parts = getParts(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatTime(date, timeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

export function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function getTimezoneOptions() {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }

  return TIMEZONE_FALLBACKS;
}

export function convertAvailabilityToTimezone({ sourceTimezone, availableDates }, selectedTimezone) {
  const groupedDates = new Map();

  availableDates.forEach((entry) => {
    const timeSlots = Array.isArray(entry.timeSlots) ? entry.timeSlots : [];

    timeSlots.forEach((timeText) => {
      const appointmentUtc = zonedDateTimeToUtc(entry.date, timeText, sourceTimezone);
      const dateKey = formatDateKey(appointmentUtc, selectedTimezone);

      if (!groupedDates.has(dateKey)) {
        groupedDates.set(dateKey, {
          dateKey,
          label: formatDateLabel(appointmentUtc, selectedTimezone),
          timeSlots: []
        });
      }

      groupedDates.get(dateKey).timeSlots.push({
        startsAt: appointmentUtc.toISOString(),
        displayTime: formatTime(appointmentUtc, selectedTimezone)
      });
    });
  });

  return {
    sourceTimezone,
    selectedTimezone,
    availableDates: Array.from(groupedDates.values())
      .sort((left, right) => left.dateKey.localeCompare(right.dateKey))
      .map((group) => ({
        ...group,
        timeSlots: group.timeSlots.sort((left, right) => left.startsAt.localeCompare(right.startsAt))
      }))
  };
}

export function formatAppointmentDisplay(appointmentIso, timeZone) {
  const appointmentDate = new Date(appointmentIso);
  const dayPart = formatDateLabel(appointmentDate, timeZone);
  const timePart = formatTime(appointmentDate, timeZone);
  return `${dayPart} at ${timePart} (${timeZone})`;
}
