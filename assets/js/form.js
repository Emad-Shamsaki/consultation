export function createConsultationFormController({
  form,
  successBox,
  projectCoreInput,
  appointmentDateInput,
  appointmentTimeInput,
  appointmentStartsAtInput,
  clientTimezoneInput,
  projectTypeInput,
  fullNameInput,
  summaryFields,
  resetHandlers,
  statusElement,
  submitAppointment
}) {
  function setStatus(message, type = "info") {
    statusElement.textContent = message;
    statusElement.className = `form-status form-status-${type}`;
  }

  function clearStatus() {
    statusElement.textContent = "";
    statusElement.className = "form-status hidden";
  }

  function validateForm() {
    if (!projectCoreInput.value) {
      setStatus("Please choose the project core.", "error");
      return false;
    }

    if (!clientTimezoneInput.value) {
      setStatus("Please choose the timezone for the appointment.", "error");
      return false;
    }

    if (!appointmentDateInput.value || !appointmentTimeInput.value || !appointmentStartsAtInput.value) {
      setStatus("Please choose appointment day and time.", "error");
      return false;
    }

    return true;
  }

  function fillSummary(result) {
    summaryFields.name.textContent = fullNameInput.value || "Not provided";
    summaryFields.core.textContent = projectCoreInput.value || "Not selected";
    summaryFields.type.textContent = projectTypeInput.value || "Not selected";
    summaryFields.appointment.textContent = result.appointment.clientDisplay;
    summaryFields.timezone.textContent = result.appointment.selectedTimezone || clientTimezoneInput.value;
  }

  function showSuccessState() {
    form.classList.add("hidden");
    successBox.classList.remove("hidden");
  }

  function showFormState() {
    form.classList.remove("hidden");
    successBox.classList.add("hidden");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearStatus();

    if (!validateForm()) {
      return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      setStatus("Sending your appointment request...", "info");
      const result = await submitAppointment(payload);
      fillSummary(result);
      clearStatus();
      showSuccessState();
    } catch (error) {
      setStatus(error.message || "Could not send the appointment request.", "error");
    }
  }

  function reset() {
    form.reset();
    clearStatus();
    showFormState();
    resetHandlers.forEach((handler) => handler());
  }

  function bind() {
    form.addEventListener("submit", handleSubmit);
  }

  return {
    bind,
    reset
  };
}
