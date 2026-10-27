// src/core/timing.ts
/** Normalize user-provided timer delays without overflowing native timer integers. */
function delay(value) {
	return Number.isFinite(value) ? Math.min(2147483647, Math.max(0, value)) : 0;
}
function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}
export { delay as n, clamp as t };
