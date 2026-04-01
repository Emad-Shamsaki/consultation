export function createConsultationFormController({
  form,
  successBox,
  projectCoreInput,
  appointmentDateInput,
  appointmentTimeInput,
  projectTypeInput,
  fullNameInput,
  summaryFields,
  resetHandlers
}) {
  function validateForm() {
    if (!projectCoreInput.value) {
      alert("Please choose the project core.");
      return false;
    }

    if (!appointmentDateInput.value || !appointmentTimeInput.value) {
      alert("Please choose appointment day and time.");
      return false;
    }

    return true;
  }

  function fillSummary() {
    summaryFields.name.textContent = fullNameInput.value || "Not provided";
    summaryFields.core.textContent = projectCoreInput.value || "Not selected";
    summaryFields.type.textContent = projectTypeInput.value || "Not selected";
    summaryFields.appointment.textContent = `${appointmentDateInput.value} at ${appointmentTimeInput.value}`;
  }

  function showSuccessState() {
    form.classList.add("hidden");
    successBox.classList.remove("hidden");
  }

  function showFormState() {
    form.classList.remove("hidden");
    successBox.classList.add("hidden");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    fillSummary();
    showSuccessState();
  }

  function reset() {
    form.reset();
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
