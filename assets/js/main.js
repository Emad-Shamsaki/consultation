import { createBookingController } from "./booking.js";
import { createSingleSelectChips, createMultiSelectChips } from "./chips.js";
import { DATE_TIMES } from "./data.js";
import { createConsultationFormController } from "./form.js";
import { createPageNavigator } from "./navigation.js";

const navigator = createPageNavigator();

const elements = {
  form: document.getElementById("consultForm"),
  successBox: document.getElementById("successBox"),
  projectCoreInput: document.getElementById("projectCore"),
  communicationInput: document.getElementById("communication"),
  appointmentDateInput: document.getElementById("appointmentDate"),
  appointmentTimeInput: document.getElementById("appointmentTime"),
  projectTypeInput: document.getElementById("projectType"),
  fullNameInput: document.getElementById("fullName"),
  timeSlots: document.getElementById("timeSlots"),
  resetRequestButton: document.getElementById("resetRequestButton"),
  summaryFields: {
    name: document.getElementById("sumName"),
    core: document.getElementById("sumCore"),
    type: document.getElementById("sumType"),
    appointment: document.getElementById("sumAppointment")
  }
};

const projectCoreChips = createSingleSelectChips({
  groupSelector: "#coreChips",
  hiddenInput: elements.projectCoreInput
});

const communicationChips = createMultiSelectChips({
  groupSelector: "#commChips",
  hiddenInput: elements.communicationInput
});

const booking = createBookingController({
  dateTimes: DATE_TIMES,
  appointmentDateInput: elements.appointmentDateInput,
  appointmentTimeInput: elements.appointmentTimeInput,
  timeSlots: elements.timeSlots
});

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
  ],
  navigateTo: navigator.showPage
});

navigator.bindPageButtons();
projectCoreChips.bind();
communicationChips.bind();
booking.bindDateSlots();
consultationForm.bind();

elements.resetRequestButton.addEventListener("click", consultationForm.reset);
