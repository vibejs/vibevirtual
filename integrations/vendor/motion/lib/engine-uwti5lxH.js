import { computed, getCurrentScope, hasInjectionContext, inject, isRef, nextTick, onScopeDispose, provide, shallowRef, toValue, watch } from "@usevibejs/ui";
import { GroupAnimationWithThen } from "motion";
// src/internal.ts
/** Requires an owner before allocating a Motion resource. */
function requireScope() {
	if (!getCurrentScope()?.active) throw motionError("Call composables in component setup or an active effectScope().run().");
}
/** Registers cleanup with the active public Vibe.js scope. */
function onDispose(fn) {
	requireScope();
	onScopeDispose(fn);
}
/**
* Calls `setup` for the current element of `target` and the cleanup it returns when the element
* is replaced, removed or the scope stops. Runs after Vibe.js has flushed the DOM, so the element
* is connected. Returns a function that stops watching and runs the pending cleanup.
*/
function bindElement(target, setup) {
	requireScope();
	let cleanup;
	let active = true;
	const release = () => {
		const fn = cleanup;
		cleanup = void 0;
		fn?.();
	};
	const stopWatch = watch(() => toValue(target), (element) => {
		release();
		if (element && active) cleanup = setup(element);
	}, {
		immediate: true,
		flush: "post"
	});
	const stop = () => {
		if (!active) return;
		active = false;
		stopWatch();
		release();
	};
	onDispose(() => {
		stop();
		if (isRef(target)) nextTick(() => {
			target.value;
		});
	});
	return stop;
}
/** Throws a VibeMotion error with a stable prefix. */
function motionError(message) {
	return /* @__PURE__ */ new Error(`[VibeMotion] ${message}`);
}
/** Shallow equality of two JSON-like animation targets; used to skip redundant animations. */
function sameTarget(a, b) {
	if (a === b) return true;
	if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
	const left = Object.keys(a);
	const right = Object.keys(b);
	return left.length === right.length && left.every((key) => Object.hasOwn(b, key) && sameTarget(a[key], b[key]));
}
// src/config.ts
/** The injection key behind `provideMotionConfig()`. `app.provide(motionConfigKey, config)` sets it app-wide. */
const motionConfigKey = Symbol("vibemotion.config");
/** Sets the motion configuration for the calling component and its descendants. */
function provideMotionConfig(config) {
	provide(motionConfigKey, config);
}
const QUERY = "(prefers-reduced-motion: reduce)";
const prefersReduced = shallowRef(false);
let subscribers = 0;
let media;
const onChange = (event) => {
	prefersReduced.value = event.matches;
};
/** One shared `matchMedia` listener, kept while at least one consumer is alive. */
function subscribe() {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
	if (subscribers++ === 0) {
		media = window.matchMedia(QUERY);
		prefersReduced.value = media.matches;
		media.addEventListener("change", onChange);
	}
	onDispose(() => {
		if (--subscribers === 0) {
			media?.removeEventListener("change", onChange);
			media = void 0;
		}
	});
}
function useMotionSettings() {
	requireScope();
	const source = hasInjectionContext() ? inject(motionConfigKey, {}) : {};
	const config = computed(() => toValue(source));
	subscribe();
	return {
		reduced: computed(() => {
			const setting = config.value.reducedMotion ?? "user";
			return setting === "always" || setting === "user" && prefersReduced.value;
		}),
		config
	};
}
/**
* Whether motion should be reduced: the user's `prefers-reduced-motion` preference combined with
* the nearest `provideMotionConfig()`. Updates when either changes.
*/
function useReducedMotion() {
	return useMotionSettings().reduced;
}
/** Merges the configured defaults and the accessibility flags into animation options. */
function applySettings(settings, options) {
	const { transition, skipAnimations } = settings.config.value;
	const merged = {
		...transition,
		...options
	};
	merged.reduceMotion = settings.reduced.value;
	if (skipAnimations) merged.skipAnimations = true;
	return merged;
}
// src/engine.ts
const isSequence = (value) => Array.isArray(value) && value.some(Array.isArray);
/** Whether an animation is stopped or done. An empty group (nothing matched) has no state to read. */
function settled(animation) {
	try {
		return animation.state === "idle" || animation.state === "finished";
	} catch {
		return true;
	}
}
/** @internal */
function createAnimate(settings, root, engine) {
	const running = /* @__PURE__ */ new Set();
	let disposed = false;
	const resolve = (subject, keyframes) => {
		const scope = root === void 0 ? void 0 : toValue(root);
		return typeof subject === "string" && keyframes !== null && typeof keyframes === "object" && !Array.isArray(keyframes) && root !== void 0 ? scope ? Array.from(scope.querySelectorAll(subject)) : [] : subject;
	};
	const run = (...args) => {
		if (disposed) return new GroupAnimationWithThen([]);
		if (isSequence(args[0])) {
			args[0] = args[0].map((segment) => Array.isArray(segment) ? [resolve(segment[0], segment[1]), ...segment.slice(1)] : segment);
			args[1] = applySettings(settings, args[1]);
		} else {
			args[0] = resolve(args[0], args[1]);
			args[2] = applySettings(settings, args[2]);
		}
		for (const previous of running) if (settled(previous)) running.delete(previous);
		const animation = engine(...args);
		running.add(animation);
		animation.finished.then(() => running.delete(animation), () => running.delete(animation));
		return animation;
	};
	const stop = () => {
		for (const animation of running) animation.stop();
		running.clear();
	};
	onDispose(() => {
		disposed = true;
		stop();
	});
	return Object.defineProperties(run, {
		stop: { value: stop },
		running: { get: () => running.size }
	});
}
export { useMotionSettings as a, onDispose as c, provideMotionConfig as i, requireScope as l, applySettings as n, useReducedMotion as o, motionConfigKey as r, bindElement as s, createAnimate as t, sameTarget as u };
