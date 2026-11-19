const categories = ['All', 'Tops', 'Bottoms', 'Layers'];
const currency = new Intl.NumberFormat('en-GH', {style:'currency', currency:'GHS'});
const money = cents => currency.format(cents / 100);
const byId = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[char]);
const detail = byId('detail');
const bag = byId('bag');
let products = [];
let orderPhone = '';
let category = 'All';
let search = '';
let sort = 'featured';
let catalogReady = false;
let items = [];
try {
  const saved = JSON.parse(localStorage.getItem('selvedge-bag') || '[]');
  if (Array.isArray(saved)) items = saved.filter(item =>
    typeof item?.sku === 'string' && typeof item.size === 'string' &&
    Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99);
} catch {}
const image = product => `<img src="${escape(product.image)}" alt="${escape(product.name)}" loading="lazy" decoding="async" width="440" height="510">`;

function renderProducts() {
  byId('filters').innerHTML = categories.map(name =>
    `<button type="button" aria-pressed="${name === category}" data-filter="${name}">${name === 'All' ? 'Shop all' : name}</button>`).join('');
  const visible = products.filter(product =>
    (category === 'All' || product.category === category) &&
    [product.name, product.color, product.category].join(' ').toLowerCase().includes(search));
  if (sort === 'price-low') visible.sort((a,b) => a.price - b.price);
  if (sort === 'price-high') visible.sort((a,b) => b.price - a.price);
  byId('results').textContent = visible.length + (visible.length === 1 ? ' piece' : ' pieces');
  byId('clear-search').hidden = !search;
  document.querySelectorAll('.nav [data-filter]').forEach(link => {
    if (link.dataset.filter === category) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  byId('products').innerHTML = visible.map(product =>
    `<article class="product">
      <button class="product-image" type="button" data-product="${escape(product.sku)}" aria-label="Shop ${escape(product.name)}">
        ${image(product)}<span class="plus" aria-hidden="true">+</span>
      </button>
      <div class="product-line"><h3><button class="product-name" data-product="${escape(product.sku)}">${escape(product.name)}</button></h3><span>${money(product.price)}</span></div>
      <p class="product-color">${escape(product.color)}</p>
      <p class="product-sizes">${escape(product.sizes.join(' · '))}</p>
      <button class="choose-size" data-product="${escape(product.sku)}">Choose size</button>
    </article>`).join('') || '<div class="empty-state"><h3>No pieces found</h3><p>Try another name, colour, or category.</p><button class="button" id="reset-filters">Show all pieces</button></div>';
}

function showProduct(product) {
  byId('detail-content').innerHTML = `<div class="dialog-head"><h2>${escape(product.name)}</h2>
    <button class="close" aria-label="Close product details">×</button></div>
    <div class="detail-grid">${image(product)}<div class="detail-info">
    <p class="eyebrow">${escape(product.category)}</p><p class="price">${money(product.price)}</p><p class="detail-color">Colour · ${escape(product.color)}</p>
    <strong>Select size</strong><p id="size-feedback" class="note" aria-live="polite">Choose a size to add this item.</p><div class="sizes" role="group" aria-label="Size">
    ${product.sizes.map(size => `<button aria-pressed="false" data-size="${escape(size)}">${escape(size)}</button>`).join('')}
    </div><button class="button" id="add" disabled>Select a size</button></div></div>`;
  detail.showModal();
  let size;
  detail.querySelectorAll('[data-size]').forEach(button => button.onclick = () => {
    size = button.dataset.size;
    detail.querySelectorAll('[data-size]').forEach(option => option.setAttribute('aria-pressed', option === button));
    byId('add').disabled = false;
    byId('add').textContent = 'Add to bag · ' + money(product.price);
    byId('size-feedback').textContent = 'Size ' + size + ' selected';
  });
  byId('add').onclick = () => {
    const existing = items.find(item => item.sku === product.sku && item.size === size);
    if (existing) existing.quantity = Math.min(existing.quantity + 1, 99);
    else items.push({sku:product.sku,size,quantity:1});
    saveBag();
    detail.close();
    showBag();
  };
}

function saveBag() {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  byId('count').textContent = count;
  byId('mobile-count').textContent = count;
  try { localStorage.setItem('selvedge-bag', JSON.stringify(items)); } catch {}
}

function showBag() {
  if (!catalogReady) {
    byId('bag-content').innerHTML = '<div class="dialog-head"><h2>Your bag</h2><button class="close" aria-label="Close shopping bag">×</button></div><p class="note">Your saved bag will appear when the collection has loaded.</p><button class="text-button continue-shopping">Continue shopping</button>';
    if (!bag.open) bag.showModal();
    return;
  }
  const lines = items.map((item,index) => ({
    ...item,index,product:products.find(product => product.sku === item.sku && product.sizes.includes(item.size))
  }));
  const total = lines.reduce((sum,line) => sum + (line.product?.price || 0) * line.quantity, 0);
  const available = lines.length && lines.every(line => line.product);
  const order = available ? [
    'Hi Selvedge Studio! I’d like to order:',
    ...lines.map(({product,size,quantity}) => `• ${quantity} × ${product.name} (${product.sku}), size ${size} — ${money(product.price * quantity)}`),
    `Subtotal: ${money(total)}`
  ].join('\n') : '';
  byId('bag-content').innerHTML = `<div class="dialog-head"><h2>Your bag</h2>
    <button class="close" aria-label="Close shopping bag">×</button></div>
    ${lines.map(({product,sku,size,quantity,index}) => `<div class="bag-row">
      ${product ? image(product) : ''}<div class="bag-item"><strong>${escape(product?.name || sku)}</strong><small>Size ${escape(size)} ${product ? '' : '· Currently unavailable'}</small><div class="quantity" role="group" aria-label="Quantity for ${escape(product?.name || sku)}"><button data-quantity="${index}" data-change="-1" aria-label="Decrease quantity" ${quantity === 1 ? 'disabled' : ''}>−</button><span>${quantity}</span><button data-quantity="${index}" data-change="1" aria-label="Increase quantity" ${quantity === 99 ? 'disabled' : ''}>+</button></div></div>
      <div class="bag-price">${product ? money(product.price * quantity) : ''} <button class="remove" data-remove="${index}" aria-label="Remove ${escape(product?.name || sku)}, size ${escape(size)}">×</button></div></div>`).join('') || '<div class="empty-state"><h3>A little space for something new.</h3><p>Explore the collection and find your everyday favourites.</p></div><button class="button continue-shopping">Browse the collection</button>'}
    ${lines.length ? `<div class="bag-total" aria-live="polite"><strong>Subtotal</strong><strong>${money(total)}</strong></div>` : ''}
    ${available ? (orderPhone
      ? `<a class="button" href="https://wa.me/${orderPhone}?text=${encodeURIComponent(order)}" target="_blank" rel="noopener">Order on WhatsApp</a><p class="note">Delivery and payment are arranged with the shop on WhatsApp.</p>`
      : `<p class="note">WhatsApp ordering is awaiting the shop’s number. You can copy your order summary below.</p><textarea aria-label="Order summary" class="order" readonly>${escape(order)}</textarea>`)
      : lines.length ? '<p class="note">Remove unavailable items to continue.</p>' : ''}
    ${lines.length ? '<button class="text-button continue-shopping">Continue shopping</button>' : ''}`;
  if (!bag.open) bag.showModal();
}

document.addEventListener('click', event => {
  const control = event.target.closest('[data-filter],[data-product],[data-remove],[data-quantity],.close,.continue-shopping,#reset-filters');
  if (!control) return;
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
    const focused = control.parentElement.id === 'filters';
    category = control.dataset.filter;
    renderProducts();
    if (focused) byId('filters').querySelector('[aria-pressed="true"]').focus();
  }
  if (control.dataset.product) showProduct(products.find(product => product.sku === control.dataset.product));
  if (control.dataset.remove !== undefined) {
    items.splice(Number(control.dataset.remove),1);
    saveBag();
    showBag();
  }
  if (control.dataset.quantity !== undefined) {
    const index = Number(control.dataset.quantity);
    items[index].quantity = Math.max(1, Math.min(99, items[index].quantity + Number(control.dataset.change)));
    saveBag();
    showBag();
    bag.querySelector('[data-quantity="' + index + '"][data-change="' + control.dataset.change + '"]').focus();
  }
  if (control.classList.contains('continue-shopping')) {
    bag.close();
    byId('collection').scrollIntoView({behavior:'smooth'});
  }
  if (control.classList.contains('close')) control.closest('dialog').close();
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
byId('products').textContent = 'Loading collection…';
saveBag();
try {
  const response = await fetch('/api/catalog');
  if (!response.ok) throw new Error('Catalog unavailable');
  ({products,orderPhone} = await response.json());
  catalogReady = true;
  renderProducts();
  if (bag.open) showBag();
} catch {
  byId('products').textContent = 'The collection couldn’t load. Refresh to try again.';
}
