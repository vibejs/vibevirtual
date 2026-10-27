import { i as resource, r as defaultWindow } from "./resource-BxYoJFRt.js";
import { t as useEventListener } from "./events-at72ADVs.js";
import { shallowRef, toValue, watch } from "@usevibejs/ui";
// src/storage/index.ts
/** Replacement-based persistence: assign data.value to persist changes to objects. */
function createStorage(key, defaults, options, area) {
	return resource((_cleanup, alive) => {
		const win = options.window ?? defaultWindow();
		const error = shallowRef();
		const fail = (cause) => {
			error.value = cause;
			options.onError?.(cause);
		};
		let storage = options.storage;
		if (!storage) try {
			storage = win?.[area];
		} catch (cause) {
			fail(cause);
		}
		const isSupported = !!storage;
		const serializer = options.serializer ?? {
			read: (raw) => JSON.parse(raw),
			write: (value) => {
				const raw = JSON.stringify(value);
				if (raw === void 0) throw new TypeError("Value requires a custom storage serializer.");
				return raw;
			}
		};
		const data = shallowRef(defaults);
		let syncing = false;
		const assign = (value) => {
			syncing = true;
			try {
				data.value = value;
			} finally {
				syncing = false;
			}
		};
		let observed = data.value;
		const write = () => {
			if (!alive() || !storage) return;
			try {
				const name = toValue(key);
				const raw = data.value === void 0 ? null : serializer.write(data.value);
				if (storage.getItem(name) !== raw) {
					if (raw === null) storage.removeItem(name);
					else storage.setItem(name, raw);
				}
				observed = data.value;
				error.value = void 0;
			} catch (cause) {
				fail(cause);
			}
		};
		const read = () => {
			if (!alive() || !storage) return;
			try {
				const raw = storage.getItem(toValue(key));
				assign(raw === null ? defaults : serializer.read(raw));
				observed = data.value;
				error.value = void 0;
				if (raw === null && options.writeDefaults) write();
			} catch (cause) {
				fail(cause);
			}
		};
		read();
		if (options.flush !== "manual") watch(data, () => {
			if (!syncing && !Object.is(data.value, observed)) write();
		}, { flush: options.flush ?? "sync" });
		watch(() => toValue(key), () => {
			assign(defaults);
			observed = data.value;
			read();
		}, { flush: "sync" });
		if (options.listenToStorageChanges !== false) useEventListener(win, "storage", (event) => {
			if (event.storageArea !== storage || event.key !== null && event.key !== toValue(key)) return;
			try {
				assign(event.newValue === null ? defaults : serializer.read(event.newValue));
				observed = data.value;
				error.value = void 0;
			} catch (cause) {
				fail(cause);
			}
		});
		const remove = () => {
			if (!alive()) return;
			try {
				storage?.removeItem(toValue(key));
				assign(defaults);
				observed = data.value;
				error.value = void 0;
			} catch (cause) {
				fail(cause);
			}
		};
		return {
			data,
			error,
			isSupported,
			write,
			read,
			remove,
			reset: () => {
				if (alive()) {
					assign(defaults);
					write();
				}
			}
		};
	});
}
function useStorage(key, defaults, options = {}) {
	return createStorage(key, defaults, options, "localStorage");
}
function useLocalStorage(key, defaults, options = {}) {
	return createStorage(key, defaults, options, "localStorage");
}
function useSessionStorage(key, defaults, options = {}) {
	return createStorage(key, defaults, options, "sessionStorage");
}
export { useLocalStorage, useSessionStorage, useStorage };
