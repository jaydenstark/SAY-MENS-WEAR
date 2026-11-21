const categories = ['All', 'Caftans', 'Sets', 'Shirts'];
const currency = new Intl.NumberFormat('en-GH', {style:'currency', currency:'GHS'});
const money = cents => Number.isInteger(cents) ? currency.format(cents / 100) : 'Price on enquiry';
const byId = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[char]);

const detail = byId('detail');
const bag = byId('bag');
let products = [];
let orderPhone = '233279587605'; // Default Say Menswear WhatsApp Business line
let category = 'All';
let search = '';
let sort = 'featured';
let catalogReady = false;
let items = [];

try {
  const saved = JSON.parse(localStorage.getItem('say-bag') || localStorage.getItem('selvedge-bag') || '[]');
  if (Array.isArray(saved)) items = saved.filter(item =>
    typeof item?.sku === 'string' && typeof item.size === 'string' &&
    Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99);
} catch {}

const waIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" style="flex-shrink:0"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.586-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.057-2.09-.519-1.636-.677-2.73-2.327-2.812-2.436-.081-.109-.668-.888-.668-1.696 0-.808.423-1.205.574-1.368.151-.163.33-.204.44-.204.11 0 .22.002.316.006.101.004.237-.038.371.285.143.344.49 1.196.533 1.284.043.088.072.19.014.305-.058.115-.088.187-.175.289-.088.102-.185.228-.264.307-.088.088-.18.183-.077.36.103.176.458.756.983 1.224.676.602 1.246.788 1.423.876.176.088.279.073.382-.045.103-.118.441-.513.559-.689.117-.176.235-.147.397-.088.162.059 1.029.485 1.205.573.176.088.294.132.338.206.044.074.044.426-.1 1.224zm-3.392-10.416c5.523 0 10 4.477 10 10s-4.477 10-10 10c-1.704 0-3.308-.426-4.713-1.176L2 25l1.205-4.401A9.957 9.957 0 012.031 14c0-5.523 4.477-10 10-10z"/></svg>`;

const image = product => `<img src="${escape(product.image)}" alt="${escape(product.name)}" loading="lazy" decoding="async" width="440" height="550">`;

function gallery(product) {
  const views = product.images || [product.image];
  return `<div class="product-gallery">
    <img id="gallery-main" class="gallery-main" src="${escape(product.image)}" alt="${escape(product.name)}" width="600" height="750">
    ${views.length > 1 ? `<div class="gallery-thumbs" role="group" aria-label="Product photos">${views.map((src,index) =>
      `<button data-view="${index}" data-gallery="${escape(product.sku)}" aria-label="View photo ${index + 1}" aria-pressed="${index === 0}">
        <img src="${escape(src)}" alt="" width="60" height="75" loading="lazy">
      </button>`).join('')}</div>` : ''}
  </div>`;
}

function renderProducts() {
  byId('filters').innerHTML = categories.map(name =>
    `<button type="button" aria-pressed="${name === category}" data-filter="${name}">${name === 'All' ? 'All Pieces' : name}</button>`).join('');

  const visible = products.filter(product =>
    (category === 'All' || product.category === category) &&
    [product.name, product.color, product.category, product.sku].join(' ').toLowerCase().includes(search));

  if (sort === 'price-low') visible.sort((a,b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  if (sort === 'price-high') visible.sort((a,b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));

  byId('results').textContent = `Showing ${visible.length} ${visible.length === 1 ? 'handcrafted piece' : 'handcrafted pieces'}`;
  byId('clear-search').hidden = !search;

  document.querySelectorAll('.nav [data-filter]').forEach(link => {
    if (link.dataset.filter === category) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });

  byId('products').innerHTML = visible.map(product =>
    `<article class="product">
      <button class="product-image" type="button" data-product="${escape(product.sku)}" aria-label="View details for ${escape(product.name)}">
        <span class="product-badge">${escape(product.category)}</span>
        ${image(product)}
        <span class="product-action-badge" aria-hidden="true">+</span>
      </button>
      <div class="product-line">
        <h3><button class="product-name" data-product="${escape(product.sku)}">${escape(product.name)}</button></h3>
        <span class="product-price ${Number.isInteger(product.price) ? '' : 'enquiry'}">${money(product.price)}</span>
      </div>
      <div class="product-meta">
        <span>${escape(product.color)}</span>
        <span class="dot" aria-hidden="true">·</span>
        <span>${product.sizes.length ? escape(product.sizes.join(', ')) : 'Bespoke measurements'}</span>
      </div>
      <button class="choose-size" data-product="${escape(product.sku)}">
        ${Number.isInteger(product.price) ? 'Select Size' : 'Enquire on WhatsApp'}
      </button>
    </article>`).join('') ||
    `<div class="empty-state">
      <h3>No matching designs</h3>
      <p>Try searching for a different colour, style (e.g. Caftan, Agbada, Shirt), or clear filters.</p>
      <button class="button button-primary" id="reset-filters">View All Pieces</button>
    </div>`;
}

function showProduct(product) {
  if (!Number.isInteger(product.price) || !product.sizes.length) {
    const enquiry = encodeURIComponent(`Hello Say Menswear! I am interested in ${product.name} (${product.sku}) in ${product.color}. Please let me know pricing, sizing and bespoke tailoring availability.`);
    byId('detail-content').innerHTML = `
      <div class="drawer-handle" aria-hidden="true"></div>
      <div class="dialog-head">
        <h2>${escape(product.name)}</h2>
        <button class="close" aria-label="Close product details">×</button>
      </div>
      <div class="detail-grid">
        ${gallery(product)}
        <div class="detail-info">
          <p class="eyebrow">${escape(product.category)} · TEMA BESPOKE</p>
          <p class="price">Price on Enquiry</p>
          <p class="detail-color">Colour: <strong>${escape(product.color)}</strong></p>
          <p class="note">Each piece is individually tailored to your precise measurements using premium fabric. Contact our studio to confirm availability and discuss custom fitting.</p>
          <div style="margin-top: 24px;">
            <a class="button button-wa" href="https://wa.me/${orderPhone}?text=${enquiry}" target="_blank" rel="noopener">
              ${waIcon}
              <span>Enquire on WhatsApp</span>
            </a>
          </div>
          <p class="note" style="margin-top: 16px; font-size: 0.8125rem;">Or call our studio directly at <a href="tel:+233279587605" style="text-decoration: underline; font-weight: 600;">+233 27 958 7605</a>.</p>
        </div>
      </div>`;
    detail.showModal();
    return;
  }

  byId('detail-content').innerHTML = `
    <div class="drawer-handle" aria-hidden="true"></div>
    <div class="dialog-head">
      <h2>${escape(product.name)}</h2>
      <button class="close" aria-label="Close product details">×</button>
    </div>
    <div class="detail-grid">
      ${gallery(product)}
      <div class="detail-info">
        <p class="eyebrow">${escape(product.category)} · READY TO WEAR</p>
        <p class="price">${money(product.price)}</p>
        <p class="detail-color">Colour: <strong>${escape(product.color)}</strong></p>
        <strong>Select Size</strong>
        <p id="size-feedback" class="note" aria-live="polite">Choose your fit below to add to bag.</p>
        <div class="sizes" role="group" aria-label="Available Sizes">
          ${product.sizes.map(size => `<button type="button" aria-pressed="false" data-size="${escape(size)}">${escape(size)}</button>`).join('')}
        </div>
        <button class="button button-primary" id="add" disabled>Select a Size</button>
        <p class="note" style="margin-top: 20px; font-size: 0.8125rem;">
          ✨ Handcrafted in Tema Community 8. Doorstep delivery across Ghana & worldwide shipping available.
        </p>
      </div>
    </div>`;
  detail.showModal();

  let selectedSize;
  detail.querySelectorAll('[data-size]').forEach(button => {
    button.onclick = () => {
      selectedSize = button.dataset.size;
      detail.querySelectorAll('[data-size]').forEach(option => option.setAttribute('aria-pressed', option === button));
      byId('add').disabled = false;
      byId('add').textContent = `Add to Bag · ${money(product.price)}`;
      byId('size-feedback').textContent = `Size ${selectedSize} selected`;
    };
  });

  byId('add').onclick = () => {
    const existing = items.find(item => item.sku === product.sku && item.size === selectedSize);
    if (existing) existing.quantity = Math.min(existing.quantity + 1, 99);
    else items.push({sku:product.sku, size:selectedSize, quantity:1});
    saveBag();
    detail.close();
    showBag();
  };
}

function saveBag() {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  byId('count').textContent = count;
  byId('mobile-count').textContent = count;
  try {
    localStorage.setItem('say-bag', JSON.stringify(items));
  } catch {}
}

function showBag() {
  if (!catalogReady) {
    byId('bag-content').innerHTML = `
      <div class="drawer-handle" aria-hidden="true"></div>
      <div class="dialog-head">
        <h2>Shopping Bag</h2>
        <button class="close" aria-label="Close shopping bag">×</button>
      </div>
      <div style="padding: 24px 0;">
        <p class="note">Your saved bag is loading…</p>
        <button class="text-button continue-shopping">Continue shopping</button>
      </div>`;
    if (!bag.open) bag.showModal();
    return;
  }

  const lines = items.map((item,index) => ({
    ...item,
    index,
    product: products.find(product => product.sku === item.sku && Number.isInteger(product.price) && product.sizes.includes(item.size))
  }));

  const total = lines.reduce((sum,line) => sum + (line.product?.price || 0) * line.quantity, 0);
  const available = lines.length && lines.every(line => line.product);

  const orderLines = available ? [
    'Hello Say Menswear! I would like to place an order:',
    ...lines.map(({product,size,quantity}) => `• ${quantity} × ${product.name} (${product.sku}), Size: ${size} — ${money(product.price * quantity)}`),
    `\nTotal Subtotal: ${money(total)}`,
    '\nPlease confirm availability and delivery arrangements.'
  ].join('\n') : '';

  byId('bag-content').innerHTML = `
    <div class="drawer-handle" aria-hidden="true"></div>
    <div class="dialog-head">
      <h2>Your Bag (${items.reduce((sum, item) => sum + item.quantity, 0)})</h2>
      <button class="close" aria-label="Close shopping bag">×</button>
    </div>
    
    <div class="bag-items-list">
      ${lines.map(({product,sku,size,quantity,index}) => `
        <div class="bag-row">
          ${product ? image(product) : '<div style="background:#e4dfd7;width:76px;height:95px;border-radius:6px;"></div>'}
          <div class="bag-item">
            <strong>${escape(product?.name || sku)}</strong>
            <small>Size: ${escape(size)} ${product ? '' : '· Currently unavailable'}</small>
            <div class="quantity" role="group" aria-label="Quantity for ${escape(product?.name || sku)}">
              <button data-quantity="${index}" data-change="-1" aria-label="Decrease quantity" ${quantity === 1 ? 'disabled' : ''}>−</button>
              <span>${quantity}</span>
              <button data-quantity="${index}" data-change="1" aria-label="Increase quantity" ${quantity === 99 ? 'disabled' : ''}>+</button>
            </div>
          </div>
          <div class="bag-price">
            <span>${product ? money(product.price * quantity) : ''}</span>
            <button class="remove" data-remove="${index}" aria-label="Remove item">×</button>
          </div>
        </div>
      `).join('') || `
        <div class="empty-state" style="margin-top: 24px;">
          <h3>Your bag is empty</h3>
          <p>Discover our bespoke and ready-to-wear caftans and occasion wear.</p>
          <button class="button button-primary continue-shopping">Explore the Collection</button>
        </div>
      `}
    </div>

    ${lines.length ? `
      <div class="bag-footer">
        <div class="bag-total" aria-live="polite">
          <span>Subtotal</span>
          <strong>${money(total)}</strong>
        </div>
        ${available ? `
          <a class="button button-wa" style="width: 100%;" href="https://wa.me/${orderPhone}?text=${encodeURIComponent(orderLines)}" target="_blank" rel="noopener">
            ${waIcon}
            <span>Complete Order on WhatsApp</span>
          </a>
          <p class="note" style="text-align: center; margin-top: 12px; font-size: 0.8125rem;">
            Direct order with our tailor in Community 8. Delivery and payment details confirmed on WhatsApp.
          </p>
        ` : `
          <p class="note" style="color: #c94a29;">Please remove unavailable items before placing order.</p>
        `}
        <button class="text-button continue-shopping" style="margin-top: 8px;">Continue Shopping</button>
      </div>
    ` : ''}`;

  if (!bag.open) bag.showModal();
}

// Click and Backdrop Handling
[detail, bag].forEach(dialog => {
  dialog.addEventListener('click', event => {
    // If clicked directly on the dialog element outside its contents, close it
    if (event.target === dialog) dialog.close();
  });
});

document.addEventListener('click', event => {
  const control = event.target.closest('[data-filter],[data-product],[data-remove],[data-quantity],.close,.continue-shopping,#reset-filters,[data-view],#tab-search,#tab-collection,#tab-bespoke');
  if (!control) return;

  if (control.id === 'tab-search') {
    const searchField = byId('search');
    byId('collection').scrollIntoView({behavior:'smooth'});
    setTimeout(() => searchField.focus(), 300);
    return;
  }

  if (control.id === 'tab-collection') {
    byId('collection').scrollIntoView({behavior:'smooth'});
    return;
  }

  if (control.id === 'tab-bespoke') {
    byId('bespoke').scrollIntoView({behavior:'smooth'});
    return;
  }

  if (control.dataset.view !== undefined) {
    const product = products.find(product => product.sku === control.dataset.gallery);
    byId('gallery-main').src = product.images[Number(control.dataset.view)];
    detail.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', button === control));
  }

  if (control.id === 'reset-filters') {
    category = 'All';
    search = '';
    sort = 'featured';
    byId('search').value = '';
    byId('sort').value = 'featured';
    renderProducts();
    byId('search').focus();
  }

  if (control.dataset.filter) {
    category = control.dataset.filter;
    renderProducts();
    const filterBtn = byId('filters').querySelector(`[data-filter="${category}"]`);
    if (filterBtn) filterBtn.focus();
  }

  if (control.dataset.product) {
    showProduct(products.find(product => product.sku === control.dataset.product));
  }

  if (control.dataset.remove !== undefined) {
    items.splice(Number(control.dataset.remove), 1);
    saveBag();
    showBag();
  }

  if (control.dataset.quantity !== undefined) {
    const index = Number(control.dataset.quantity);
    items[index].quantity = Math.max(1, Math.min(99, items[index].quantity + Number(control.dataset.change)));
    saveBag();
    showBag();
  }

  if (control.classList.contains('continue-shopping')) {
    bag.close();
    byId('collection').scrollIntoView({behavior:'smooth'});
  }

  if (control.classList.contains('close')) {
    control.closest('dialog').close();
  }
});

byId('search').addEventListener('input', event => {
  search = event.target.value.trim().toLowerCase();
  renderProducts();
});

byId('clear-search').onclick = () => {
  byId('search').value = '';
  search = '';
  renderProducts();
  byId('search').focus();
};

byId('sort').addEventListener('change', event => {
  sort = event.target.value;
  renderProducts();
});

byId('open-bag').onclick = showBag;
byId('mobile-bag').onclick = showBag;

saveBag();

try {
  const response = await fetch('/api/catalog');
  if (!response.ok) throw new Error('Catalog unavailable');
  const data = await response.json();
  products = data.products || [];
  if (data.orderPhone) orderPhone = data.orderPhone;
  catalogReady = true;
  renderProducts();
  if (bag.open) showBag();
} catch {
  byId('products').innerHTML = `
    <div class="empty-state">
      <h3>The collection couldn’t load</h3>
      <p>Please check your connection and refresh.</p>
      <button class="button button-primary" onclick="window.location.reload()">Refresh Page</button>
    </div>`;
}
