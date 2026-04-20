const main = document.getElementById('main');
const badge = document.getElementById('cart-badge');

function parseRoute() {
    const hash = (location.hash || '#/catalog').replace(/^#/, '') || '/catalog';
    const parts = hash.split('/').filter(Boolean);
    if (parts[0] === 'catalog' || parts.length === 0) return { name: 'catalog' };
    if (parts[0] === 'cart') return { name: 'cart' };
    if (parts[0] === 'product' && parts[1]) return { name: 'product', id: parts[1] };
    return { name: 'catalog' };
}

function navigate(path) {
    location.hash = path;
}

function renderCatalog() {
    main.innerHTML =
        '<div class="container ts-page-pad"><h1 class="cat-title">Premium Electronics</h1><p class="cat-lead">Day 1: hash route <code>#/catalog</code></p></div>';
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
render();