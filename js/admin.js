(function () {
  const AUTH_KEY = 'genz_admin_authed';

  const loginScreen = document.getElementById('login-screen');
  const adminShell = document.getElementById('admin-shell');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  function isAuthed() { return sessionStorage.getItem(AUTH_KEY) === '1'; }

  function showApp() {
    loginScreen.hidden = true;
    adminShell.hidden = false;
    renderAll();
  }
  function showLogin() {
    loginScreen.hidden = false;
    adminShell.hidden = true;
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = document.getElementById('login-password').value;
    const settings = Store.getSettings();
    if (entered === settings.adminPassword) {
      sessionStorage.setItem(AUTH_KEY, '1');
      loginError.textContent = '';
      loginForm.reset();
      showApp();
    } else {
      loginError.textContent = 'Incorrect password. Try again.';
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    showLogin();
  });

  // ---- Tabs ----
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(panel => panel.hidden = true);
      document.getElementById('tab-' + btn.dataset.tab).hidden = false;
      if (btn.dataset.tab === 'dashboard') renderDashboard();
      if (btn.dataset.tab === 'products') renderProducts();
      if (btn.dataset.tab === 'orders') renderOrders();
      if (btn.dataset.tab === 'settings') renderSettingsForm();
    });
  });

  // ---- Dashboard ----
  function renderDashboard() {
    const orders = Store.getOrders();
    const products = Store.getProducts();
    const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.totalAmount, 0);
    document.getElementById('stat-revenue').textContent = Store.formatPrice(revenue);
    document.getElementById('stat-orders').textContent = orders.length;
    document.getElementById('stat-products').textContent = products.length;
    document.getElementById('stat-lowstock').textContent = products.filter(p => p.stock > 0 && p.stock <= 5).length;

    const body = document.getElementById('recent-orders-body');
    const recent = orders.slice(0, 6);
    body.innerHTML = recent.length ? recent.map(o => `
      <tr>
        <td>#${o.orderNumber}</td>
        <td>${o.customerName || '—'}</td>
        <td>${Store.formatPrice(o.totalAmount)}</td>
        <td><span class="status-pill ${o.status}">${o.status}</span></td>
      </tr>
    `).join('') : `<tr><td colspan="4" style="text-align:center; color:var(--ink-soft);">No orders yet</td></tr>`;
  }

  // ---- Products ----
  const productFormCard = document.getElementById('product-form-card');
  const productFormTitle = document.getElementById('product-form-title');
  const categorySelect = document.getElementById('pf-category');
  let editingProductId = null;
  let pendingImage = null;

  categorySelect.innerHTML = Store.CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');

  document.getElementById('product-image-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      pendingImage = reader.result;
      document.getElementById('image-preview').innerHTML = `<img src="${reader.result}" alt="preview">`;
    };
    reader.readAsDataURL(file);
  });

  function openProductForm(product) {
    editingProductId = product ? product.id : null;
    pendingImage = product ? product.image || null : null;
    productFormTitle.textContent = product ? 'Edit product' : 'Add product';
    document.getElementById('pf-name').value = product ? product.name : '';
    document.getElementById('pf-category').value = product ? product.category : Store.CATEGORIES[0];
    document.getElementById('pf-price').value = product ? product.price : '';
    document.getElementById('pf-stock').value = product ? product.stock : '';
    document.getElementById('pf-description').value = product ? (product.description || '') : '';
    document.getElementById('image-preview').innerHTML = pendingImage
      ? `<img src="${pendingImage}" alt="preview">`
      : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>`;
    productFormCard.hidden = false;
    productFormCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.getElementById('new-product-btn').addEventListener('click', () => openProductForm(null));
  document.getElementById('cancel-product-btn').addEventListener('click', () => { productFormCard.hidden = true; });

  document.getElementById('save-product-btn').addEventListener('click', () => {
    const name = document.getElementById('pf-name').value.trim();
    const price = Number(document.getElementById('pf-price').value);
    const stock = Number(document.getElementById('pf-stock').value);
    if (!name || !price || stock === '' || isNaN(stock)) {
      Shared.showToast('Fill in name, price and stock');
      return;
    }
    const payload = {
      name,
      category: categorySelect.value,
      price,
      stock,
      description: document.getElementById('pf-description').value.trim(),
      image: pendingImage,
      icon: iconForCategory(categorySelect.value),
      accent: accentForCategory(categorySelect.value)
    };
    if (editingProductId) {
      Store.updateProduct(editingProductId, payload);
      Shared.showToast('Product updated');
    } else {
      Store.addProduct(payload);
      Shared.showToast('Product added');
    }
    productFormCard.hidden = true;
    renderProducts();
    renderDashboard();
  });

  function iconForCategory(cat) {
    const map = { Tees: 'tee', Hoodies: 'hoodie', Outerwear: 'jacket', Bottoms: 'pants', Accessories: 'bag', Footwear: 'shoe' };
    return map[cat] || 'tee';
  }
  function accentForCategory(cat) {
    const map = { Tees: 'pink', Hoodies: 'violet', Outerwear: 'cyan', Bottoms: 'lime', Accessories: 'pink', Footwear: 'violet' };
    return map[cat] || 'violet';
  }

  function renderProducts() {
    const products = Store.getProducts();
    const body = document.getElementById('products-body');
    body.innerHTML = products.length ? products.map(p => `
      <tr>
        <td><div class="row-thumb" style="background:${Shared.accentVar(p.accent)}18; color:${Shared.accentVar(p.accent)};">${Shared.swatchInner(p)}</div></td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${Store.formatPrice(p.price)}</td>
        <td>${p.stock}</td>
        <td class="row-actions">
          <button class="btn btn-sm" data-edit="${p.id}">Edit</button>
          <button class="btn btn-sm" data-delete="${p.id}">Delete</button>
        </td>
      </tr>
    `).join('') : `<tr><td colspan="6" style="text-align:center; color:var(--ink-soft);">No products yet</td></tr>`;
  }

  document.getElementById('products-body').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit]');
    const delBtn = e.target.closest('[data-delete]');
    if (editBtn) openProductForm(Store.getProduct(Number(editBtn.dataset.edit)));
    if (delBtn) {
      if (confirm('Delete this product? This can\'t be undone.')) {
        Store.deleteProduct(Number(delBtn.dataset.delete));
        Shared.showToast('Product deleted');
        renderProducts();
        renderDashboard();
      }
    }
  });

  // ---- Orders ----
  function renderOrders() {
    const orders = Store.getOrders();
    const body = document.getElementById('orders-body');
    body.innerHTML = orders.length ? orders.map(o => `
      <tr>
        <td>#${o.orderNumber}</td>
        <td>${o.customerName || '—'}<br><span style="font-size:0.78rem; color:var(--ink-soft);">${o.customerEmail || ''}</span></td>
        <td>${(o.items || []).map(i => `${i.name} ×${i.quantity}`).join(', ')}</td>
        <td>${Store.formatPrice(o.totalAmount)}</td>
        <td>
          <select class="select" style="padding:0.4rem 0.6rem; font-size:0.8rem;" data-status="${o.id}">
            ${['pending', 'paid', 'demo', 'shipped', 'delivered', 'cancelled'].map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
      </tr>
    `).join('') : `<tr><td colspan="5" style="text-align:center; color:var(--ink-soft);">No orders yet</td></tr>`;
  }

  document.getElementById('orders-body').addEventListener('change', (e) => {
    const select = e.target.closest('[data-status]');
    if (select) {
      Store.updateOrderStatus(Number(select.dataset.status), select.value);
      Shared.showToast('Order status updated');
      renderDashboard();
    }
  });

  // ---- Settings ----
  function renderSettingsForm() {
    const s = Store.getSettings();
    document.getElementById('set-store-name').value = s.storeName;
    document.getElementById('set-whatsapp').value = s.whatsappNumber;
    document.getElementById('set-razorpay').value = s.razorpayKeyId;
    document.getElementById('set-discount-code').value = s.discountCode;
    document.getElementById('set-discount-percent').value = s.discountPercent;
  }

  document.getElementById('save-store-btn').addEventListener('click', () => {
    Store.updateSettings({
      storeName: document.getElementById('set-store-name').value.trim() || 'GENZ',
      whatsappNumber: document.getElementById('set-whatsapp').value.trim()
    });
    Shared.showToast('Store details saved');
  });

  document.getElementById('save-razorpay-btn').addEventListener('click', () => {
    Store.updateSettings({ razorpayKeyId: document.getElementById('set-razorpay').value.trim() });
    Shared.showToast('Razorpay key saved');
  });

  document.getElementById('save-discount-btn').addEventListener('click', () => {
    Store.updateSettings({
      discountCode: document.getElementById('set-discount-code').value.trim().toUpperCase() || 'GENZ10',
      discountPercent: Number(document.getElementById('set-discount-percent').value) || 0
    });
    Shared.showToast('Discount code saved');
  });

  document.getElementById('save-password-btn').addEventListener('click', () => {
    const pass = document.getElementById('set-new-password').value;
    const confirm = document.getElementById('set-confirm-password').value;
    if (!pass || pass.length < 4) { Shared.showToast('Password must be at least 4 characters'); return; }
    if (pass !== confirm) { Shared.showToast('Passwords do not match'); return; }
    Store.updateSettings({ adminPassword: pass });
    document.getElementById('set-new-password').value = '';
    document.getElementById('set-confirm-password').value = '';
    Shared.showToast('Admin password updated');
  });

  function renderAll() {
    renderDashboard();
    renderProducts();
    renderOrders();
    renderSettingsForm();
  }

  if (isAuthed()) showApp(); else showLogin();
})();
