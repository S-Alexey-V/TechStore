import { PRODUCTS, getProductById, uniqueCategories } from './products.js';
import {
    loadCart,
    getTotalCount,
    setItemQuantity,
    removeItem,
    setPromo,
    clearPromo,
} from './cartStore.js';
const main = document.getElementById('main');
const badge = document.getElementById('cart-badge');
function formatPrice(n) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
}
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function starsHtmlFixed(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    let s = '<span class="stars">';
    for (let i = 0; i < full; i += 1) s += '<span class="star star--full">★</span>';
    if (half) s += '<span class="star star--half">★</span>';
    for (let i = 0; i < empty; i += 1) s += '<span class="star star--empty">★</span>';
    s += '</span>';
    return s;
}
function updateBadge() {
    if (!badge) return;
    const { items } = loadCart();
    const count = getTotalCount(items);
    if (count > 0) {
        badge.hidden = false;
        badge.textContent = String(count);
    } else {
        badge.hidden = true;
        badge.textContent = '0';
    }
}

document.addEventListener('click', (e) => {
    if (e.target.closest('[data-link]')) queueMicrotask(updateBadge);
});

let catalogState = {
    sort: 'name-asc',
    priceMin: '0',
    priceMax: '3000',
    ratingChecks: [],
    categoryChecks: [],
};

function passesRatingFilter(p) {
    if (catalogState.ratingChecks.length === 0) return true;
    return catalogState.ratingChecks.some((g) => p.rating >= Number(g));
}

function passesCategoryFilter(p) {
    if (catalogState.categoryChecks.length === 0) return true;
    return catalogState.categoryChecks.includes(p.category);
}

function applyCatalogFilters(list) {
    const minP = Number(catalogState.priceMin);
    const maxP = Number(catalogState.priceMax);
    let out = list.filter((p) => {
        if (!Number.isNaN(minP) && p.price < minP) return false;
        if (!Number.isNaN(maxP) && p.price > maxP) return false;
        if (!passesRatingFilter(p)) return false;
        if (!passesCategoryFilter(p)) return false;
        return true;
    });

    const s = catalogState.sort;
    if (s === 'name-asc') out.sort((a, b) => a.name.localeCompare(b.name));
    if (s === 'name-desc') out.sort((a, b) => b.name.localeCompare(a.name));
    if (s === 'price-low') out.sort((a, b) => a.price - b.price);
    if (s === 'price-high') out.sort((a, b) => b.price - a.price);
    return out;
}

function cardHtml(p, inCartQty) {
    const pid = String(p.id);
    return `
    <article class="ts-card">
      <a href="#/product/${pid}" class="ts-card__media" data-product-link="${pid}">
        <img src="${p.image}" alt="" loading="lazy" width="400" height="400" />
      </a>
      <div class="ts-card__body">
        <a href="#/product/${pid}" class="ts-card__title" data-product-link="${pid}">${escapeHtml(p.name)}</a>
        <div class="ts-card__rating">${starsHtmlFixed(p.rating)} <span class="rating-num">(${p.rating})</span></div>
        <div class="ts-card__row">
          <span class="ts-price">${formatPrice(p.price)}</span>
          <span class="ts-cat">${escapeHtml(p.category)}</span>
        </div>
        <button type="button" class="btn btn-cart" data-add-cart="${pid}">Add to cart</button>
        ${inCartQty > 0 ? `<p class="in-cart-hint">In cart: ${inCartQty}</p>` : ''}
      </div>
    </article>
  `;
}

function filterSidebarHtml() {
    const cats = uniqueCategories();
    return `
    <div class="filter-block">
      <h3 class="filter-title">Category</h3>
      <div class="filter-stack">
        ${cats
        .map(
            (c) => `
          <label class="check-row">
            <input type="checkbox" name="cat" value="${escapeHtml(c)}" ${catalogState.categoryChecks.includes(c) ? 'checked' : ''} />
            <span>${escapeHtml(c)}</span>
          </label>`
        )
        .join('')}
      </div>
    </div>
    <div class="filter-block">
      <h3 class="filter-title">Rating</h3>
      <div class="filter-stack">
        ${[5, 4, 3]
        .map(
            (u) => `
          <label class="check-row">
            <input type="checkbox" name="rating" value="${u}" ${catalogState.ratingChecks.includes(String(u)) ? 'checked' : ''} />
            <span>${u}+ Stars</span>
          </label>`
        )
        .join('')}
      </div>
    </div>
    <div class="filter-block">
      <h3 class="filter-title">Price range</h3>
      <div class="price-inputs">
        <label class="filter-field"><span class="filter-label">Min</span>
          <input type="number" class="input input--sm" id="flt-min" min="0" step="10" value="${catalogState.priceMin}" />
        </label>
        <label class="filter-field"><span class="filter-label">Max</span>
          <input type="number" class="input input--sm" id="flt-max" min="0" step="10" value="${catalogState.priceMax}" />
        </label>
      </div>
    </div>
    <button type="button" class="btn btn-outline btn-block" id="flt-clear">Clear all filters</button>
  `;
}

function wireFilterSidebar() {
    const reRender = () => renderCatalog();

    main.querySelectorAll('input[name="cat"]').forEach((el) => {
        el.addEventListener('change', () => {
            catalogState.categoryChecks = [...main.querySelectorAll('input[name="cat"]:checked')].map((x) => x.value);
            reRender();
        });
    });
    main.querySelectorAll('input[name="rating"]').forEach((el) => {
        el.addEventListener('change', () => {
            catalogState.ratingChecks = [...main.querySelectorAll('input[name="rating"]:checked')].map((x) => x.value);
            reRender();
        });
    });

    const minEl = document.getElementById('flt-min');
    const maxEl = document.getElementById('flt-max');
    if (minEl) {
        minEl.addEventListener('change', () => {
            catalogState.priceMin = minEl.value;
            reRender();
        });
    }
    if (maxEl) {
        maxEl.addEventListener('change', () => {
            catalogState.priceMax = maxEl.value;
            reRender();
        });
    }

    document.getElementById('flt-clear')?.addEventListener('click', () => {
        catalogState = {
            sort: 'name-asc',
            priceMin: '0',
            priceMax: '3000',
            ratingChecks: [],
            categoryChecks: [],
        };
        reRender();
    });
}

function openFilterDrawer() {
    document.getElementById('filters-sidebar')?.classList.add('is-open');
    document.getElementById('filter-overlay')?.classList.add('is-open');
}

function closeFilterDrawer() {
    document.getElementById('filters-sidebar')?.classList.remove('is-open');
    document.getElementById('filter-overlay')?.classList.remove('is-open');
}

function renderCatalog() {
    const items = applyCatalogFilters(PRODUCTS);
    const { items: cartItems } = loadCart();

    main.innerHTML = `
    <div class="page-gray">
      <div class="container ts-page-pad">
        <header class="cat-header">
          <h1 class="cat-title">Premium Electronics</h1>
          <p class="cat-lead">Discover our curated collection of high-quality tech products</p>
        </header>

        <div class="cat-toolbar">
          <div class="cat-toolbar-left">
            <button type="button" class="btn btn-outline btn-filters-mob" id="btn-filters-open">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M8 12h8M10 18h4"/></svg>
              Filters
            </button>
            <p class="cat-count"><span id="prod-count">${items.length}</span> ${items.length === 1 ? 'product' : 'products'}</p>
          </div>
          <div class="sort-wrap">
            <span class="sort-label">Sort by:</span>
            <select id="sort-select" class="input input--select">
              <option value="name-asc" ${catalogState.sort === 'name-asc' ? 'selected' : ''}>Name (A–Z)</option>
              <option value="name-desc" ${catalogState.sort === 'name-desc' ? 'selected' : ''}>Name (Z–A)</option>
              <option value="price-low" ${catalogState.sort === 'price-low' ? 'selected' : ''}>Price (Low to High)</option>
              <option value="price-high" ${catalogState.sort === 'price-high' ? 'selected' : ''}>Price (High to Low)</option>
            </select>
          </div>
        </div>

        <div id="filter-overlay" class="filter-overlay" aria-hidden="true"></div>

        <div class="cat-layout">
          <aside class="filters-sidebar" id="filters-sidebar">
            <div class="filters-panel-inner">
              <div class="filters-mob-head">
                <h2 class="filters-mob-title">Filters</h2>
                <button type="button" class="icon-btn" id="btn-filters-close" aria-label="Close">×</button>
              </div>
              <div class="filters-panel">
                <h2 class="filters-desk-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M8 12h8M10 18h4"/></svg> Filters</h2>
                ${filterSidebarHtml()}
              </div>
            </div>
          </aside>
          <div class="cat-main">
            ${
        items.length === 0
            ? `<div class="empty-catalog"><p class="empty-catalog__t">No products found</p><p class="empty-catalog__s">Try adjusting your filters</p></div>`
            : `<div class="ts-grid">${items.map((p) => cardHtml(p, cartItems[String(p.id)] || 0)).join('')}</div>`
    }
          </div>
        </div>
      </div>
    </div>
  `;

    document.getElementById('sort-select').addEventListener('change', (e) => {
        catalogState.sort = e.target.value;
        renderCatalog();
    });

    document.getElementById('btn-filters-open')?.addEventListener('click', openFilterDrawer);
    document.getElementById('btn-filters-close')?.addEventListener('click', closeFilterDrawer);
    document.getElementById('filter-overlay')?.addEventListener('click', closeFilterDrawer);

    wireFilterSidebar();

    main.querySelectorAll('[data-add-cart]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute('data-add-cart');
            const { items: ci } = loadCart();
            const q = (ci[id] || 0) + 1;
            setItemQuantity(id, q);
            updateBadge();
            btn.textContent = 'Added ✓';
            setTimeout(() => {
                btn.textContent = 'Add to cart';
            }, 700);
        });
    });

    main.querySelectorAll('[data-product-link]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            closeFilterDrawer();
            navigate(`#/product/${el.getAttribute('data-product-link')}`);
        });
    });
}

    function parseRoute() {
        const hash = (location.hash || '#/catalog').replace(/^#/, '') || '/catalog';
        const parts = hash.split('/').filter(Boolean);
        if (parts[0] === 'catalog' || parts.length === 0) return {name: 'catalog'};
        if (parts[0] === 'cart') return {name: 'cart'};
        if (parts[0] === 'product' && parts[1]) return {name: 'product', id: parts[1]};
        return {name: 'catalog'};
    }

    function navigate(path) {
        location.hash = path;
    }

function cartLines() {
    const { items, promo } = loadCart();
    const lines = [];
    for (const [id, qty] of Object.entries(items)) {
        const pr = getProductById(id);
        if (pr && qty > 0) lines.push({ product: pr, qty });
    }
    const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
    const discount = promo === 'SAVE10' ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
    const taxedBase = Math.max(0, subtotal - discount);
    const tax = Math.round(taxedBase * 0.08 * 100) / 100;
    const total = Math.round((taxedBase + tax) * 100) / 100;
    return { lines, subtotal, discount, tax, total, promo };
}

function renderCart() {
    const { lines, subtotal, discount, tax, total, promo } = cartLines();

    if (lines.length === 0) {
        main.innerHTML = `
      <div class="page-gray ts-center-pad">
        <div class="container ts-page-pad">
          <div class="empty-cart-block">
            <h1 class="cat-title">Your Cart is Empty</h1>
            <p class="cat-lead">Add some amazing products to get started!</p>
            <a href="#/catalog" class="btn btn-add-lg" data-link>Вернуться в каталог</a>
          </div>
        </div>
      </div>`;
        clearPromo();
        updateBadge();
        return;
    }

    main.innerHTML = `
    <div class="page-gray">
      <div class="container ts-page-pad">
        <h1 class="cart-page-title">Shopping Cart</h1>
        <div class="cart-grid">
          <div class="cart-lines">
            ${lines
        .map(
            (l) => `
              <div class="cart-line" data-row="${l.product.id}">
                <div class="cart-line__img">
                  <img src="${l.product.image}" alt="" />
                </div>
                <div class="cart-line__mid">
                  <div class="cart-line__top">
                    <div>
                      <a href="#/product/${l.product.id}" class="cart-line__name" data-product-link="${l.product.id}">${escapeHtml(l.product.name)}</a>
                      <p class="cart-line__cat">${escapeHtml(l.product.category)}</p>
                    </div>
                    <button type="button" class="icon-btn icon-btn--danger" data-remove="${l.product.id}" aria-label="Remove">×</button>
                  </div>
                  <div class="cart-line__bot">
                    <div class="qty-row qty-row--sm">
                      <button type="button" class="qty-square" data-dec="${l.product.id}" aria-label="Decrease">−</button>
                      <span class="qty-val">${l.qty}</span>
                      <button type="button" class="qty-square" data-inc="${l.product.id}" aria-label="Increase">+</button>
                    </div>
                    <div class="cart-line__prices">
                      <p class="line-total">${formatPrice(l.product.price * l.qty)}</p>
                      <p class="line-each">${formatPrice(l.product.price)} each</p>
                    </div>
                  </div>
                </div>
              </div>`
        )
        .join('')}
          </div>
          <aside class="order-summary">
            <div class="order-card order-card--sticky">
              <h2 class="order-card__t">Order Summary</h2>
              <div class="order-rows">
                <div class="order-row"><span class="muted">Subtotal</span><span class="semi" id="sum-sub">${formatPrice(subtotal)}</span></div>
                <div id="disc-row-wrap">${promo === 'SAVE10' ? `<div class="order-row order-row--disc"><span>Discount (SAVE10)</span><span class="disc">-${formatPrice(discount)}</span></div>` : ''}</div>
                <div class="order-row"><span class="muted">Tax (8%)</span><span class="semi" id="sum-tax">${formatPrice(tax)}</span></div>
                <div class="order-row order-total"><span>Total</span><span class="total-amt" id="sum-total">${formatPrice(total)}</span></div>
              </div>
              <form class="promo-block" id="promo-form">
                <label class="promo-label">Promo Code</label>
                <div class="promo-row">
                  <input type="text" class="input" id="promo-input" placeholder="Enter code" autocomplete="off" ${promo === 'SAVE10' ? 'value="SAVE10"' : ''} />
                  <button type="submit" class="btn btn-dark">Apply</button>
                </div>
                <p class="promo-hint" id="promo-hint">${promo === 'SAVE10' ? '<span class="ok">Promo applied!</span>' : 'Try code "SAVE10" for 10% off'}</p>
                <p class="promo-err" id="promo-error" hidden>Неверный промокод</p>
              </form>
              <button type="button" class="btn btn-add-lg btn-mt">Proceed to Checkout</button>
            </div>
            <div class="order-card ship-card">
              <h3 class="ship-card__t">Shipping Information</h3>
              <p class="ship-p"><strong>Delivery Address</strong><br/>123 Tech Street<br/>San Francisco, CA 94105</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  `;

    const promoInput = document.getElementById('promo-input');
    const promoError = document.getElementById('promo-error');
    const promoHint = document.getElementById('promo-hint');

    function refreshSummary() {
        const s = cartLines();
        document.getElementById('sum-sub').textContent = formatPrice(s.subtotal);
        const wrap = document.getElementById('disc-row-wrap');
        wrap.innerHTML =
            s.promo === 'SAVE10'
                ? `<div class="order-row order-row--disc"><span>Discount (SAVE10)</span><span class="disc">-${formatPrice(s.discount)}</span></div>`
                : '';
        document.getElementById('sum-tax').textContent = formatPrice(s.tax);
        document.getElementById('sum-total').textContent = formatPrice(s.total);
        if (promoHint) {
            promoHint.innerHTML =
                s.promo === 'SAVE10' ? '<span class="ok">Promo applied!</span>' : 'Try code "SAVE10" for 10% off';
        }
    }

    function redrawRows() {
        const s = cartLines();
        if (s.lines.length === 0) {
            renderCart();
            return;
        }
        s.lines.forEach((l) => {
            const row = main.querySelector(`[data-row="${l.product.id}"]`);
            if (!row) return;
            row.querySelector('.qty-val').textContent = String(l.qty);
            row.querySelector('.line-total').textContent = formatPrice(l.product.price * l.qty);
        });
        refreshSummary();
        updateBadge();
    }

    main.querySelectorAll('[data-inc]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const pid = btn.getAttribute('data-inc');
            const { items } = loadCart();
            setItemQuantity(pid, (items[pid] || 0) + 1);
            redrawRows();
        });
    });
    main.querySelectorAll('[data-dec]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const pid = btn.getAttribute('data-dec');
            const { items } = loadCart();
            const next = (items[pid] || 0) - 1;
            if (next <= 0) removeItem(pid);
            else setItemQuantity(pid, next);
            redrawRows();
        });
    });
    main.querySelectorAll('[data-remove]').forEach((btn) => {
        btn.addEventListener('click', () => {
            removeItem(btn.getAttribute('data-remove'));
            redrawRows();
        });
    });

    main.querySelectorAll('[data-product-link]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(`#/product/${el.getAttribute('data-product-link')}`);
        });
    });

    document.getElementById('promo-form').addEventListener('submit', (e) => {
        e.preventDefault();
        promoError.hidden = true;
        const raw = promoInput.value.trim();
        if (raw === '') {
            setPromo(null);
            refreshSummary();
            return;
        }
        if (raw.toUpperCase() === 'SAVE10') {
            setPromo('SAVE10');
            promoError.hidden = true;
            refreshSummary();
        } else {
            setPromo(null);
            promoError.hidden = false;
            refreshSummary();
        }
    });

    updateBadge();
}

function renderProduct(id) {
    const p = getProductById(id);
    if (!p) {
        main.innerHTML = `
      <div class="page-gray ts-center-pad">
        <div class="ts-center-block">
          <h1 class="cat-title">Product Not Found</h1>
          <a href="#/catalog" class="link-blue" data-link>Return to Catalog</a>
        </div>
      </div>`;
        return;
    }

    const { items } = loadCart();
    const inCartQty = items[String(p.id)] || 0;
    let slideIndex = 0;
    const imgs = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image];

    main.innerHTML = `
    <div class="page-gray">
      <div class="container ts-page-pad">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="#/catalog" data-link>Products</a>
          <span class="bc-sep">/</span>
          <span class="bc-muted">${escapeHtml(p.category)}</span>
          <span class="bc-sep">/</span>
          <span class="bc-current">${escapeHtml(p.name)}</span>
        </nav>

        <div class="prod-grid">
          <div class="prod-gallery">
            <div class="prod-main-wrap">
              <img id="prod-main-img" class="prod-main-img" src="${imgs[0]}" alt="${escapeHtml(p.name)}" />
              ${
        imgs.length > 1
            ? `<button type="button" class="gal-nav gal-prev" id="gal-prev" aria-label="Previous">‹</button>
                     <button type="button" class="gal-nav gal-next" id="gal-next" aria-label="Next">›</button>`
            : ''
    }
            </div>
            ${
        imgs.length > 1
            ? `<div class="prod-thumbs">${imgs
                .map(
                    (src, i) => `
                <button type="button" class="prod-thumb ${i === 0 ? 'is-active' : ''}" data-idx="${i}">
                  <img src="${src}" alt="${escapeHtml(p.name)}" />
                </button>`
                )
                .join('')}</div>`
            : ''
    }
          </div>
          <div class="prod-info">
            <h1 class="prod-name">${escapeHtml(p.name)}</h1>
            <div class="prod-rate-row">
              ${starsHtmlFixed(p.rating)}
              <span class="rating-num">(${p.rating})</span>
              <span class="rev-hint">Based on 327 reviews</span>
            </div>
            <div class="prod-price-row">
              <span class="prod-price-big">${formatPrice(p.price)}</span>
              <span class="ship-note">Free shipping</span>
            </div>
            <div class="highlights">
              <h3 class="highlights__t">Key Highlights</h3>
              <ul class="highlights__list">
                ${p.specs
        .slice(0, 3)
        .map(
            (s) => `
                  <li><span class="hl-dot"></span><span class="hl-label">${escapeHtml(s.label)}:</span> ${escapeHtml(s.value)}</li>`
        )
        .join('')}
              </ul>
            </div>
            <div class="qty-block">
              <label class="qty-label">Quantity</label>
              <div class="qty-row">
                <button type="button" class="qty-square" id="prod-dec" aria-label="Decrease quantity">−</button>
                <span class="qty-val" id="prod-qty">1</span>
                <button type="button" class="qty-square" id="prod-inc" aria-label="Increase quantity">+</button>
              </div>
            </div>
            <button type="button" class="btn btn-add-lg" id="prod-add-btn">${inCartQty > 0 ? `In cart: ${inCartQty}` : 'Add to cart'}</button>
            <div class="spec-acc" id="prod-acc">
              <button type="button" class="spec-acc__btn" id="prod-acc-btn" aria-expanded="false">
                <span>Description</span>
                <span class="chev" aria-hidden="true"></span>
              </button>
              <div class="spec-acc__panel" id="prod-acc-panel" hidden>
                <div class="spec-rows">
                  ${p.specs
        .map(
            (s) => `
                  <div class="spec-row">
                    <span>${escapeHtml(s.label)}</span>
                    <span>${escapeHtml(s.value)}</span>
                  </div>`
        )
        .join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    const mainImg = document.getElementById('prod-main-img');
    const thumbs = [...main.querySelectorAll('.prod-thumb')];
    const qtyEl = document.getElementById('prod-qty');
    const addBtn = document.getElementById('prod-add-btn');
    const acc = document.getElementById('prod-acc');
    const accBtn = document.getElementById('prod-acc-btn');
    const accPanel = document.getElementById('prod-acc-panel');

    function setActiveThumb() {
        thumbs.forEach((el, idx) => {
            el.classList.toggle('is-active', idx === slideIndex);
        });
    }

    function showSlide(idx) {
        if (!mainImg || imgs.length === 0) return;
        slideIndex = (idx + imgs.length) % imgs.length;
        mainImg.src = imgs[slideIndex];
        setActiveThumb();
    }

    document.getElementById('gal-prev')?.addEventListener('click', () => {
        showSlide(slideIndex - 1);
    });

    document.getElementById('gal-next')?.addEventListener('click', () => {
        showSlide(slideIndex + 1);
    });

    thumbs.forEach((thumb, idx) => {
        thumb.addEventListener('click', () => {
            showSlide(idx);
        });
    });

    let qty = 1;
    document.getElementById('prod-inc')?.addEventListener('click', () => {
        qty += 1;
        if (qtyEl) qtyEl.textContent = String(qty);
    });
    document.getElementById('prod-dec')?.addEventListener('click', () => {
        qty = Math.max(1, qty - 1);
        if (qtyEl) qtyEl.textContent = String(qty);
    });

    addBtn?.addEventListener('click', () => {
        const pid = String(p.id);
        const { items: ci } = loadCart();
        const next = (ci[pid] || 0) + qty;
        setItemQuantity(pid, next);
        addBtn.textContent = `In cart: ${next}`;
        qty = 1;
        if (qtyEl) qtyEl.textContent = '1';
        updateBadge();
    });

    accBtn?.addEventListener('click', () => {
        if (!acc || !accPanel) return;
        const isOpen = acc.classList.toggle('is-open');
        accPanel.hidden = !isOpen;
        accBtn.setAttribute('aria-expanded', String(isOpen));
    });

    updateBadge();
}

    function setupHeaderMenu() {
        const btn = document.getElementById('menu-toggle');
        const nav = document.getElementById('mobile-nav');
        if (!btn || !nav) return;
        btn.addEventListener('click', () => {
            const open = nav.classList.toggle('is-open');
            btn.setAttribute('aria-expanded', String(open));
        });
        nav.querySelectorAll('a').forEach((a) => {
            a.addEventListener('click', () => {
                nav.classList.remove('is-open');
                btn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    function render() {
        const route = parseRoute();
        if (route.name === 'catalog') renderCatalog();
        else if (route.name === 'cart') renderCart();
        else if (route.name === 'product') renderProduct(route.id);
        updateBadge();
    }

    setupHeaderMenu();
    window.addEventListener('hashchange', render);
    if (!location.hash) location.hash = '#/catalog';
    render()