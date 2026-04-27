const STORAGE_KEY = 'shop_cart_techstore';

function readRaw() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { items: {}, promo: null };
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return { items: {}, promo: null };
        return {
            items: data.items && typeof data.items === 'object' ? data.items : {},
            promo: data.promo === 'SAVE10' ? 'SAVE10' : null,
        };
    } catch {
        return { items: {}, promo: null };
    }
}

function writeRaw(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadCart() {
    return readRaw();
}

export function saveCart(state) {
    writeRaw(state);
}

export function getQuantityMap() {
    const { items } = readRaw();
    return { ...items };
}

export function getTotalCount(items) {
    return Object.values(items).reduce((a, n) => a + (Number(n) || 0), 0);
}

export function setItemQuantity(productId, qty) {
    const state = readRaw();
    const next = { ...state.items };
    if (qty <= 0) delete next[productId];
    else next[productId] = qty;
    saveCart({ ...state, items: next });
}

export function removeItem(productId) {
    const state = readRaw();
    const next = { ...state.items };
    delete next[productId];
    saveCart({ ...state, items: next });
}

export function setPromo(code) {
    const state = readRaw();
    saveCart({ ...state, promo: code === 'SAVE10' ? 'SAVE10' : null });
}

export function clearPromo() {
    const state = readRaw();
    saveCart({ ...state, promo: null });
}