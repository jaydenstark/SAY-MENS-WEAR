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
let items = [];
try {
  const saved = JSON.parse(localStorage.getItem('selvedge-bag') || '[]');
  if (Array.isArray(saved)) items = saved.filter(item =>
    typeof item?.sku === 'string' && typeof item.size === 'string' &&
    Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99);
} catch {}
const image = product => `<img src="${escape(product.image)}" alt="${escape(product.name)}">`;

function renderProducts() {
  byId('filters').innerHTML = categories.map(name =>
    `<button type="button" aria-pressed="${name === category}" data-filter="${name}">${name === 'All' ? 'Shop all' : name}</button>`).join('');
  const visible = products.filter(product => category === 'All' || product.category === category);
  byId('products').innerHTML = visible.map(product =>
    `<article class="product">
      <button class="product-image" type="button" data-product="${escape(product.sku)}" aria-label="Shop ${escape(product.name)}">
        ${image(product)}<span class="plus" aria-hidden="true">+</span>
      </button>
      <div class="product-line"><h3>${escape(product.name)}</h3><span>${money(product.price)}</span></div>
      <p>${escape(product.color)} · ${escape(product.sizes.join(' / '))}</p>
    </article>`).join('') || '<p>No pieces in this category yet.</p>';
}

function showProduct(product) {
  byId('detail-content').innerHTML = `<div class="dialog-head"><h2>${escape(product.name)}</h2>
    <button class="close" aria-label="Close product details">×</button></div>
    <div class="detail-grid">${image(product)}<div>
    <p class="price">${money(product.price)}</p><p>${escape(product.color)}</p>
    <strong>Select size</strong><div class="sizes" role="group" aria-label="Size">
    ${product.sizes.map(size => `<button aria-pressed="false" data-size="${escape(size)}">${escape(size)}</button>`).join('')}
    </div><button class="button" id="add" disabled>Add to bag</button></div></div>`;
  detail.showModal();
  let size;
  detail.querySelectorAll('[data-size]').forEach(button => button.onclick = () => {
    size = button.dataset.size;
    detail.querySelectorAll('[data-size]').forEach(option => option.setAttribute('aria-pressed', option === button));
    byId('add').disabled = false;
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
  byId('count').textContent = items.reduce((sum, item) => sum + item.quantity, 0);
  try { localStorage.setItem('selvedge-bag', JSON.stringify(items)); } catch {}
}

function showBag() {
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
      <div><strong>${escape(product?.name || sku)}</strong><small>${escape(size)} · Qty ${quantity} ${product ? '' : '· Currently unavailable'}</small></div>
      <div>${product ? money(product.price * quantity) : ''} <button class="remove" data-remove="${index}" aria-label="Remove ${escape(product?.name || sku)}, size ${escape(size)}">×</button></div></div>`).join('') || '<p>Your bag is empty.</p>'}
    ${lines.length ? `<div class="bag-total"><strong>Subtotal</strong><strong>${money(total)}</strong></div>` : ''}
    ${available ? (orderPhone
      ? `<a class="button" href="https://wa.me/${orderPhone}?text=${encodeURIComponent(order)}" target="_blank" rel="noopener">Order on WhatsApp ↗</a><p class="note">Confirm availability, delivery and payment with the shop in WhatsApp.</p>`
      : `<p class="note">WhatsApp ordering is awaiting the shop’s number. You can copy your order summary below.</p><textarea aria-label="Order summary" class="order" readonly>${escape(order)}</textarea>`)
      : lines.length ? '<p class="note">Remove unavailable items to continue.</p>' : ''}`;
  if (!bag.open) bag.showModal();
}

document.addEventListener('click', event => {
  const control = event.target.closest('[data-filter],[data-product],[data-remove],.close');
  if (!control) return;
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
  if (control.classList.contains('close')) control.closest('dialog').close();
});
byId('open-bag').onclick = showBag;
byId('products').textContent = 'Loading collection…';
saveBag();
try {
  const response = await fetch('/api/catalog');
  if (!response.ok) throw new Error('Catalog unavailable');
  ({products,orderPhone} = await response.json());
  renderProducts();
  if (bag.open) showBag();
} catch {
  byId('products').textContent = 'The collection couldn’t load. Refresh to try again.';
}
