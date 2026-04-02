import { createBookingController } from "./booking.js";
import { createSingleSelectChips, createMultiSelectChips } from "./chips.js";
import { createConsultationFormController } from "./form.js";

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

function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function getTimezoneOptions() {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }

  return TIMEZONE_FALLBACKS;
}

function populateTimezoneSelect(selectElement) {
  const browserTimezone = getBrowserTimezone();
  const timezones = Array.from(new Set([browserTimezone, ...getTimezoneOptions()])).sort();

  selectElement.innerHTML = "";

  timezones.forEach((timezone) => {
    const option = document.createElement("option");
    option.value = timezone;
    option.textContent = timezone;
    option.selected = timezone === browserTimezone;
    selectElement.appendChild(option);
  });
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || `Request failed with status ${response.status}.`);
  }

  return payload;
}

async function loadAvailability(timezone) {
  return requestJson(`/api/availability?timezone=${encodeURIComponent(timezone)}`);
}

async function sendAppointment(payload) {
  return requestJson("/api/appointments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

async function initializeConsultationPage() {
  const elements = {
    form: document.getElementById("consultForm"),
    successBox: document.getElementById("successBox"),
    projectCoreInput: document.getElementById("projectCore"),
    communicationInput: document.getElementById("communication"),
    appointmentDateInput: document.getElementById("appointmentDate"),
    appointmentTimeInput: document.getElementById("appointmentTime"),
    appointmentStartsAtInput: document.getElementById("appointmentStartsAt"),
    projectTypeInput: document.getElementById("projectType"),
    fullNameInput: document.getElementById("fullName"),
    clientTimezoneInput: document.getElementById("clientTimezone"),
    dateSlots: document.getElementById("dateSlots"),
    timeSlots: document.getElementById("timeSlots"),
    scheduleInfo: document.getElementById("scheduleInfo"),
    formStatus: document.getElementById("formStatus"),
    resetRequestButton: document.getElementById("resetRequestButton"),
    summaryFields: {
      name: document.getElementById("sumName"),
      core: document.getElementById("sumCore"),
      type: document.getElementById("sumType"),
      appointment: document.getElementById("sumAppointment"),
      timezone: document.getElementById("sumTimezone")
    }
  };

  if (!elements.form) {
    throw new Error("Consultation form was not found on the page.");
  }

  populateTimezoneSelect(elements.clientTimezoneInput);

  const projectCoreChips = createSingleSelectChips({
    groupSelector: "#coreChips",
    hiddenInput: elements.projectCoreInput
  });

  const communicationChips = createMultiSelectChips({
    groupSelector: "#commChips",
    hiddenInput: elements.communicationInput
  });

  const booking = createBookingController({
    dateSlots: elements.dateSlots,
    timeSlots: elements.timeSlots,
    scheduleInfo: elements.scheduleInfo,
    appointmentDateInput: elements.appointmentDateInput,
    appointmentTimeInput: elements.appointmentTimeInput,
    appointmentStartsAtInput: elements.appointmentStartsAtInput
  });

  async function refreshAvailability() {
    booking.showLoadError("Loading available appointment slots...");

    try {
      const availability = await loadAvailability(elements.clientTimezoneInput.value);
      booking.updateAvailability(availability);
    } catch (error) {
      console.error(error);
      booking.showLoadError(error.message || "Could not load appointment slots.");
    }
  }

  elements.clientTimezoneInput.addEventListener("change", refreshAvailability);

  const consultationForm = createConsultationFormController({
    form: elements.form,
    successBox: elements.successBox,
    projectCoreInput: elements.projectCoreInput,
    appointmentDateInput: elements.appointmentDateInput,
    appointmentTimeInput: elements.appointmentTimeInput,
    appointmentStartsAtInput: elements.appointmentStartsAtInput,
    clientTimezoneInput: elements.clientTimezoneInput,
    projectTypeInput: elements.projectTypeInput,
    fullNameInput: elements.fullNameInput,
    summaryFields: elements.summaryFields,
    resetHandlers: [
      () => projectCoreChips.reset(),
      () => communicationChips.reset(),
      () => booking.reset(),
      () => refreshAvailability()
    ],
    statusElement: elements.formStatus,
    submitAppointment: sendAppointment
  });

  projectCoreChips.bind();
  communicationChips.bind();
  consultationForm.bind();
  elements.resetRequestButton.addEventListener("click", consultationForm.reset);

  await refreshAvailability();
}

initializeConsultationPage();
