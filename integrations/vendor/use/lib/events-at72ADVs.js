import { i as resource } from "./resource-BxYoJFRt.js";
import { toValue, watch } from "@usevibejs/ui";
// src/browser/events.ts
function useEventListener(target, event, listener, options) {
	return resource(() => {
		const opts = typeof options === "object" ? { ...options } : options;
		watch(() => toValue(target), (current, _old, cleanup) => {
			if (!current) return;
			current.addEventListener(event, listener, opts);
			cleanup(() => current.removeEventListener(event, listener, opts));
		}, {
			immediate: true,
			flush: "sync"
		});
		return {};
	});
}
export { useEventListener as t };
