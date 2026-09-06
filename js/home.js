(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function renderHeroCards() {
    const container = document.getElementById('hero-visual');
    if (!container) return;
    const picks = Store.getProducts().slice(0, 3);
    const positions = ['card-1', 'card-2', 'card-3'];
    container.innerHTML = picks.map((p, i) => `
      <div class="hero-card ${positions[i]}" style="background:${Shared.accentVar(p.accent)}22;">
        <div class="product-swatch" style="border-bottom:none; color:${Shared.accentVar(p.accent)}; aspect-ratio:1;">
          ${Shared.iconMarkup(p.icon)}
        </div>
      </div>
    `).join('');
  }

  function renderBrandVisual() {
    const container = document.getElementById('brand-visual');
    if (!container) return;
    const picks = Store.getProducts().slice(3, 5);
    container.innerHTML = `
      <div class="hero-card card-1" style="background:${Shared.accentVar(picks[0].accent)}22; width:60%;">
        <div class="product-swatch" style="border-bottom:none; color:${Shared.accentVar(picks[0].accent)}; aspect-ratio:1;">${Shared.iconMarkup(picks[0].icon)}</div>
      </div>
      <div class="hero-card card-2" style="background:${Shared.accentVar(picks[1].accent)}22; width:50%;">
        <div class="product-swatch" style="border-bottom:none; color:${Shared.accentVar(picks[1].accent)}; aspect-ratio:1;">${Shared.iconMarkup(picks[1].icon)}</div>
      </div>
    `;
  }

  function stockFlag(product) {
    if (product.stock === 0) return '<span class="stock-flag out">Sold out</span>';
    if (product.stock <= 5) return '<span class="stock-flag low">Low stock</span>';
    return '';
  }

  function renderFeatured() {
    const grid = document.getElementById('featured-grid');
    if (!grid) return;
    const products = Store.getProducts().slice(0, 8);
    grid.innerHTML = products.map(p => `
      <article class="product-card" data-id="${p.id}">
        <div class="product-swatch" style="background:${Shared.accentVar(p.accent)}18; color:${Shared.accentVar(p.accent)};">
          <span class="punch"></span>
          ${Shared.swatchInner(p)}
          ${stockFlag(p)}
        </div>
        <div class="product-info">
          <span class="cat">${p.category}</span>
          <h3>${p.name}</h3>
          <div class="price-row">
            <span class="price">${Store.formatPrice(p.price)}</span>
            <button class="add-btn" data-add="${p.id}" aria-label="Add ${p.name} to cart" ${p.stock === 0 ? 'disabled' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
        </div>
      </article>
    `).join('');

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add]');
      if (btn) {
        e.stopPropagation();
        Store.addToCart(Number(btn.dataset.add), 1);
        Shared.refreshCartBadge();
        Shared.showToast('Added to cart');
        return;
      }
      const card = e.target.closest('.product-card');
      if (card) window.location.href = `shop.html?product=${card.dataset.id}`;
    });
  }

  const form = document.getElementById('newsletter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      Shared.showToast("You're on the list ✦");
      form.reset();
    });
  }

  renderHeroCards();
  renderBrandVisual();
  renderFeatured();
})();
