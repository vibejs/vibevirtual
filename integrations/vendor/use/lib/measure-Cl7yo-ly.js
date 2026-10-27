import { i as resource, r as defaultWindow } from "./resource-BxYoJFRt.js";
import { t as useEventListener } from "./events-at72ADVs.js";
import { shallowRef, toValue, watch } from "@usevibejs/ui";
// src/elements/observers.ts
function observe(target, supported, connect) {
	return resource((cleanup, alive) => {
		const isActive = shallowRef(true);
		watch(() => [toValue(target), isActive.value], ([node, active], _old, onCleanup) => {
			if (!node || !active || !supported) return;
			let connected = true;
			const observer = connect(node, () => alive() && connected && isActive.value && toValue(target) === node);
			onCleanup(() => {
				connected = false;
				observer.disconnect();
			});
		}, {
			immediate: true,
			flush: "post"
		});
		cleanup(() => {
			isActive.value = false;
		});
		return {
			isSupported: supported,
			isActive,
			pause: () => {
				isActive.value = false;
			},
			resume: () => {
				if (alive()) isActive.value = true;
			}
		};
	});
}
function useResizeObserver(target, callback, options) {
	return observe(target, typeof ResizeObserver !== "undefined", (element, alive) => {
		const observer = new ResizeObserver((entries, instance) => {
			if (alive()) callback(entries, instance);
		});
		observer.observe(element, options);
		return observer;
	});
}
function useIntersectionObserver(target, callback, options) {
	return observe(target, typeof IntersectionObserver !== "undefined", (element, alive) => {
		const observer = new IntersectionObserver((entries, instance) => {
			if (alive()) callback(entries, instance);
		}, options);
		observer.observe(element);
		return observer;
	});
}
function useMutationObserver(target, callback, options = {
	childList: true,
	subtree: true
}) {
	return observe(target, typeof MutationObserver !== "undefined", (node, alive) => {
		const observer = new MutationObserver((entries, instance) => {
			if (alive()) callback(entries, instance);
		});
		observer.observe(node, options);
		return observer;
	});
}
// src/elements/measure.ts
/** Content-box size in CSS pixels; disconnected elements reset to zero. */
function useElementSize(target, initial = {
	width: 0,
	height: 0
}) {
	return resource(() => {
		const width = shallowRef(initial.width);
		const height = shallowRef(initial.height);
		const update = () => {
			const element = toValue(target);
			const rect = element?.isConnected ? element.getBoundingClientRect() : void 0;
			const style = rect && element ? element.ownerDocument.defaultView?.getComputedStyle(element) : void 0;
			const number = (value) => Number.parseFloat(value ?? "") || 0;
			width.value = rect ? Math.max(0, rect.width - number(style?.paddingLeft) - number(style?.paddingRight) - number(style?.borderLeftWidth) - number(style?.borderRightWidth)) : 0;
			height.value = rect ? Math.max(0, rect.height - number(style?.paddingTop) - number(style?.paddingBottom) - number(style?.borderTopWidth) - number(style?.borderBottomWidth)) : 0;
		};
		watch(() => toValue(target), update, {
			immediate: true,
			flush: "post"
		});
		useResizeObserver(target, (entries) => {
			const element = toValue(target);
			const entry = entries.find((value) => value.target === element);
			if (entry) {
				width.value = element?.isConnected ? entry.contentRect.width : 0;
				height.value = element?.isConnected ? entry.contentRect.height : 0;
			}
		});
		return {
			width,
			height
		};
	});
}
function useElementBounding(target, options = {}) {
	return resource((_cleanup, alive) => {
		const x = shallowRef(0);
		const y = shallowRef(0);
		const width = shallowRef(0);
		const height = shallowRef(0);
		const top = shallowRef(0);
		const right = shallowRef(0);
		const bottom = shallowRef(0);
		const left = shallowRef(0);
		const update = () => {
			if (!alive()) return;
			const element = toValue(target);
			const rect = element?.isConnected ? element.getBoundingClientRect() : void 0;
			x.value = rect?.x ?? 0;
			y.value = rect?.y ?? 0;
			width.value = rect?.width ?? 0;
			height.value = rect?.height ?? 0;
			top.value = rect?.top ?? 0;
			right.value = rect?.right ?? 0;
			bottom.value = rect?.bottom ?? 0;
			left.value = rect?.left ?? 0;
		};
		watch(() => toValue(target), update, {
			immediate: true,
			flush: "post"
		});
		useResizeObserver(target, update);
		const win = options.window ?? defaultWindow();
		if (options.windowResize !== false) useEventListener(win, "resize", update, { passive: true });
		if (options.windowScroll !== false) useEventListener(win, "scroll", update, {
			passive: true,
			capture: true
		});
		return {
			x,
			y,
			width,
			height,
			top,
			right,
			bottom,
			left,
			update
		};
	});
}
export { useResizeObserver as a, useMutationObserver as i, useElementSize as n, useIntersectionObserver as r, useElementBounding as t };
