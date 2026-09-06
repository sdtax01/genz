(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const grid = document.getElementById('shop-grid');
  const emptyState = document.getElementById('empty-state');
  const resultCount = document.getElementById('result-count');
  const categoryFilters = document.getElementById('category-filters');
  const priceRange = document.getElementById('price-range');
  const priceMaxLabel = document.getElementById('price-max-label');
  const inStockOnly = document.getElementById('in-stock-only');
  const sortSelect = document.getElementById('sort-select');
  const resetBtn = document.getElementById('reset-filters');
  const modal = document.getElementById('product-modal');
  const modalMedia = document.getElementById('modal-media');
  const modalBody = document.getElementById('modal-body');

  let activeCategories = new Set();
  let modalQty = 1;

  function buildCategoryFilters() {
    categoryFilters.innerHTML = Store.CATEGORIES.map(cat => `
      <label>
        <input type="checkbox" value="${cat}" class="cat-checkbox"> ${cat}
      </label>
    `).join('');
    categoryFilters.addEventListener('change', (e) => {
      if (e.target.classList.contains('cat-checkbox')) {
        if (e.target.checked) activeCategories.add(e.target.value);
        else activeCategories.delete(e.target.value);
        render();
      }
    });
  }

  function stockFlag(product) {
    if (product.stock === 0) return '<span class="stock-flag out">Sold out</span>';
    if (product.stock <= 5) return '<span class="stock-flag low">Low stock</span>';
    return '';
  }

  function getFiltered() {
    let products = Store.getProducts();
    if (activeCategories.size > 0) {
      products = products.filter(p => activeCategories.has(p.category));
    }
    const maxPrice = Number(priceRange.value);
    products = products.filter(p => p.price <= maxPrice);
    if (inStockOnly.checked) {
      products = products.filter(p => p.stock > 0);
    }
    switch (sortSelect.value) {
      case 'price-asc': products = products.slice().sort((a, b) => a.price - b.price); break;
      case 'price-desc': products = products.slice().sort((a, b) => b.price - a.price); break;
      case 'name': products = products.slice().sort((a, b) => a.name.localeCompare(b.name)); break;
      default: products = products.slice().sort((a, b) => b.id - a.id);
    }
    return products;
  }

  function render() {
    const products = getFiltered();
    resultCount.textContent = `${products.length} item${products.length === 1 ? '' : 's'}`;
    emptyState.hidden = products.length !== 0;
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
  }

  function openModal(id) {
    const p = Store.getProduct(id);
    if (!p) return;
    modalQty = 1;
    modalMedia.innerHTML = `<div style="width:100%; height:100%; color:${Shared.accentVar(p.accent)};">${Shared.swatchInner(p)}</div>`;
    modalMedia.style.background = `${Shared.accentVar(p.accent)}18`;
    modalBody.innerHTML = `
      <button class="modal-close" id="modal-close" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <span class="cat">${p.category}</span>
      <h3 style="font-size:1.5rem; margin-top:0.3rem;">${p.name}</h3>
      <p>${p.description || ''}</p>
      <div class="price">${Store.formatPrice(p.price)}</div>
      <p style="font-size:0.85rem; margin-bottom:1.25rem;">${p.stock > 0 ? p.stock + ' in stock' : 'Currently sold out'}</p>
      <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem;">
        <div class="qty-stepper">
          <button id="qty-dec" aria-label="Decrease quantity">–</button>
          <span id="qty-val">1</span>
          <button id="qty-inc" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <button class="btn btn-primary btn-block" id="modal-add" ${p.stock === 0 ? 'disabled' : ''}>
        ${p.stock === 0 ? 'Sold out' : 'Add to cart'}
      </button>
    `;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('qty-inc').addEventListener('click', () => {
      if (modalQty < p.stock) { modalQty++; document.getElementById('qty-val').textContent = modalQty; }
    });
    document.getElementById('qty-dec').addEventListener('click', () => {
      if (modalQty > 1) { modalQty--; document.getElementById('qty-val').textContent = modalQty; }
    });
    document.getElementById('modal-add').addEventListener('click', () => {
      Store.addToCart(p.id, modalQty);
      Shared.refreshCartBadge();
      Shared.showToast(`Added ${modalQty} × ${p.name}`);
      closeModal();
    });
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    history.replaceState(null, '', 'shop.html');
  }

  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  grid.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      e.stopPropagation();
      Store.addToCart(Number(addBtn.dataset.add), 1);
      Shared.refreshCartBadge();
      Shared.showToast('Added to cart');
      return;
    }
    const card = e.target.closest('.product-card');
    if (card) {
      history.replaceState(null, '', `shop.html?product=${card.dataset.id}`);
      openModal(Number(card.dataset.id));
    }
  });

  priceRange.addEventListener('input', () => {
    priceMaxLabel.textContent = Store.formatPrice(priceRange.value);
    render();
  });
  inStockOnly.addEventListener('change', render);
  sortSelect.addEventListener('change', render);
  resetBtn.addEventListener('click', () => {
    activeCategories.clear();
    categoryFilters.querySelectorAll('input').forEach(cb => cb.checked = false);
    priceRange.value = 4000;
    priceMaxLabel.textContent = '₹4000';
    inStockOnly.checked = false;
    sortSelect.value = 'newest';
    render();
  });

  buildCategoryFilters();
  render();

  const params = new URLSearchParams(window.location.search);
  const productParam = params.get('product');
  if (productParam) openModal(Number(productParam));
})();
