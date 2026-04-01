function createTimeButton(time, onSelect) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "slot";
  button.textContent = time;
  button.addEventListener("click", () => onSelect(button, time));
  return button;
}

export function createBookingController({ dateTimes, appointmentDateInput, appointmentTimeInput, timeSlots }) {
  function clearSelectedTime() {
    appointmentTimeInput.value = "";
    timeSlots.innerHTML = "";
  }

  function renderTimes(date) {
    const times = dateTimes[date] || [];
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

  function bindDateSlots() {
    document.querySelectorAll("#dateSlots .slot").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("#dateSlots .slot").forEach((slot) => {
          slot.classList.remove("active");
        });

        button.classList.add("active");
        appointmentDateInput.value = button.dataset.date;
        renderTimes(button.dataset.date);
      });
    });
  }

  function reset() {
    appointmentDateInput.value = "";
    clearSelectedTime();
    document.querySelectorAll("#dateSlots .slot").forEach((slot) => {
      slot.classList.remove("active");
    });
  }

  return {
    bindDateSlots,
    reset
  };
}
