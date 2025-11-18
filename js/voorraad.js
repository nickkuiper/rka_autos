document.addEventListener("DOMContentLoaded", () => {
  const carListEl = document.getElementById("car-list");
  const makeFiltersEl = document.getElementById("make-filters");
  const totalCarsEl = document.getElementById("total-cars");
  const sortSelect = document.getElementById("sort-select");
  const clearFiltersBtn = document.getElementById("clear-filters");
  const noResultsEl = document.getElementById("no-results");
  const loadingEl = document.getElementById("loading");

  if (!carListEl) return;

  // Hide loading indicator since content is pre-rendered
  if (loadingEl) {
    loadingEl.classList.remove("show");
    loadingEl.setAttribute("aria-hidden", "true");
  }

  const cardEls = Array.from(carListEl.querySelectorAll(".car-card"));

  const allCars = cardEls.map(card => ({
    el: card,
    id: card.dataset.id,
    merk: card.dataset.merk,
    priceNum: Number(card.dataset.price || 0),
    kmStand: Number(card.dataset.km || 0),
    bouwjaar: Number(card.dataset.year || 0),
  }));

  let activeMake = null;

  function buildMakeFilters() {
    if (!makeFiltersEl) return;
    const makes = [...new Set(allCars.map(c => c.merk))].sort();
    makeFiltersEl.innerHTML = "";

    makes.forEach(make => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip-filter";
      btn.innerHTML = `${make} <span>●</span>`;
      btn.dataset.make = make;
      btn.addEventListener("click", () => {
        if (activeMake === make) {
          activeMake = null;
        } else {
          activeMake = make;
        }
        
        document.querySelectorAll(".chip-filter").forEach(el => {
            el.classList.toggle('is-active', el.dataset.make === activeMake);
        });

        applyFiltersAndSort();
      });
      makeFiltersEl.appendChild(btn);
    });
  }

  function applyFiltersAndSort() {
    let visibleCars = 0;

    // 1. Filtering: Show or hide elements
    allCars.forEach(car => {
      const isVisible = !activeMake || car.merk === activeMake;
      car.el.style.display = isVisible ? "" : "none";
      if (isVisible) {
        visibleCars++;
      }
    });

    // 2. Create a sorted array of car objects that are currently visible
    const sortedCars = allCars
      .filter(car => car.el.style.display !== 'none')
      .sort((a, b) => {
        const sortValue = sortSelect ? sortSelect.value : "default";
        
        if (sortValue === "price-asc") {
          return a.priceNum - b.priceNum;
        }
        if (sortValue === "price-desc") {
          return b.priceNum - a.priceNum;
        }
        if (sortValue === "km-asc") {
          return a.kmStand - b.kmStand;
        }
        if (sortValue === "year-desc") {
          return b.bouwjaar - a.bouwjaar;
        }
        // Default sort: merk + model (implicit in original DOM order)
        return 0; 
      });

    // 3. Sorting: Re-append elements to the container in the new order
    sortedCars.forEach(car => {
      carListEl.appendChild(car.el);
    });

    // Update UI
    if (totalCarsEl) {
      totalCarsEl.textContent = visibleCars;
    }
    if (noResultsEl) {
      noResultsEl.style.display = visibleCars === 0 ? "block" : "none";
    }
  }

  // --- Initial setup ---
  
  buildMakeFilters();
  
  if (totalCarsEl) {
      totalCarsEl.textContent = allCars.length;
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      activeMake = null;
      document.querySelectorAll(".chip-filter").forEach(el => el.classList.remove("is-active"));
      if (sortSelect) sortSelect.value = "default";
      applyFiltersAndSort();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", applyFiltersAndSort);
  }
});