document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('featured-cars-grid');
  if (!grid) return;

  const errorEl = document.getElementById('featured-cars-error');
  const API_ENDPOINT = 'https://europe-west1-nick-storage-backup.cloudfunctions.net/get_cars_js';

  const formatNumber = (value) => {
    if (value == null || Number.isNaN(Number(value))) return 'n.b.';
    return Number(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parsePriceToNumber = (price) => {
    if (!price || typeof price !== 'string') return 0;
    if (price.toLowerCase().includes('verkocht')) return 0;
    const cleaned = price.replace(/[^\d]/g, '');
    return Number(cleaned || 0);
  };

  const parseYear = (value) => {
    if (!value) return null;
    const stringVal = String(value);
    if (stringVal.length > 4) {
      const dateVal = new Date(stringVal);
      if (!Number.isNaN(dateVal.getTime())) return dateVal.getFullYear();
    }
    const numeric = parseInt(stringVal, 10);
    return Number.isNaN(numeric) ? null : numeric;
  };

  const renderCarCard = (car) => {
    const card = document.createElement('a');
    card.className = 'car-card';
    card.href = `car-detail.html?id=${car.id}`;

    const imageSrc = Array.isArray(car.imgs) && car.imgs.length > 0 ? car.imgs[0] : 'assets/img/cars/placeholder.svg';
    const yearDisplay = car._year != null ? car._year : 'n.b.';
    const kmDisplay = car['km-stand'] != null ? `${formatNumber(car['km-stand'])} km` : 'Kilometerstand n.b.';
    const fuelDisplay = car.brandstof || 'Brandstof n.b.';
    const priceDisplay = car.prijs || 'Prijs op aanvraag';

    card.innerHTML = `
      <div class="car-image-wrap">
        <img src="${imageSrc}" alt="${car.merk || ''} ${car.model || ''}" loading="lazy">
      </div>
      <div class="car-content">
        <div class="car-title-row">
          <h3 class="car-title">${car.merk || ''} ${car.model || ''}</h3>
          <div class="car-price-block">
            <p class="car-price">${priceDisplay}</p>
          </div>
        </div>
        <div class="car-card-specs">
          <span>${yearDisplay}</span>
          <span>|</span>
          <span>${kmDisplay}</span>
          <span>|</span>
          <span>${fuelDisplay}</span>
        </div>
      </div>
    `;

    return card;
  };

  const showError = () => {
    if (errorEl) {
      errorEl.hidden = false;
    }
  };

  fetch(API_ENDPOINT)
    .then((res) => {
      if (!res.ok) throw new Error('Netwerkfout');
      return res.json();
    })
    .then((cars) => {
      grid.innerHTML = '';
      const enrichedCars = cars
        .map((car) => ({
          ...car,
          _year: parseYear(car.bouwjaar),
          _priceNum: parsePriceToNumber(car.prijs),
        }))
        .sort((a, b) => {
          const yearDiff = (b._year || 0) - (a._year || 0);
          if (yearDiff !== 0) return yearDiff;
          return (b._priceNum || 0) - (a._priceNum || 0);
        })
        .slice(0, 3);

      if (enrichedCars.length === 0) {
        showError();
        return;
      }

      enrichedCars.forEach((car) => {
        grid.appendChild(renderCarCard(car));
      });
    })
    .catch(() => {
      grid.innerHTML = '';
      showError();
    });
});
