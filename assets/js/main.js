import { createBookingController } from "./booking.js";
import { createSingleSelectChips, createMultiSelectChips } from "./chips.js";
import { createConsultationFormController } from "./form.js";

const AVAILABILITY_PATH = "./assets/data/availability.json";

async function loadAvailability() {
  const response = await fetch(AVAILABILITY_PATH);

  if (!response.ok) {
    throw new Error(`Failed to load availability data: ${response.status}`);
  }

  const data = await response.json();
  return data.availableDates ?? [];
}

async function initializeConsultationPage() {
  const elements = {
    form: document.getElementById("consultForm"),
    successBox: document.getElementById("successBox"),
    projectCoreInput: document.getElementById("projectCore"),
    communicationInput: document.getElementById("communication"),
    appointmentDateInput: document.getElementById("appointmentDate"),
    appointmentTimeInput: document.getElementById("appointmentTime"),
    projectTypeInput: document.getElementById("projectType"),
    fullNameInput: document.getElementById("fullName"),
    dateSlots: document.getElementById("dateSlots"),
    timeSlots: document.getElementById("timeSlots"),
    resetRequestButton: document.getElementById("resetRequestButton"),
    summaryFields: {
      name: document.getElementById("sumName"),
      core: document.getElementById("sumCore"),
      type: document.getElementById("sumType"),
      appointment: document.getElementById("sumAppointment")
    }
  };

  if (!elements.form) {
    throw new Error("Consultation form was not found on the page.");
  }

  const projectCoreChips = createSingleSelectChips({
    groupSelector: "#coreChips",
    hiddenInput: elements.projectCoreInput
  });

  const communicationChips = createMultiSelectChips({
    groupSelector: "#commChips",
    hiddenInput: elements.communicationInput
  });

  const booking = createBookingController({
    availableDates: [],
    dateSlots: elements.dateSlots,
    appointmentDateInput: elements.appointmentDateInput,
    appointmentTimeInput: elements.appointmentTimeInput,
    timeSlots: elements.timeSlots
  });

  try {
    const availableDates = await loadAvailability();
    const configuredBooking = createBookingController({
      availableDates,
      dateSlots: elements.dateSlots,
      appointmentDateInput: elements.appointmentDateInput,
      appointmentTimeInput: elements.appointmentTimeInput,
      timeSlots: elements.timeSlots
    });

    configuredBooking.init();

    const consultationForm = createConsultationFormController({
      form: elements.form,
      successBox: elements.successBox,
      projectCoreInput: elements.projectCoreInput,
      appointmentDateInput: elements.appointmentDateInput,
      appointmentTimeInput: elements.appointmentTimeInput,
      projectTypeInput: elements.projectTypeInput,
      fullNameInput: elements.fullNameInput,
      summaryFields: elements.summaryFields,
      resetHandlers: [
        () => projectCoreChips.reset(),
        () => communicationChips.reset(),
        () => configuredBooking.reset()
      ]
    });

    projectCoreChips.bind();
    communicationChips.bind();
    consultationForm.bind();
    elements.resetRequestButton.addEventListener("click", consultationForm.reset);
    return;
  } catch (error) {
    console.error(error);
    booking.showLoadError(
      "Could not load availability.json. If you opened this page directly from your computer, use a local web server."
    );
  }

  const consultationForm = createConsultationFormController({
    form: elements.form,
    successBox: elements.successBox,
    projectCoreInput: elements.projectCoreInput,
    appointmentDateInput: elements.appointmentDateInput,
    appointmentTimeInput: elements.appointmentTimeInput,
    projectTypeInput: elements.projectTypeInput,
    fullNameInput: elements.fullNameInput,
    summaryFields: elements.summaryFields,
    resetHandlers: [
      () => projectCoreChips.reset(),
      () => communicationChips.reset(),
      () => booking.reset()
    ]
  });

  projectCoreChips.bind();
  communicationChips.bind();
  consultationForm.bind();
  elements.resetRequestButton.addEventListener("click", consultationForm.reset);
}

initializeConsultationPage();
