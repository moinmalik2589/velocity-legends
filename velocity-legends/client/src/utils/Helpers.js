export function formatCoins(value) {
    return Number(value).toLocaleString();
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function lerp(start, end, t) {
    return start + (end - start) * t;
}

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function deepClone(value) {
    return structuredClone(value);
}