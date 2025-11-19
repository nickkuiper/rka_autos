document.addEventListener('DOMContentLoaded', () => {

  // --- Utility Functions ---
  function formatNumber(value) {
    if (value === null || value === undefined) return '';
    const numericPart = String(value).replace(/[^\d]/g, '');
    if (!numericPart) return '';
    return Number(numericPart).toLocaleString('nl-NL');
  }

  function animateCountUp(element, endValue, useFormatting = true, duration = 800) {
    const startValue = 0;
    const range = endValue - startValue;
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = Math.floor(progress * range + startValue);

      element.textContent = useFormatting ? formatNumber(current) : current;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = useFormatting ? formatNumber(endValue) : endValue;
      }
    }
    requestAnimationFrame(step);
  }

  // --- Initialization Functions ---

  function startCountUpAnimations() {
    document.querySelectorAll('.highlight-card').forEach(card => {
      const valueElement = card.querySelector('.highlight-card__value');
      const labelElement = card.querySelector('.highlight-card__label');

      if (valueElement && labelElement) {
        const label = labelElement.textContent.toLowerCase();
        const rawValue = valueElement.textContent;
        const endValue = parseInt(rawValue.replace(/\./g, '').replace(/,/g, ''), 10);

        if (!isNaN(endValue)) {
          if (label.includes('kilometerstand')) {
            animateCountUp(valueElement, endValue, true);
          } else if (label.includes('bouwjaar')) {
            animateCountUp(valueElement, endValue, false);
          }
        }
      }
    });
  }

  function initGallery() {
    if (window.jQuery && typeof window.jQuery.fn.touchTouch === 'function') {
      window.jQuery('.photo_touch').touchTouch();
    }

    const galleryGrid = document.querySelector('.gallery-grid');
    const galleryToggleButton = document.querySelector('.gallery-toggle');

    if (galleryGrid && galleryToggleButton) {
      const totalImages = galleryToggleButton.dataset.total;
      galleryToggleButton.addEventListener('click', () => {
        galleryGrid.classList.toggle('collapsed');
        const isCollapsed = galleryGrid.classList.contains('collapsed');
        galleryToggleButton.textContent = isCollapsed ? `Toon alle ${totalImages} foto's` : 'Verberg extra foto\'s';
        galleryToggleButton.setAttribute('aria-expanded', String(!isCollapsed));
      });
    }
  }

  function initContactForm() {
    const contactToggle = document.querySelector('.contact-toggle');
    const contactForm = document.getElementById('contact-form');
    const contactResult = document.querySelector('.contact-result');

    if (contactToggle && contactForm) {
      contactToggle.addEventListener('click', () => {
        const isCollapsed = contactForm.classList.toggle('is-collapsed');
        contactToggle.classList.toggle('is-active', !isCollapsed);
        contactToggle.setAttribute('aria-expanded', String(!isCollapsed));
        contactForm.setAttribute('aria-hidden', String(isCollapsed));
      });
    }

    if (contactForm && contactResult) {
      contactForm.addEventListener('submit', (event) => {
        event.preventDefault();
        contactResult.hidden = false;
        contactForm.hidden = true;
        contactToggle.hidden = true;
      });
    }
  }

  function initLeaseCalculator() {
    const toggleButton = document.getElementById('toggle-lease-calculator');
    const iframeContainer = document.getElementById('lease-iframe-container');
    const iframeWrapper = document.getElementById('lease-iframe');

    if (!toggleButton || !iframeContainer || !iframeWrapper) return;

    const priceNum = document.body.dataset.priceNum;
    if (!priceNum || priceNum === "0") {
      toggleButton.style.display = 'none';
      return;
    }

    let iframeLoaded = false;

    toggleButton.addEventListener('click', () => {
      iframeContainer.classList.toggle('hidden');
      const isHidden = iframeContainer.classList.contains('hidden');
      toggleButton.textContent = isHidden ? 'Bereken uw leaseprijs' : 'Verberg leasecalculator';

      if (!isHidden && !iframeLoaded) {
        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '800';
        iframe.src = `https://iframe.financiallease.nl/dealer/calculator?calculator_id=953&background_color=0D0D0D&primary_color=2205a0&secondary_color=2205a0&text_color=F5F5F7&voertuig=p&aanschafwaarde=${priceNum}`;
        iframe.frameBorder = '0';
        iframeWrapper.appendChild(iframe);
        iframeLoaded = true;
      }
    });
  }

  // --- Run All Initializations ---
  startCountUpAnimations();
  initGallery();
  initContactForm();
  initLeaseCalculator();
});