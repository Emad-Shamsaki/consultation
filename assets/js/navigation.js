export function createPageNavigator() {
  const pages = document.querySelectorAll(".page");

  function showPage(pageId) {
    pages.forEach((page) => {
      page.classList.toggle("active", page.id === pageId);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function bindPageButtons() {
    document.querySelectorAll("[data-show-page]").forEach((button) => {
      button.addEventListener("click", () => {
        showPage(button.dataset.showPage);
      });
    });
  }

  return {
    bindPageButtons,
    showPage
  };
}
