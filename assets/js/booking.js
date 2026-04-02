function createTimeButton(slot, onSelect) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "slot";
  button.textContent = slot.displayTime;
  button.addEventListener("click", () => onSelect(button, slot));
  return button;
}

function createDateButton(dateGroup, onSelect) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "slot";
  button.dataset.dateKey = dateGroup.dateKey;
  button.textContent = dateGroup.label;
  button.addEventListener("click", () => onSelect(button, dateGroup));
  return button;
}

export function createBookingController({
  dateSlots,
  timeSlots,
  scheduleInfo,
  appointmentDateInput,
  appointmentTimeInput,
  appointmentStartsAtInput
}) {
  let availableDates = [];
  let sourceTimezone = "UTC";
  let selectedTimezone = "UTC";

  function clearSelectedTime() {
    appointmentTimeInput.value = "";
    appointmentStartsAtInput.value = "";
    timeSlots.innerHTML = "";
  }

  function renderScheduleInfo(message) {
    scheduleInfo.textContent = message;
  }

  function renderTimes(dateKey) {
    const dateGroup = availableDates.find((item) => item.dateKey === dateKey);
    clearSelectedTime();

    if (!dateGroup) {
      return;
    }

    dateGroup.timeSlots.forEach((slot) => {
      const button = createTimeButton(slot, (selectedButton, selectedSlot) => {
        timeSlots.querySelectorAll(".slot").forEach((timeButton) => {
          timeButton.classList.remove("active");
        });

        selectedButton.classList.add("active");
        appointmentTimeInput.value = selectedSlot.displayTime;
        appointmentStartsAtInput.value = selectedSlot.startsAt;
      });

      timeSlots.appendChild(button);
    });
  }

  function renderDateSlots() {
    dateSlots.innerHTML = "";

    availableDates.forEach((dateGroup) => {
      const button = createDateButton(dateGroup, (selectedButton, selectedDate) => {
        dateSlots.querySelectorAll(".slot").forEach((dateButton) => {
          dateButton.classList.remove("active");
        });

        selectedButton.classList.add("active");
        appointmentDateInput.value = selectedDate.label;
        renderTimes(selectedDate.dateKey);
      });

      dateSlots.appendChild(button);
    });
  }

  function showLoadError(message) {
    dateSlots.innerHTML = `<p class="hint booking-message">${message}</p>`;
    timeSlots.innerHTML = "";
    appointmentDateInput.value = "";
    appointmentTimeInput.value = "";
    appointmentStartsAtInput.value = "";
    renderScheduleInfo(message);
  }

  function updateAvailability({
    availableDates: nextAvailableDates,
    sourceTimezone: nextSourceTimezone,
    selectedTimezone: nextSelectedTimezone
  }) {
    availableDates = nextAvailableDates;
    sourceTimezone = nextSourceTimezone;
    selectedTimezone = nextSelectedTimezone;
    appointmentDateInput.value = "";
    clearSelectedTime();

    if (!availableDates.length) {
      showLoadError("No available dates are currently configured for this timezone.");
      return;
    }

    renderDateSlots();
    renderScheduleInfo(
      `Times below are shown in ${selectedTimezone}. Consultant availability is managed in ${sourceTimezone}.`
    );
  }

  function reset() {
    appointmentDateInput.value = "";
    clearSelectedTime();

    dateSlots.querySelectorAll(".slot").forEach((dateButton) => {
      dateButton.classList.remove("active");
    });

    if (availableDates.length) {
      renderScheduleInfo(
        `Times below are shown in ${selectedTimezone}. Consultant availability is managed in ${sourceTimezone}.`
      );
    }
  }

  return {
    reset,
    showLoadError,
    updateAvailability
  };
}
