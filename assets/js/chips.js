export function createSingleSelectChips({ groupSelector, hiddenInput }) {
  const chips = document.querySelectorAll(`${groupSelector} .chip`);

  function reset() {
    hiddenInput.value = "";
    chips.forEach((chip) => {
      chip.classList.remove("active");
    });
  }

  function bind() {
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((item) => {
          item.classList.remove("active");
        });

        chip.classList.add("active");
        hiddenInput.value = chip.dataset.value;
      });
    });
  }

  return {
    bind,
    reset
  };
}

export function createMultiSelectChips({ groupSelector, hiddenInput }) {
  const chips = document.querySelectorAll(`${groupSelector} .chip`);
  const selectedValues = new Set();

  function syncInput() {
    hiddenInput.value = Array.from(selectedValues).join(", ");
  }

  function reset() {
    selectedValues.clear();
    syncInput();
    chips.forEach((chip) => {
      chip.classList.remove("active");
    });
  }

  function bind() {
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const { value } = chip.dataset;

        if (selectedValues.has(value)) {
          selectedValues.delete(value);
          chip.classList.remove("active");
        } else {
          selectedValues.add(value);
          chip.classList.add("active");
        }

        syncInput();
      });
    });
  }

  return {
    bind,
    reset
  };
}
