(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const cartLayout = document.getElementById('cart-layout');
  const cartEmpty = document.getElementById('cart-empty');
  const cartItemsEl = document.getElementById('cart-items');
  const discountInput = document.getElementById('discount-input');
  const discountMsg = document.getElementById('discount-msg');
  const discountLine = document.getElementById('discount-line');
  const checkoutForm = document.getElementById('checkout-form');

  let appliedDiscount = 0;

  function getTotals() {
    const items = Store.getCartWithDetails();
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discountAmount = Math.round(subtotal * (appliedDiscount / 100));
    const total = subtotal - discountAmount;
    return { items, subtotal, discountAmount, total };
  }

  function render() {
    const { items, subtotal, discountAmount, total } = getTotals();
    Shared.refreshCartBadge();

    if (items.length === 0) {
      cartEmpty.hidden = false;
      cartLayout.style.display = 'none';
      return;
    }
    cartEmpty.hidden = true;
    cartLayout.style.display = 'grid';

    cartItemsEl.innerHTML = items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="thumb" style="background:${Shared.accentVar(item.accent)}18; color:${Shared.accentVar(item.accent)};">
          ${Shared.swatchInner(item)}
        </div>
        <div>
          <h4>${item.name}</h4>
          <span class="cat">${item.category}</span>
          <div class="qty-stepper" style="margin-top:0.5rem;">
            <button data-dec="${item.id}" aria-label="Decrease quantity">–</button>
            <span>${item.quantity}</span>
            <button data-inc="${item.id}" aria-label="Increase quantity" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
          </div>
        </div>
        <div class="line-total">${Store.formatPrice(item.price * item.quantity)}</div>
        <button class="remove-btn" data-remove="${item.id}">Remove</button>
      </div>
    `).join('');

    document.getElementById('sum-subtotal').textContent = Store.formatPrice(subtotal);
    document.getElementById('sum-total').textContent = Store.formatPrice(total);
    if (discountAmount > 0) {
      discountLine.style.display = 'flex';
      document.getElementById('sum-discount').textContent = '–' + Store.formatPrice(discountAmount);
    } else {
      discountLine.style.display = 'none';
    }
  }

  cartItemsEl.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    const rem = e.target.closest('[data-remove]');
    if (inc) {
      const id = Number(inc.dataset.inc);
      const item = Store.getCartWithDetails().find(i => i.id === id);
      Store.updateCartQuantity(id, item.quantity + 1);
      render();
    } else if (dec) {
      const id = Number(dec.dataset.dec);
      const item = Store.getCartWithDetails().find(i => i.id === id);
      Store.updateCartQuantity(id, item.quantity - 1);
      render();
    } else if (rem) {
      Store.removeFromCart(Number(rem.dataset.remove));
      Shared.showToast('Removed from cart');
      render();
    }
  });

  document.getElementById('apply-discount').addEventListener('click', () => {
    const settings = Store.getSettings();
    const code = discountInput.value.trim().toUpperCase();
    if (code === settings.discountCode.toUpperCase()) {
      appliedDiscount = settings.discountPercent;
      discountMsg.style.color = 'var(--lime)';
      discountMsg.textContent = `${settings.discountPercent}% off applied ✓`;
    } else {
      appliedDiscount = 0;
      discountMsg.style.color = 'var(--pink)';
      discountMsg.textContent = 'Invalid code';
    }
    render();
  });

  function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { items, total } = getTotals();
    if (items.length === 0) return;

    const settings = Store.getSettings();
    const customer = {
      name: document.getElementById('cust-name').value.trim(),
      email: document.getElementById('cust-email').value.trim(),
      phone: document.getElementById('cust-phone').value.trim(),
      address: document.getElementById('cust-address').value.trim()
    };

    const orderItems = items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity }));
    const btn = document.getElementById('checkout-btn');
    btn.disabled = true;
    btn.textContent = 'Processing…';

    function finalizeOrder(status, paymentId) {
      Store.addOrder({
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress: customer.address,
        items: orderItems,
        totalAmount: total,
        status: status,
        paymentId: paymentId || null
      });
      Store.clearCart();
      Shared.refreshCartBadge();
      btn.disabled = false;
      btn.textContent = 'Checkout & pay';
      window.location.href = `order-confirmed.html?status=${status}`;
    }

    if (!settings.razorpayKeyId) {
      // Demo mode — no live key configured yet
      Shared.showToast('Demo checkout — add a Razorpay key in Admin → Settings to go live');
      setTimeout(() => finalizeOrder('demo'), 700);
      return;
    }

    try {
      await loadRazorpayScript();
      const rzp = new window.Razorpay({
        key: settings.razorpayKeyId,
        amount: Math.round(total * 100),
        currency: 'INR',
        name: settings.storeName,
        description: `${items.length} item(s)`,
        prefill: { name: customer.name, email: customer.email, contact: customer.phone },
        handler: function (response) {
          finalizeOrder('paid', response.razorpay_payment_id);
        },
        modal: {
          ondismiss: function () {
            btn.disabled = false;
            btn.textContent = 'Checkout & pay';
          }
        }
      });
      rzp.open();
    } catch (err) {
      Shared.showToast('Payment gateway failed to load — try again');
      btn.disabled = false;
      btn.textContent = 'Checkout & pay';
    }
  });

  render();
})();
