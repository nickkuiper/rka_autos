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
      if (header.classList.contains("nav-open")) {
        toggle.innerHTML = "✕";
      } else {
        toggle.innerHTML = "☰";
      }
    });
  }

  // Sticky header on scroll
  const scrollHeader = () => {
    if (header) {
      if (window.scrollY >= 50) {
        header.classList.add("header-scrolled");
      } else {
        header.classList.remove("header-scrolled");
      }
    }
  };
  window.addEventListener("scroll", scrollHeader);
  scrollHeader(); // Run on load
});
