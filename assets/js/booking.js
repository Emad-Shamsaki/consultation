function createTimeButton(time, onSelect) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "slot";
  button.textContent = time;
  button.addEventListener("click", () => onSelect(button, time));
  return button;
}

function createDateButton(appointment, onSelect) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "slot";
  button.dataset.date = appointment.date;
  button.dataset.label = appointment.label;
  button.textContent = appointment.label;
  button.addEventListener("click", () => onSelect(button, appointment));
  return button;
}

export function createBookingController({
  availableDates,
  dateSlots,
  appointmentDateInput,
  appointmentTimeInput,
  timeSlots
}) {
  const appointmentsByDate = new Map(
    availableDates.map((appointment) => [appointment.date, appointment])
  );

  function clearSelectedTime() {
    appointmentTimeInput.value = "";
    timeSlots.innerHTML = "";
  }

  function renderTimes(date) {
    const appointment = appointmentsByDate.get(date);
    const times = appointment?.timeSlots || [];
    clearSelectedTime();

    times.forEach((time) => {
      const button = createTimeButton(time, (selectedButton, selectedTime) => {
        timeSlots.querySelectorAll(".slot").forEach((slot) => {
          slot.classList.remove("active");
        });

        selectedButton.classList.add("active");
        appointmentTimeInput.value = selectedTime;
      });

      timeSlots.appendChild(button);
    });
  }

  function renderDateSlots() {
    dateSlots.innerHTML = "";

    availableDates.forEach((appointment) => {
      const button = createDateButton(appointment, (selectedButton, selectedAppointment) => {
        dateSlots.querySelectorAll(".slot").forEach((slot) => {
          slot.classList.remove("active");
        });

        selectedButton.classList.add("active");
        appointmentDateInput.value = selectedAppointment.label;
        renderTimes(selectedAppointment.date);
      });

      dateSlots.appendChild(button);
    });
  }

  function showLoadError(message) {
    dateSlots.innerHTML = `<p class="hint booking-message">${message}</p>`;
    clearSelectedTime();
  }

  function init() {
    if (!availableDates.length) {
      showLoadError("No available dates are currently configured.");
      return;
    }

    renderDateSlots();
  }

  function reset() {
    appointmentDateInput.value = "";
    clearSelectedTime();

    dateSlots.querySelectorAll(".slot").forEach((slot) => {
      slot.classList.remove("active");
    });
  }

  return {
    init,
    reset,
    showLoadError
  };
}
