import { i as resource, n as defaultNavigator, r as defaultWindow, t as defaultDocument } from "./resource-BxYoJFRt.js";
import { t as useEventListener } from "./events-at72ADVs.js";
import { useLocalStorage } from "./storage.js";
import { computed, shallowRef, toValue, watch } from "@usevibejs/ui";
// src/browser/state.ts
function useWindowSize(options = {}) {
	return resource(() => {
		const win = options.window ?? defaultWindow();
		const width = shallowRef(win?.innerWidth ?? options.initialWidth ?? 0);
		const height = shallowRef(win?.innerHeight ?? options.initialHeight ?? 0);
		if (win) useEventListener(win, "resize", () => {
			width.value = win.innerWidth;
			height.value = win.innerHeight;
		}, { passive: true });
		return {
			width,
			height
		};
	});
}
function useMediaQuery(query, options = {}) {
	return resource(() => {
		const win = options.window ?? defaultWindow();
		const matches = shallowRef(options.initialValue ?? false);
		const isSupported = !!win?.matchMedia;
		watch(() => toValue(query), (value, _old, cleanup) => {
			if (!isSupported) return;
			const media = win.matchMedia(value);
			const update = () => {
				matches.value = media.matches;
			};
			update();
			media.addEventListener("change", update);
			cleanup(() => media.removeEventListener("change", update));
		}, {
			immediate: true,
			flush: "sync"
		});
		return {
			matches,
			isSupported
		};
	});
}
function usePreferredDark(options = {}) {
	return useMediaQuery("(prefers-color-scheme: dark)", options);
}
function useDocumentVisibility(doc = defaultDocument()) {
	return resource(() => {
		const visibility = shallowRef(doc?.visibilityState ?? "visible");
		useEventListener(doc, "visibilitychange", () => {
			visibility.value = doc.visibilityState;
		});
		return { visibility };
	});
}
function useOnline(win = defaultWindow()) {
	return resource(() => {
		const isOnline = shallowRef(win?.navigator.onLine ?? true);
		useEventListener(win, "online", () => {
			isOnline.value = true;
		});
		useEventListener(win, "offline", () => {
			isOnline.value = false;
		});
		return { isOnline };
	});
}
function useSupported(check) {
	return { isSupported: computed(() => {
		try {
			return !!check();
		} catch {
			return false;
		}
	}) };
}
function useClipboard(options = {}) {
	return resource((_cleanup, alive) => {
		const nav = options.navigator ?? defaultNavigator();
		const isSupported = !!nav?.clipboard?.writeText;
		const text = shallowRef("");
		const copied = shallowRef(false);
		const error = shallowRef();
		const isPending = shallowRef(false);
		let request = 0;
		const copy = async (value) => {
			if (!alive()) return false;
			const id = ++request;
			copied.value = false;
			error.value = void 0;
			isPending.value = true;
			try {
				if (!isSupported) throw new Error("Clipboard writing is unavailable. Use a secure context and a user gesture.");
				await nav.clipboard.writeText(value);
				if (!alive() || id !== request) return false;
				text.value = value;
				copied.value = true;
				return true;
			} catch (cause) {
				if (alive() && id === request) error.value = cause;
				return false;
			} finally {
				if (alive() && id === request) isPending.value = false;
			}
		};
		return {
			copy,
			isSupported,
			text,
			copied,
			error,
			isPending
		};
	});
}
function usePermission(descriptor, options = {}) {
	return resource((cleanup, alive) => {
		const nav = options.navigator ?? defaultNavigator();
		const isSupported = !!nav?.permissions?.query;
		const state = shallowRef(isSupported ? "unknown" : "unsupported");
		const error = shallowRef();
		let remove = () => {};
		let request = 0;
		const query = async () => {
			if (!alive() || !isSupported) return;
			const id = ++request;
			try {
				const status = await nav.permissions.query(descriptor);
				if (!alive() || id !== request) return;
				remove();
				error.value = void 0;
				const update = () => {
					if (alive()) state.value = status.state;
				};
				update();
				status.addEventListener("change", update);
				remove = () => status.removeEventListener("change", update);
			} catch (cause) {
				if (alive() && id === request) {
					error.value = cause;
					state.value = "unknown";
				}
			}
		};
		cleanup(() => remove());
		query();
		return {
			state,
			error,
			isSupported,
			query
		};
	});
}
// src/browser/document.ts
function useDark(options = {}) {
	return resource((cleanup) => {
		const system = usePreferredDark({ window: options.window });
		const saved = options.storageKey ? useLocalStorage(options.storageKey, options.initialValue ?? "auto", {
			storage: options.storage,
			window: options.window,
			serializer: {
				read: (raw) => {
					const value = JSON.parse(raw);
					if (value === "auto" || value === "light" || value === "dark") return value;
					throw new TypeError("Invalid color preference.");
				},
				write: JSON.stringify
			}
		}) : void 0;
		const preference = saved?.data ?? shallowRef(options.initialValue ?? "auto");
		const isDark = computed(() => preference.value === "auto" ? system.matches.value : preference.value === "dark");
		if (options.target !== void 0) {
			const name = options.className ?? "dark";
			let current;
			let original = false;
			const restore = () => {
				current?.classList.toggle(name, original);
			};
			watch(() => [toValue(options.target), isDark.value], ([target, dark]) => {
				if (target !== current) {
					restore();
					current = target;
					original = target?.classList.contains(name) ?? false;
				}
				target?.classList.toggle(name, dark);
			}, {
				immediate: true,
				flush: "sync"
			});
			cleanup(restore);
		}
		return {
			preference,
			isDark,
			error: saved?.error,
			set: (value) => {
				preference.value = value;
			},
			toggle: () => {
				preference.value = isDark.value ? "light" : "dark";
			}
		};
	});
}
function useTitle(title, options = {}) {
	return resource((cleanup) => {
		const doc = options.document ?? defaultDocument();
		const original = doc?.title;
		watch(() => toValue(title), (value) => {
			if (doc) doc.title = value;
		}, {
			immediate: true,
			flush: "sync"
		});
		if (options.restoreOnStop !== false) cleanup(() => {
			if (doc) doc.title = original;
		});
		return {};
	});
}
function useFavicon(href, options = {}) {
	return resource((cleanup) => {
		const doc = options.document ?? defaultDocument();
		const rel = options.rel ?? "icon";
		const existing = doc ? [...doc.querySelectorAll("link")].find((link) => link.rel === rel) : void 0;
		const original = existing?.getAttribute("href");
		let link = existing;
		watch(() => toValue(href), (value) => {
			if (!doc) return;
			if (!link && value !== null) {
				link = doc.createElement("link");
				link.rel = rel;
				doc.head.append(link);
			}
			if (link) {
				if (value === null) link.removeAttribute("href");
				else link.setAttribute("href", value);
			}
		}, {
			immediate: true,
			flush: "sync"
		});
		cleanup(() => {
			if (!existing) link?.remove();
			else if (original === null) existing.removeAttribute("href");
			else existing.setAttribute("href", original);
		});
		return {};
	});
}
export { useClipboard, useDark, useDocumentVisibility, useEventListener, useFavicon, useMediaQuery, useOnline, usePermission, usePreferredDark, useSupported, useTitle, useWindowSize };
