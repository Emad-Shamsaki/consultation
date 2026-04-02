import { createBookingController } from "./booking.js";
import { createSingleSelectChips, createMultiSelectChips } from "./chips.js";
import { createConsultationFormController } from "./form.js";
import {
  convertAvailabilityToTimezone,
  formatAppointmentDisplay,
  getBrowserTimezone,
  getTimezoneOptions
} from "./timezone.js";

const availabilityUrl = new URL("../data/availability.json", import.meta.url);
const siteConfigUrl = new URL("../data/site-config.json", import.meta.url);

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

  return browserTimezone;
}

async function requestJson(url) {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || `Request failed with status ${response.status}.`);
  }

  return payload;
}

async function loadAvailabilityConfig() {
  return requestJson(availabilityUrl);
}

async function loadSiteConfig() {
  return requestJson(siteConfigUrl);
}

function isPlaceholderEndpoint(endpoint) {
  return !endpoint || endpoint.includes("your-form-id");
}

async function sendAppointment(payload, siteConfig, availabilityConfig) {
  if (isPlaceholderEndpoint(siteConfig.formEndpoint)) {
    throw new Error(
      "Set your Formspree endpoint in assets/data/site-config.json before publishing the form."
    );
  }

  const formData = new FormData();
  formData.append("name", payload.fullName);
  formData.append("email", payload.email);
  formData.append("_replyto", payload.email);
  formData.append("_subject", `New consultation request from ${payload.fullName}`);
  formData.append("company", payload.company || "Not provided");
  formData.append("projectCore", payload.projectCore);
  formData.append("projectType", payload.projectType);
  formData.append("communication", payload.communication || "Not provided");
  formData.append("explanation", payload.explanation);
  formData.append("clientTimezone", payload.clientTimezone);
  formData.append(
    "clientAppointment",
    `${payload.appointmentDate} at ${payload.appointmentTime} (${payload.clientTimezone})`
  );
  formData.append("appointmentUtc", payload.appointmentStartsAt);
  formData.append("consultantTimezone", availabilityConfig.sourceTimezone || "UTC");

  const response = await fetch(siteConfig.formEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json"
    },
    body: formData
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = result.errors?.[0]?.message || result.error || `Request failed with status ${response.status}.`;
    throw new Error(errorMessage);
  }

  return {
    appointment: {
      clientDisplay: formatAppointmentDisplay(payload.appointmentStartsAt, payload.clientTimezone),
      selectedTimezone: payload.clientTimezone
    }
  };
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

  const defaultTimezone = populateTimezoneSelect(elements.clientTimezoneInput);
  const [availabilityConfig, siteConfig] = await Promise.all([
    loadAvailabilityConfig(),
    loadSiteConfig()
  ]);

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
    try {
      const convertedAvailability = convertAvailabilityToTimezone(
        availabilityConfig,
        elements.clientTimezoneInput.value
      );
      booking.updateAvailability(convertedAvailability);
    } catch (error) {
      console.error(error);
      booking.showLoadError(
        "Could not load appointment slots. Open the site through GitHub Pages or a static host instead of double-clicking the file."
      );
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
      () => {
        elements.clientTimezoneInput.value = defaultTimezone;
        booking.reset();
        return refreshAvailability();
      }
    ],
    statusElement: elements.formStatus,
    submitAppointment: (payload) => sendAppointment(payload, siteConfig, availabilityConfig)
  });

  projectCoreChips.bind();
  communicationChips.bind();
  consultationForm.bind();
  elements.resetRequestButton.addEventListener("click", consultationForm.reset);

  await refreshAvailability();
}

initializeConsultationPage().catch((error) => {
  console.error(error);

  const scheduleInfo = document.getElementById("scheduleInfo");
  if (scheduleInfo) {
    scheduleInfo.textContent =
      "Could not load the booking settings. Check assets/data/site-config.json and host the site on GitHub Pages or another static host.";
  }
});
