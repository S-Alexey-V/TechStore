import { PRODUCTS, getProductById, uniqueCategories } from './products.js';

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
        minEl.addEventListener('input', () => {
            catalogState.priceMin = minEl.value;
            reRender();
        });
    }
    if (maxEl) {
        maxEl.addEventListener('input', () => {
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

    function renderCart() {
        main.innerHTML =
            '<div class="container ts-page-pad"><h1 class="cart-page-title">Shopping Cart</h1><p class="cat-lead">Day 1: hash route <code>#/cart</code></p></div>';
    }

    function renderProduct(id) {
        main.innerHTML =
            '<div class="container ts-page-pad"><h1 class="cat-title">Product</h1><p class="cat-lead" id="day1-product-slug"></p></div>';
        const slot = document.getElementById('day1-product-slug');
        if (slot) slot.textContent = id ? `Product id from URL: ${id}` : 'No id in URL';
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
        if (badge) {
            badge.hidden = true;
            badge.textContent = '0';
        }
    }

    setupHeaderMenu();
    window.addEventListener('hashchange', render);
    if (!location.hash) location.hash = '#/catalog';
    render()