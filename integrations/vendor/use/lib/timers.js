import { n as delay } from "./timing-0xr38rej.js";
import { i as resource, r as defaultWindow } from "./resource-BxYoJFRt.js";
import { shallowRef, toValue, watch } from "@usevibejs/ui";
// src/timers/index.ts
function useIntervalFn(callback, ms = 1e3, options = {}) {
	return resource((cleanup, alive) => {
		const isActive = shallowRef(false);
		let timer;
		const pause = () => {
			clearInterval(timer);
			timer = void 0;
			isActive.value = false;
		};
		const resume = () => {
			if (!alive()) return;
			pause();
			isActive.value = true;
			timer = setInterval(() => {
				if (alive()) callback();
			}, Math.max(1, delay(toValue(ms))));
			if (options.immediateCallback) callback();
		};
		watch(() => toValue(ms), () => {
			if (isActive.value) resume();
		}, { flush: "sync" });
		cleanup(pause);
		if (options.immediate !== false) resume();
		return {
			isActive,
			pause,
			resume,
			cancel: pause
		};
	});
}
function useTimeoutFn(callback, ms = 1e3, options = {}) {
	return resource((cleanup, alive) => {
		const isPending = shallowRef(false);
		let timer;
		const cancel = () => {
			clearTimeout(timer);
			timer = void 0;
			isPending.value = false;
		};
		const start = () => {
			if (!alive()) return;
			cancel();
			isPending.value = true;
			timer = setTimeout(() => {
				if (!alive()) return;
				isPending.value = false;
				timer = void 0;
				callback();
			}, delay(toValue(ms)));
		};
		cleanup(cancel);
		if (options.immediate !== false) start();
		return {
			isPending,
			start,
			cancel
		};
	});
}
function useRafFn(callback, options = {}) {
	return resource((cleanup, alive) => {
		const win = options.window ?? defaultWindow();
		const isSupported = !!win?.requestAnimationFrame;
		const isActive = shallowRef(false);
		let id;
		let previous;
		let generation = 0;
		const frame = {
			timestamp: 0,
			delta: 0
		};
		const tick = (timestamp, token) => {
			if (!alive() || !isActive.value || token !== generation) return;
			id = void 0;
			frame.timestamp = timestamp;
			frame.delta = previous === void 0 ? 0 : timestamp - previous;
			previous = timestamp;
			try {
				callback(frame);
			} catch (error) {
				pause();
				throw error;
			}
			if (alive() && isActive.value && token === generation) id = win.requestAnimationFrame((time) => tick(time, token));
		};
		const pause = () => {
			generation++;
			if (id !== void 0) win?.cancelAnimationFrame(id);
			id = void 0;
			previous = void 0;
			isActive.value = false;
		};
		const resume = () => {
			if (!alive() || !isSupported || isActive.value) return;
			isActive.value = true;
			const token = ++generation;
			id = win.requestAnimationFrame((time) => tick(time, token));
		};
		cleanup(pause);
		if (options.immediate !== false) resume();
		return {
			isSupported,
			isActive,
			pause,
			resume,
			cancel: pause
		};
	});
}
function useIdleCallback(callback, options = {}) {
	return resource((cleanup, alive) => {
		const win = options.window ?? defaultWindow();
		const isSupported = !!win?.requestIdleCallback;
		const isPending = shallowRef(false);
		let id;
		const cancel = () => {
			if (id !== void 0) win?.cancelIdleCallback(id);
			id = void 0;
			isPending.value = false;
		};
		const start = () => {
			if (!alive() || !isSupported) return;
			cancel();
			isPending.value = true;
			id = win.requestIdleCallback((deadline) => {
				id = void 0;
				if (!alive()) return;
				isPending.value = false;
				callback(deadline);
			}, { timeout: options.timeout });
		};
		cleanup(cancel);
		if (options.immediate !== false) start();
		return {
			isSupported,
			isPending,
			start,
			cancel
		};
	});
}
export { useIdleCallback, useIntervalFn, useRafFn, useTimeoutFn };
