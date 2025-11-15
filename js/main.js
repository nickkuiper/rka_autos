document.addEventListener("DOMContentLoaded", () => {
  // Jaar in footer
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Eenvoudige mobile nav-toggle (optioneel, als je later een mobile menu maakt)
  const toggle = document.querySelector(".mobile-toggle");
  const header = document.querySelector(".header");
  if (toggle && header) {
    toggle.addEventListener("click", () => {
      header.classList.toggle("nav-open");
    });
  }
});
