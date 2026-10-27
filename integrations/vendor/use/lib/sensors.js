import { i as resource, r as defaultWindow, t as defaultDocument } from "./resource-BxYoJFRt.js";
import { t as useEventListener } from "./events-at72ADVs.js";
import { t as useElementBounding } from "./measure-Cl7yo-ly.js";
import { computed, shallowRef, toValue, watch } from "@usevibejs/ui";
// src/sensors/index.ts
function useMouse(options = {}) {
	return resource(() => {
		const x = shallowRef(options.initialX ?? 0);
		const y = shallowRef(options.initialY ?? 0);
		const target = options.target ?? defaultWindow();
		const hasPosition = shallowRef(false);
		const update = (event) => {
			const mouse = event;
			hasPosition.value = true;
			x.value = options.type === "page" ? mouse.pageX : mouse.clientX;
			y.value = options.type === "page" ? mouse.pageY : mouse.clientY;
		};
		useEventListener(target, "mousemove", update, { passive: true });
		useEventListener(defaultDocument(), "mouseleave", () => {
			hasPosition.value = false;
		});
		return {
			x,
			y,
			hasPosition
		};
	});
}
function useMouseInElement(target, options = {}) {
	return resource(() => {
		const mouse = useMouse({
			...options,
			type: "client"
		});
		const bounds = useElementBounding(target);
		const elementX = computed(() => mouse.x.value - bounds.left.value);
		const elementY = computed(() => mouse.y.value - bounds.top.value);
		const isOutside = computed(() => !mouse.hasPosition.value || !toValue(target)?.isConnected || elementX.value < 0 || elementY.value < 0 || elementX.value >= bounds.width.value || elementY.value >= bounds.height.value);
		return {
			...mouse,
			elementX,
			elementY,
			isOutside
		};
	});
}
const editable = (event) => {
	for (const node of event.composedPath()) {
		if (!(node instanceof Element)) continue;
		if (/^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName)) return true;
		const value = node.getAttribute("contenteditable")?.toLowerCase();
		if (value === "false") return false;
		if (value === "" || value === "true" || value === "plaintext-only") return true;
	}
	return false;
};
function useKeyPressed(key, options = {}) {
	return resource(() => {
		const pressed = shallowRef(false);
		const win = options.window ?? defaultWindow();
		const target = options.target ?? win;
		let pressedCode;
		const reset = () => {
			pressedCode = void 0;
			pressed.value = false;
		};
		useEventListener(target, "keydown", (event) => {
			const e = event;
			if ((options.includeInputs || !editable(e)) && (e.key === key || e.code === key)) {
				pressedCode = e.code;
				pressed.value = true;
			}
		});
		useEventListener(win, "keyup", (event) => {
			if (event.key === key || event.code === key || event.key === "Meta" || pressedCode && event.code === pressedCode) reset();
		});
		useEventListener(win, "blur", reset);
		if (win) useEventListener(win.document, "visibilitychange", () => {
			if (win.document.hidden) reset();
		});
		watch(() => toValue(target), reset, { flush: "sync" });
		return { pressed };
	});
}
function useKeyModifier(modifier, options = {}) {
	return resource(() => {
		const active = shallowRef(false);
		const win = options.window ?? defaultWindow();
		const target = options.target ?? win;
		const update = (event) => {
			const e = event;
			if (options.includeInputs !== false || !editable(e) || e.type === "keyup") active.value = e.getModifierState(modifier);
		};
		useEventListener(target, "keydown", update);
		useEventListener(win, "keyup", update);
		useEventListener(win, "blur", () => {
			active.value = false;
		});
		if (win) useEventListener(win.document, "visibilitychange", () => {
			if (win.document.hidden) active.value = false;
		});
		watch(() => toValue(target), () => {
			active.value = false;
		}, { flush: "sync" });
		return { active };
	});
}
function useDevicePixelRatio(options = {}) {
	return resource((cleanup, alive) => {
		const win = options.window ?? defaultWindow();
		const pixelRatio = shallowRef(win?.devicePixelRatio ?? 1);
		let remove = () => {};
		const update = () => {
			if (!alive()) return;
			remove();
			pixelRatio.value = win?.devicePixelRatio ?? 1;
			if (!win?.matchMedia) return;
			const media = win.matchMedia(`(resolution: ${pixelRatio.value}dppx)`);
			media.addEventListener("change", update, { once: true });
			remove = () => media.removeEventListener("change", update);
		};
		update();
		cleanup(() => remove());
		useEventListener(win, "resize", update, { passive: true });
		return { pixelRatio };
	});
}
export { useDevicePixelRatio, useKeyModifier, useKeyPressed, useMouse, useMouseInElement };
