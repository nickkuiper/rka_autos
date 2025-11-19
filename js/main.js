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

  // Contact Form AJAX Submission
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");

  if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.target;
      const data = new FormData(form);
      
      // Disable button to prevent multiple submissions
      const submitButton = form.querySelector("button[type='submit']");
      if (submitButton) submitButton.disabled = true;

      try {
        const response = await fetch(form.action, {
          method: form.method,
          body: data,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          formStatus.innerHTML = '<div class="success-message" style="background-color: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin-bottom: 15px;">Bedankt voor uw bericht! We nemen zo snel mogelijk contact met u op.</div>';
          form.reset();
        } else {
          const jsonData = await response.json();
          let errorMessage = "Er is iets misgegaan. Probeer het later opnieuw.";
          if (jsonData.errors && jsonData.errors.length > 0) {
             errorMessage = jsonData.errors.map(error => error.message).join(", ");
          }
          formStatus.innerHTML = `<div class="error-message" style="background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; margin-bottom: 15px;">${errorMessage}</div>`;
        }
      } catch (error) {
        formStatus.innerHTML = '<div class="error-message" style="background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; margin-bottom: 15px;">Er is een netwerkfout opgetreden. Controleer uw verbinding en probeer het opnieuw.</div>';
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }
});
