import { i as resource, r as defaultWindow, t as defaultDocument } from "./resource-BxYoJFRt.js";
import { t as useEventListener } from "./events-at72ADVs.js";
import { a as useResizeObserver, i as useMutationObserver, n as useElementSize, r as useIntersectionObserver, t as useElementBounding } from "./measure-Cl7yo-ly.js";
import { computed, shallowRef, toValue, watch } from "@usevibejs/ui";
// src/elements/input.ts
function useFocus(target, options = {}) {
	return resource((_cleanup, alive) => {
		const focused = shallowRef(false);
		const update = () => {
			const element = toValue(target);
			focused.value = !!element && element.ownerDocument.activeElement === element;
		};
		useEventListener(target, "focus", update);
		useEventListener(target, "blur", update);
		watch(() => toValue(target), (element) => {
			if (options.initialValue) element?.focus({ preventScroll: options.preventScroll });
			update();
		}, {
			immediate: true,
			flush: "post"
		});
		const set = (value) => {
			if (!alive()) return;
			const element = toValue(target);
			if (value) element?.focus({ preventScroll: options.preventScroll });
			else element?.blur();
			update();
		};
		return {
			focused,
			set
		};
	});
}
function useClickOutside(target, handler, options = {}) {
	return resource(() => {
		const doc = options.document ?? defaultDocument();
		const outside = (event) => {
			const element = toValue(target);
			if (!element) return false;
			const path = event.composedPath();
			const inside = (node) => path.includes(node) || !!event.target && node.contains(event.target);
			return !inside(element) && !(options.ignore ?? []).some((item) => {
				const node = toValue(item);
				return node && inside(node);
			});
		};
		let startedOutside = false;
		useEventListener(doc, "pointerdown", (event) => {
			startedOutside = event.button === 0 && outside(event);
		}, {
			capture: true,
			passive: true
		});
		useEventListener(doc, "click", (event) => {
			const trigger = event.button === 0 && (event.detail === 0 || startedOutside) && outside(event);
			startedOutside = false;
			if (trigger) handler(event);
		}, {
			capture: true,
			passive: true
		});
		if (options.detectFocus) useEventListener(doc, "focusin", (event) => {
			if (outside(event)) handler(event);
		});
		return {};
	});
}
function useScroll(target, options = {}) {
	return resource((_cleanup, alive) => {
		const x = shallowRef(0);
		const y = shallowRef(0);
		const maxX = shallowRef(0);
		const maxY = shallowRef(0);
		const element = () => {
			const current = toValue(target);
			return current && "document" in current ? current.document.scrollingElement : current;
		};
		const measure = () => {
			if (!alive()) return;
			const el = element();
			x.value = el?.scrollLeft ?? 0;
			y.value = el?.scrollTop ?? 0;
			maxX.value = el ? Math.max(0, el.scrollWidth - el.clientWidth) : 0;
			maxY.value = el ? Math.max(0, el.scrollHeight - el.clientHeight) : 0;
		};
		useEventListener(target, "scroll", measure, { passive: true });
		useEventListener(options.window ?? defaultWindow(), "resize", measure, { passive: true });
		useResizeObserver(element, measure);
		watch(() => toValue(target), measure, {
			immediate: true,
			flush: "post"
		});
		const scrollTo = (position) => {
			if (!alive()) return;
			element()?.scrollTo({
				left: position.x ?? x.value,
				top: position.y ?? y.value,
				behavior: position.behavior ?? toValue(options.behavior ?? "auto")
			});
			measure();
		};
		const threshold = options.offset ?? 1;
		return {
			x,
			y,
			maxX,
			maxY,
			arrivedState: computed(() => ({
				left: x.value <= threshold,
				right: x.value >= maxX.value - threshold,
				top: y.value <= threshold,
				bottom: y.value >= maxY.value - threshold
			})),
			measure,
			scrollTo
		};
	});
}
export { useClickOutside, useElementBounding, useElementSize, useFocus, useIntersectionObserver, useMutationObserver, useResizeObserver, useScroll };
