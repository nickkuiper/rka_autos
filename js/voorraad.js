document.addEventListener("DOMContentLoaded", () => {
  const apiEndpoint =
    "https://europe-west1-nick-storage-backup.cloudfunctions.net/get_cars_js";

  const loadingEl = document.getElementById("loading");
  const carListEl = document.getElementById("car-list");
  const makeFiltersEl = document.getElementById("make-filters");
  const totalCarsEl = document.getElementById("total-cars");
  const sortSelect = document.getElementById("sort-select");
  const clearFiltersBtn = document.getElementById("clear-filters");
  const lastUpdateEl = document.getElementById("last-update");

  let allCars = [];
  let activeMake = null;

  function formatNumber(value) {
    if (value === null || value === undefined) {
      return "";
    }

    const numericPart = String(value).replace(/[^\d]/g, "");
    if (!numericPart) {
      return "";
    }

    return Number(numericPart).toLocaleString("nl-NL");
  }

  function parsePriceToNumber(price) {
    if (!price || typeof price !== "string") return 0;
    if (price.toLowerCase().includes("verkocht")) return 0;

    // verwijder alles behalve cijfers
    const cleaned = price.replace(/[^\d]/g, "");
    return Number(cleaned || 0);
  }

  function renderCarCard(car) {
    const card = document.createElement("article");
    card.className = "car-card car-card--inventory";

    const imgSrc = car.imgs && car.imgs[0] ? car.imgs[0] : "assets/img/cars/placeholder.jpg";
    const isSold =
      typeof car.prijs === "string" && car.prijs.toLowerCase().includes("verkocht");
    const statusLabel = "Verkocht";
    const formattedMileage = formatNumber(car["km-stand"]);
    const kmText = formattedMileage ? `${formattedMileage} km` : "Kilometerstand n.b.";
    const transText = car.transmissie || "Transmissie n.b.";
    const fuelText = car.brandstof || "Brandstof n.b.";
    const yearVal = car.bouwjaar ? String(car.bouwjaar) : "";
    const yearNum =
      yearVal.length > 4 ? new Date(yearVal).getFullYear() : parseInt(yearVal, 10);
    const leaseMarkup = car.leasePrice
      ? `<span class="car-card__lease">Lease vanaf €${car.leasePrice},- p/m</span>`
      : "";
    const btwPriceMarkup = car["btw-auto"]
      ? '<span class="car-card__price-btw">Incl. BTW</span>'
      : "";
    const prijsMarkup = car.prijs ? car.prijs : "Prijs op aanvraag";

    card.innerHTML = `
      <div class="car-card__media">
        <img src="${imgSrc}" alt="${car.merk || ""} ${car.model || ""}" loading="lazy">
        ${
          isSold
            ? `<div class="car-card__badges">
          <span class="car-card__badge car-card__badge--sold">${statusLabel}</span>
        </div>`
            : ""
        }
      </div>
      <div class="car-card__content">
        <div class="car-card__header">
          <div class="car-card__titles">
            <p class="car-card__brand">${car.merk || ""}</p>
            <h3 class="car-card__title">${car.model || ""}</h3>
          </div>
        </div>
        ${car.uitvoering ? `<p class="car-card__subtitle">${car.uitvoering}</p>` : ""}
        <dl class="car-card__specs">
          <div class="spec">

            <dd>${kmText}</dd>
          </div>
          <div class="spec">

            <dd>${yearNum}</dd>
          </div>
          <div class="spec">
            <dd>${fuelText}</dd>
          </div>
        </dl>
        <div class="car-card__footer">
          <div class="car-card__price-group">
            <span class="car-card__price">${prijsMarkup}</span>
            ${btwPriceMarkup}
            ${leaseMarkup}
          </div>

        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      window.location.href = "car-detail.html?id=" + car.id;
    });

    return card;
  }

  function renderCars(cars) {
    carListEl.innerHTML = "";
    cars.forEach((car) => {
      carListEl.appendChild(renderCarCard(car));
    });
    if (totalCarsEl) {
      totalCarsEl.textContent = cars.length;
    }
  }

  function buildMakeFilters(cars) {
    const makes = [...new Set(cars.map((c) => c.merk))].sort();
    makeFiltersEl.innerHTML = "";

    makes.forEach((make) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip-filter";
      btn.innerHTML = `${make} <span>●</span>`;
      btn.addEventListener("click", () => {
        if (activeMake === make) {
          activeMake = null;
        } else {
          activeMake = make;
        }
        document
          .querySelectorAll(".chip-filter")
          .forEach((el) => el.classList.remove("is-active"));
        if (activeMake) btn.classList.add("is-active");
        applyFiltersAndSort();
      });
      makeFiltersEl.appendChild(btn);
    });
  }

  function applyFiltersAndSort() {
    let filtered = [...allCars];

    if (activeMake) {
      filtered = filtered.filter((c) => c.merk === activeMake);
    }

    const sortValue = sortSelect ? sortSelect.value : "merk";

    filtered.sort((a, b) => {
      if (sortValue === "prijs-oplopend") {
        return (a.priceNum || 0) - (b.priceNum || 0);
      } else if (sortValue === "prijs-aflopend") {
        return (b.priceNum || 0) - (a.priceNum || 0);
      } else if (sortValue === "km-stand") {
        return (a["km-stand"] || 0) - (b["km-stand"] || 0);
      } else if (sortValue === "bouwjaar") {
        const ay = new Date(a.bouwjaar || 0).getTime();
        const by = new Date(b.bouwjaar || 0).getTime();
        return by - ay;
      } else {
        // merk A-Z
        if (a.merk < b.merk) return -1;
        if (a.merk > b.merk) return 1;
        if (a.model < b.model) return -1;
        if (a.model > b.model) return 1;
        return 0;
      }
    });

    renderCars(filtered);
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      activeMake = null;
      document
        .querySelectorAll(".chip-filter")
        .forEach((el) => el.classList.remove("is-active"));
      if (sortSelect) sortSelect.value = "merk";
      applyFiltersAndSort();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", applyFiltersAndSort);
  }

  // Data ophalen
  if (loadingEl) {
    loadingEl.classList.add("show");
    loadingEl.setAttribute("aria-hidden", "false");
  }

  fetch(apiEndpoint)
    .then((res) => res.json())
    .then((data) => {
      // aanvullen met numerieke prijs voor sorteren
      allCars = data.map((car) => ({
        ...car,
        priceNum: parsePriceToNumber(car.prijs),
      }));

      buildMakeFilters(allCars);
      applyFiltersAndSort();

      if (lastUpdateEl) {
        const now = new Date();
        lastUpdateEl.textContent =
          now.toLocaleDateString("nl-NL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }) + " " +
          now.toLocaleTimeString("nl-NL", {
            hour: "2-digit",
            minute: "2-digit",
          });
      }
    })
    .catch((err) => {
      console.error("Error fetching cars", err);
      if (carListEl) {
        carListEl.innerHTML =
          '<p style="color: var(--muted); font-size: 14px;">Kon de voorraad niet laden. Probeer het later opnieuw.</p>';
      }
    })
    .finally(() => {
      if (loadingEl) {
        loadingEl.classList.remove("show");
        loadingEl.setAttribute("aria-hidden", "true");
      }
    });
});
