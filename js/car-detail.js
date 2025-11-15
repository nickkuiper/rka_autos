function formatNumber(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const numericPart = String(value).replace(/[^\d]/g, '');
  if (!numericPart) {
    return '';
  }

  return Number(numericPart).toLocaleString('nl-NL');
}

let currentCarDetails = null; // Declare a global variable to store car details

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const carId = urlParams.get('id');

  if (carId) {
    fetchCarDetails(carId);
  } else {
    document.getElementById('car-detail-main').innerHTML = '<p class="container">Geen auto geselecteerd. Ga terug naar het <a href="voorraad.html">aanbod</a>.</p>';
  }
});

async function fetchCarDetails(carId) {
  const mainContent = document.getElementById('car-detail-main');
  const loadingSection = document.querySelector('.detail-loading');

  if (loadingSection) {
    loadingSection.style.display = 'flex'; // Show loading animation
  }

  try {
    const response = await fetch(`https://europe-west1-nick-storage-backup.cloudfunctions.net/getCar/${carId}`);
    if (!response.ok) {
      throw new Error('Netwerk response was niet ok.');
    }
    const car = await response.json();
    currentCarDetails = car; // Store car details
    renderCarDetails(car);
  } catch (error) {
    mainContent.innerHTML = `<p class="container">Fout bij het laden van de autodetails: ${error.message}</p>`;
  } finally {
    if (loadingSection) {
      loadingSection.remove(); // Remove loading animation once done
    }
  }
}

function createHTMLElement(tag, id = null, classes = null, attributes = {}) {
  const element = document.createElement(tag);
  if (id) element.id = id;
  if (classes) element.className = classes;
  for (const key in attributes) {
    element.setAttribute(key, attributes[key]);
  }
  return element;
}

function embedIframe(car) {
  const leaseIframe = document.getElementById('lease-iframe');
  // Clear any existing iframe to prevent duplicates if the button is clicked multiple times
  leaseIframe.innerHTML = '';

  const iframe = createHTMLElement('iframe', null, null, {
    width: '100%',
    height: '800',
    src: `https://iframe.financiallease.nl/dealer/calculator?calculator_id=953&background_color=f0f0f0&primary_color=2205a0&secondary_color=2205a0&text_color=000000&voertuig=p&aanschafwaarde=${car.priceNum}`,
    frameBorder: '0'
  });
  leaseIframe.appendChild(iframe);
}

function renderCarDetails(car) {
  const mainContent = document.getElementById('car-detail-main');
  const title = [car.merk, car.model].filter(Boolean).join(' ').trim() || 'Onbekende auto';
  const subtitle = car.uitvoering || '';
  const hasImages = Array.isArray(car.imgs) && car.imgs.length > 0;
  const primaryImage = hasImages ? car.imgs[0] : '';
  const altText = car.merk_model || title;
  const totalGalleryImages = hasImages ? car.imgs.length : 0;
  const previewRows = 2;

  const extractYear = (value) => {
    if (!value) {
      return null;
    }

    const match = String(value).match(/\d{4}/);
    if (match && match[0]) {
      return Number(match[0]);
    }

    const parsed = new Date(value);
    const year = parsed.getFullYear();
    return Number.isNaN(year) ? null : year;
  };

  const buildYear = extractYear(car.bouwjaar);
  const formattedMileage = formatNumber(car['km-stand']);

  const [exteriorColor, interiorColor] = car.kleur
    ? car.kleur.split(',').map(part => part.trim())
    : ['n.b.', 'n.v.t.'];

  const highlightData = [
    formattedMileage ? { label: 'Kilometerstand', value: `${formattedMileage} km` } : null,
    buildYear ? { label: 'Bouwjaar', value: buildYear } : null,
    car.transmissie ? { label: 'Transmissie', value: car.transmissie } : null,
  ].filter(Boolean);

  const specCards = [
    {
      label: 'Vermogen',
      value: car.pk || 'n.b.',
      items: [
        ['Brandstof', car.brandstof || 'n.b.'],
        ['Transmissie', car.transmissie || 'n.b.'],
        ['Motorinhoud', car.motorinhoud || 'n.b.'],
        ['0-100 km/u', car['0-100'] || 'n.b.'],
      ],
    },
    {
      label: 'Kilometerstand',
      value: formattedMileage ? `${formattedMileage} km` : 'n.b.',
      items: [
        ['Bouwjaar', buildYear || 'n.b.'],
        ['APK-datum', car['apk-datum'] ? new Date(car['apk-datum']).toLocaleDateString('nl-NL') : 'n.b.'],
        ['Gewicht', car['gewicht-rijklaar'] || 'n.b.'],
        ['Topsnelheid', car.topsnelheid || 'n.b.'],
      ],
    },
    {
      label: 'Kleur',
      value: exteriorColor || 'n.b.',
      items: [
        ['Interieur', interiorColor || 'n.v.t.'],
        ['Garantie', car.garantie || 'n.b.'],
        ['BTW auto', typeof car['btw-auto'] === 'boolean' ? (car['btw-auto'] ? 'Ja' : 'Nee') : 'n.b.'],
        ['Leaseprijs', car.leasePrice || 'n.b.'],
      ],
    },
  ];

  const specCardsHtml = specCards.map(card => `
    <article class="spec-card">
      <span class="spec-card__label">${card.label}</span>
      <h3 class="spec-card__value">${card.value}</h3>
      <dl class="spec-card__details">
        ${card.items.map(([label, value]) => `
          <div class="spec-row">
            <dt>${label}</dt>
            <dd>${value}</dd>
          </div>
        `).join('')}
      </dl>
    </article>
  `).join('');

  const galleryItemsHtml = hasImages
    ? car.imgs
        .map((imgSrc, index) => `
        <a href="${imgSrc}" class="gallery-item photo_touch" data-gallery="detail" data-index="${index}">
          <img src="${imgSrc}" alt="${altText} foto ${index + 1}">
        </a>
      `)
        .join('')
    : '<p class="empty-state">Er zijn momenteel geen extra foto&#39;s beschikbaar.</p>';

  const galleryToggleHtml = hasImages && totalGalleryImages > 1
    ? `<button type="button" class="gallery-toggle" data-total="${totalGalleryImages}" aria-expanded="false">Toon alle ${totalGalleryImages} foto&#39;s</button>`
    : '';

  const optionsHtml = Array.isArray(car['alle-opties']) && car['alle-opties'].length > 0
    ? car['alle-opties']
        .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
        .map(option => `<li>${option}</li>`).join('')
    : '<li>Geen optionele uitrusting geregistreerd.</li>';

  const descriptionHtml = (car.uitgelichtrich || '').trim()
    ? car.uitgelichtrich.trim().split(/\n{2,}/).map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`).join('')
    : '<p>Geen beschrijving beschikbaar.</p>';

  const heroThumbsHtml = hasImages && car.imgs.length > 1
    ? `<div class="hero-thumbs">
        ${car.imgs.slice(1, 4).map((imgSrc, index) => `
          <a href="${imgSrc}" class="thumb photo_touch" data-gallery="detail" data-index="${index + 1}">
            <img src="${imgSrc}" alt="${altText} detail ${index + 2}">
          </a>
        `).join('')}
      </div>`
    : '';

  const ficheLink = car.fiche || car.ficheLink || car.ficheUrl || car.pdfUrl || car.pdf || '';
  const ficheButtonHtml = ficheLink
    ? `<a href="${ficheLink}" class="btn hero-download" target="_blank" rel="noopener">Download fiche</a>`
    : '';
  const heroActionsHtml = ficheButtonHtml
    ? `<div class="hero-actions">
        ${ficheButtonHtml}
      </div>`
    : '';
  const heroDescriptionClass = heroActionsHtml ? 'hero-description hero-description--with-divider' : 'hero-description';

  // Determine if the lease calculator section should be shown
  const showLeaseCalculator = car.prijs && !String(car.prijs).toLowerCase().includes('verkocht');

  let leaseCalculatorSectionHtml = '';
  if (showLeaseCalculator) {
    leaseCalculatorSectionHtml = `
      <section class="lease-calculator-section container">
        <button id="toggle-lease-calculator" class="btn primary-btn">Bereken uw leaseprijs</button>
        <div id="lease-iframe-container" class="lease-iframe-container hidden">
          <div id="lease-iframe"></div>
        </div>
      </section>
    `;
  }

  const carDetailHtml = `
    <section class="detail-hero">
      <div class="container">
        <div class="hero-header">
          <a href="voorraad.html" class="hero-back">← Terug naar aanbod</a>
          <h1 class="hero-title">${title}</h1>
          ${subtitle ? `<p class="hero-subtitle">${subtitle}</p>` : ''}
        </div>

        <div class="detail-hero__grid">
          <div class="hero-media">
            ${hasImages ? `
              <a href="${primaryImage}" class="hero-image photo_touch" data-gallery="detail" data-index="0">
                <img src="${primaryImage}" alt="${altText}">
                <span class="hero-image__hint">Klik om te vergroten</span>
              </a>
            ` : `
              <div class="hero-image hero-image--placeholder">
                <span>Geen afbeelding beschikbaar</span>
              </div>
            `}
            ${heroThumbsHtml}
          </div>
          <div class="hero-content">
            ${highlightData.length ? `
              <div class="hero-highlights">
                ${highlightData.map(item => `
                  <article class="highlight-card">
                    <span class="highlight-card__value">${item.value}</span>
                    <span class="highlight-card__label">${item.label}</span>
                  </article>
                `).join('')}
              </div>
            ` : ''}
            ${car.prijs ? `<div class="hero-price">${car.prijs}</div>` : ''}
            <div class="${heroDescriptionClass}">${descriptionHtml}</div>
            ${heroActionsHtml}
          </div>
        </div>
      </div>
    </section>

    ${leaseCalculatorSectionHtml}

    <section class="specs-section section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Belangrijkste specificaties</h2>
          <p class="section-subtitle">Alle kerngegevens overzichtelijk bij elkaar.</p>
        </div>
        <div class="spec-grid">
          ${specCardsHtml}
        </div>
      </div>
    </section>

    <section class="gallery-section section">
      <div class="container">
        <div class="gallery-card">
          <div class="gallery-header">
            <h2 class="section-title">Fotogalerij</h2>
            <p class="section-subtitle">Klik op een afbeelding om te vergroten.</p>
          </div>
          <div class="gallery-grid">
            ${galleryItemsHtml}
          </div>
          ${galleryToggleHtml}
        </div>
      </div>
    </section>

    <section class="detail-bottom section">
      <div class="container detail-bottom__grid">
        <article class="options-card">
          <div class="section-header">
            <h2 class="section-title">Optielijst</h2>
            <p class="section-subtitle">Uitgebreide uitrusting zoals geleverd.</p>
          </div>
          <ul class="options-list">
            ${optionsHtml}
          </ul>
        </article>

        <aside class="contact-card">
          <span class="pill">Contact</span>
          <h2 class="contact-title">Interesse in deze wagen?</h2>
          <p class="contact-subtitle">Laat uw gegevens achter en wij nemen zo snel mogelijk contact op.</p>
          <button type="button" class="contact-toggle" aria-expanded="false">Vraag informatie aan</button>
          <form id="contact_form" class="contact-form is-collapsed" aria-hidden="true" novalidate>
            <label class="field" for="in_nm">
              <span class="field-label">Naam</span>
              <input type="text" id="in_nm" name="name" placeholder="Uw naam" autocomplete="name">
            </label>
            <label class="field" for="in_em">
              <span class="field-label">E-mail</span>
              <input type="email" id="in_em" name="email" placeholder="Uw e-mailadres" autocomplete="email">
            </label>
            <label class="field" for="in_qs">
              <span class="field-label">Bericht</span>
              <textarea id="in_qs" name="message" placeholder="Waar kunnen we u mee helpen?" rows="4"></textarea>
            </label>
            <button type="submit" class="btn contact-submit">Verzenden</button>
          </form>
          <div class="contact-result" aria-live="polite" hidden>
            Thanks for your question.<br>We will get back to you as soon as possible.
          </div>
        </aside>
      </div>
    </section>
  `;

  mainContent.innerHTML = carDetailHtml;

  if (window.jQuery && typeof window.jQuery === 'function' && window.jQuery.fn.touchTouch) {
    window.jQuery('.photo_touch').touchTouch();
  }

  const galleryCard = document.querySelector('.gallery-card');
  const galleryGrid = galleryCard ? galleryCard.querySelector('.gallery-grid') : null;
  const galleryItems = galleryGrid ? Array.from(galleryGrid.querySelectorAll('.gallery-item')) : [];
  const galleryToggleButton = document.querySelector('.gallery-toggle');

  if (galleryCard && galleryGrid && galleryItems.length && galleryToggleButton) {
    const collapsedText = `Toon alle ${totalGalleryImages} foto's`;
    const expandedText = "Verberg extra foto's";
    let isExpanded = false;
    let initialVisibleCount = 0;

    const computeInitialVisibleCount = () => {
      if (!galleryItems.length) {
        return 0;
      }

      const styles = window.getComputedStyle(galleryGrid);
      const rowGap = parseFloat(styles.rowGap || styles.gap || '0') || 0;
      const firstItem = galleryItems[0];
      const firstRowTop = firstItem.offsetTop;
      const itemRect = firstItem.getBoundingClientRect();
      const rowHeight = itemRect.height || firstItem.offsetHeight || 0;

      if (rowHeight <= 0) {
        return Math.min(galleryItems.length, previewRows);
      }

      const maxOffset = (rowHeight + rowGap) * (previewRows - 1) + 1;
      let visibleCount = 0;

      for (const item of galleryItems) {
        const offsetDifference = item.offsetTop - firstRowTop;
        if (offsetDifference <= maxOffset) {
          visibleCount += 1;
        } else {
          break;
        }
      }

      return Math.max(visibleCount, Math.min(galleryItems.length, previewRows));
    };

    const syncItems = () => {
      galleryItems.forEach((item, index) => {
        const isExtra = index >= initialVisibleCount;
        item.classList.toggle('gallery-item--extra', isExtra);

        if (isExtra) {
          item.hidden = !isExpanded;
          item.setAttribute('aria-hidden', String(!isExpanded));
        } else {
          item.hidden = false;
          item.removeAttribute('aria-hidden');
        }
      });
    };

    const updateCollapsibleState = () => {
      const hasExtras = initialVisibleCount < galleryItems.length;

      if (!hasExtras && isExpanded) {
        isExpanded = false;
      }

      galleryCard.classList.toggle('gallery-card--collapsible', hasExtras);
      galleryCard.classList.toggle('is-expanded', hasExtras && isExpanded);

      galleryToggleButton.hidden = !hasExtras;
      if (hasExtras) {
        galleryToggleButton.removeAttribute('aria-hidden');
      } else {
        galleryToggleButton.setAttribute('aria-hidden', 'true');
      }
      galleryToggleButton.setAttribute('aria-expanded', String(hasExtras && isExpanded));

      if (hasExtras) {
        galleryToggleButton.textContent = isExpanded ? expandedText : collapsedText;
      }

      syncItems();
    };

    const initializeGallery = () => {
      initialVisibleCount = computeInitialVisibleCount();
      updateCollapsibleState();
    };

    const scheduleInitialization = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(initializeGallery);
      });
    };

    galleryToggleButton.addEventListener('click', () => {
      if (galleryToggleButton.hidden) {
        return;
      }

      isExpanded = !isExpanded;
      updateCollapsibleState();
    });

    const handleResize = () => {
      if (isExpanded) {
        return;
      }

      const recalculated = computeInitialVisibleCount();
      if (recalculated !== initialVisibleCount) {
        initialVisibleCount = recalculated;
        updateCollapsibleState();
      }
    };

    window.addEventListener('resize', handleResize);

    // Call initializeGallery immediately after content is rendered
    initializeGallery();

    scheduleInitialization();
    window.addEventListener('load', initializeGallery, { once: true });

    galleryItems.forEach((item) => {
      const img = item.querySelector('img');
      if (img && !img.complete) {
        img.addEventListener('load', initializeGallery, { once: true });
      }
    });
  } else if (galleryToggleButton) {
    galleryToggleButton.remove();
  }

  const contactToggle = document.querySelector('.contact-toggle');
  const contactForm = document.getElementById('contact_form');
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
    });
  }

  if (contactForm && contactResult) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      contactResult.hidden = false;
    });
  }

  const toggleLeaseCalculatorButton = document.getElementById('toggle-lease-calculator');
  const leaseIframeContainer = document.getElementById('lease-iframe-container');
  let iframeLoaded = false;

  if (toggleLeaseCalculatorButton && leaseIframeContainer) {
    toggleLeaseCalculatorButton.addEventListener('click', () => {
      leaseIframeContainer.classList.toggle('hidden');

      if (!leaseIframeContainer.classList.contains('hidden') && !iframeLoaded) {
        if (currentCarDetails && currentCarDetails.priceNum) {
          embedIframe(currentCarDetails);
          iframeLoaded = true;
        } else {
          console.error('Car details or price not available to embed iframe.');
          // Optionally, show an error message to the user
        }
      }
      // Update button text based on visibility
      if (leaseIframeContainer.classList.contains('hidden')) {
        toggleLeaseCalculatorButton.textContent = 'Bereken uw leaseprijs';
      } else {
        toggleLeaseCalculatorButton.textContent = 'Verberg leasecalculator';
      }
    });
  }
}

// Placeholder for global variables from inspiration (if needed)
var pgkind = 3; // Example value
var curr_url = window.location.href; // Example value