/**
 * GENZ store — data layer
 * Everything lives in localStorage for now (zero backend, works on GitHub Pages
 * immediately). Every read/write goes through the functions below, so when
 * you're ready to move to Supabase later, you only need to rewrite this file —
 * every page.js file just calls Store.getProducts(), Store.addOrder(), etc.
 */
(function (global) {
  const KEY = 'genz_store_v1';

  const DEFAULT_SETTINGS = {
    storeName: 'GENZ',
    tagline: 'Wear what\'s next',
    whatsappNumber: '917030827708',
    razorpayKeyId: '',
    adminPassword: 'admin123',
    discountCode: 'GENZ10',
    discountPercent: 10,
    currency: 'INR'
  };

  const CATEGORIES = ['Tees', 'Hoodies', 'Outerwear', 'Bottoms', 'Accessories', 'Footwear'];

  const DEFAULT_PRODUCTS = [
    { id: 1, name: 'Static Tee', category: 'Tees', price: 799, stock: 25, icon: 'tee', accent: 'pink', description: 'Heavyweight cotton tee with a cracked static print. Boxy fit, dropped shoulder.' },
    { id: 2, name: 'Frame Crop Top', category: 'Tees', price: 899, stock: 18, icon: 'tee', accent: 'lime', description: 'Cropped fit tee with a raw-edge hem. Runs true to size.' },
    { id: 3, name: 'Riot Hoodie', category: 'Hoodies', price: 1899, stock: 14, icon: 'hoodie', accent: 'violet', description: 'Oversized fleece hoodie, brushed interior, kangaroo pocket.' },
    { id: 4, name: 'Low-Fi Hoodie', category: 'Hoodies', price: 1999, stock: 9, icon: 'hoodie', accent: 'cyan', description: 'Cropped hoodie with contrast drawstrings and ribbed cuffs.' },
    { id: 5, name: 'Glitch Bomber Jacket', category: 'Outerwear', price: 2999, stock: 7, icon: 'jacket', accent: 'cyan', description: 'Water-resistant shell, ribbed collar, interior zip pocket.' },
    { id: 6, name: 'Voltage Denim Jacket', category: 'Outerwear', price: 2499, stock: 11, icon: 'jacket', accent: 'pink', description: 'Washed denim jacket with contrast stitching. Unisex fit.' },
    { id: 7, name: 'Chrome Cargo Pants', category: 'Bottoms', price: 1699, stock: 20, icon: 'pants', accent: 'lime', description: 'Multi-pocket cargo pants in ripstop fabric. Adjustable hem.' },
    { id: 8, name: 'Drift Joggers', category: 'Bottoms', price: 1499, stock: 3, icon: 'pants', accent: 'violet', description: 'Tapered joggers in brushed fleece. Elastic waist with drawcord.' },
    { id: 9, name: 'Static Bucket Hat', category: 'Accessories', price: 599, stock: 30, icon: 'cap', accent: 'pink', description: 'Reversible bucket hat, two looks in one.' },
    { id: 10, name: 'Overload Tote', category: 'Accessories', price: 499, stock: 0, icon: 'bag', accent: 'cyan', description: 'Oversized canvas tote, holds everything you own.' },
    { id: 11, name: 'Reflex Sneakers', category: 'Footwear', price: 3499, stock: 6, icon: 'shoe', accent: 'violet', description: 'Chunky-sole sneakers with reflective panelling.' },
    { id: 12, name: 'Volt Slides', category: 'Footwear', price: 899, stock: 22, icon: 'shoe', accent: 'lime', description: 'Cushioned slides for off-duty days.' }
  ];

  function readAll() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seedAndSave();
      const data = JSON.parse(raw);
      // backfill any keys added in later versions
      data.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings || {});
      if (!Array.isArray(data.products)) data.products = DEFAULT_PRODUCTS;
      if (!Array.isArray(data.orders)) data.orders = [];
      return data;
    } catch (e) {
      return seedAndSave();
    }
  }

  function seedAndSave() {
    const data = { products: DEFAULT_PRODUCTS, orders: [], settings: DEFAULT_SETTINGS };
    writeAll(data);
    return data;
  }

  function writeAll(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function nextId(list) {
    return list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  // ---- Products ----
  function getProducts() { return readAll().products; }
  function getProduct(id) { return readAll().products.find(p => p.id === Number(id)); }
  function addProduct(product) {
    const data = readAll();
    const record = Object.assign({ id: nextId(data.products) }, product);
    data.products.push(record);
    writeAll(data);
    return record;
  }
  function updateProduct(id, patch) {
    const data = readAll();
    data.products = data.products.map(p => p.id === Number(id) ? Object.assign({}, p, patch) : p);
    writeAll(data);
  }
  function deleteProduct(id) {
    const data = readAll();
    data.products = data.products.filter(p => p.id !== Number(id));
    writeAll(data);
  }
  function decrementStock(items) {
    const data = readAll();
    items.forEach(item => {
      const p = data.products.find(p => p.id === item.id);
      if (p) p.stock = Math.max(0, p.stock - item.quantity);
    });
    writeAll(data);
  }

  // ---- Settings ----
  function getSettings() { return readAll().settings; }
  function updateSettings(patch) {
    const data = readAll();
    data.settings = Object.assign({}, data.settings, patch);
    writeAll(data);
    return data.settings;
  }

  // ---- Orders ----
  function getOrders() { return readAll().orders.slice().reverse(); }
  function addOrder(order) {
    const data = readAll();
    const record = Object.assign({
      id: nextId(data.orders.length ? data.orders : [{ id: 1000 }]),
      orderNumber: 'GZ' + Date.now().toString().slice(-8),
      createdAt: new Date().toISOString()
    }, order);
    data.orders.push(record);
    writeAll(data);
    decrementStock(order.items);
    return record;
  }
  function updateOrderStatus(id, status) {
    const data = readAll();
    data.orders = data.orders.map(o => o.id === Number(id) ? Object.assign({}, o, { status }) : o);
    writeAll(data);
  }

  // ---- Cart (separate key so it persists independent of admin data resets) ----
  const CART_KEY = 'genz_cart_v1';
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  function addToCart(productId, quantity) {
    quantity = quantity || 1;
    const cart = getCart();
    const existing = cart.find(i => i.id === productId);
    const product = getProduct(productId);
    if (!product) return cart;
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, product.stock);
    } else {
      cart.push({ id: productId, quantity: Math.min(quantity, product.stock) });
    }
    saveCart(cart);
    return cart;
  }
  function updateCartQuantity(productId, quantity) {
    let cart = getCart();
    if (quantity <= 0) {
      cart = cart.filter(i => i.id !== productId);
    } else {
      cart = cart.map(i => i.id === productId ? Object.assign({}, i, { quantity }) : i);
    }
    saveCart(cart);
    return cart;
  }
  function removeFromCart(productId) {
    const cart = getCart().filter(i => i.id !== productId);
    saveCart(cart);
    return cart;
  }
  function clearCart() { saveCart([]); }
  function getCartWithDetails() {
    return getCart().map(item => {
      const product = getProduct(item.id);
      return product ? Object.assign({}, product, { quantity: item.quantity }) : null;
    }).filter(Boolean);
  }
  function getCartCount() {
    return getCart().reduce((sum, i) => sum + i.quantity, 0);
  }

  function formatPrice(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN');
  }

  global.Store = {
    CATEGORIES,
    getProducts, getProduct, addProduct, updateProduct, deleteProduct,
    getSettings, updateSettings,
    getOrders, addOrder, updateOrderStatus,
    getCart, addToCart, updateCartQuantity, removeFromCart, clearCart,
    getCartWithDetails, getCartCount,
    formatPrice
  };
})(window);
