import { n as delay, t as clamp } from "./timing-0xr38rej.js";
import { i as resource } from "./resource-BxYoJFRt.js";
import { computed, getCurrentScope, isReadonly, onScopeDispose, shallowRef, toValue, watch } from "@usevibejs/ui";
// src/reactivity/timing.ts
/** Scheduled calls return void; flush returns the most recent callback result. */
function useDebounceFn(fn, ms = 200, options = {}) {
	return resource((cleanup, alive) => {
		const isPending = shallowRef(false);
		let timer;
		let maxTimer;
		let args;
		let result;
		const invoke = () => {
			const current = args;
			args = void 0;
			if (current && alive()) result = fn(...current);
			return result;
		};
		const cancel = () => {
			clearTimeout(timer);
			clearTimeout(maxTimer);
			timer = maxTimer = void 0;
			args = void 0;
			isPending.value = false;
		};
		const flush = () => {
			const pending = args;
			cancel();
			args = pending;
			return invoke();
		};
		const call = (...next) => {
			if (!alive()) return;
			const first = timer === void 0;
			args = next;
			clearTimeout(timer);
			isPending.value = true;
			timer = setTimeout(() => {
				if (options.trailing !== false) flush();
				else cancel();
			}, delay(toValue(ms)));
			if (first && options.maxWait !== void 0) maxTimer = setTimeout(flush, delay(options.maxWait));
			if (first && options.leading) invoke();
		};
		cleanup(cancel);
		return {
			call,
			cancel,
			flush,
			isPending
		};
	});
}
function useThrottleFn(fn, ms = 200, options = {}) {
	return resource((cleanup, alive) => {
		const isPending = shallowRef(false);
		let timer;
		let args;
		let result;
		const invoke = () => {
			const current = args;
			args = void 0;
			if (current && alive()) result = fn(...current);
			return result;
		};
		const cancel = () => {
			clearTimeout(timer);
			timer = void 0;
			args = void 0;
			isPending.value = false;
		};
		const flush = () => {
			const pending = args;
			cancel();
			args = pending;
			return invoke();
		};
		const schedule = () => {
			timer = setTimeout(() => {
				timer = void 0;
				if (options.trailing !== false && args) {
					schedule();
					invoke();
				} else cancel();
			}, delay(toValue(ms)));
		};
		const call = (...next) => {
			if (!alive()) return;
			args = next;
			if (timer !== void 0) return;
			isPending.value = true;
			schedule();
			if (options.leading !== false) invoke();
		};
		cleanup(cancel);
		return {
			call,
			cancel,
			flush,
			isPending
		};
	});
}
function useDebounce(source, ms = 200, options = {}) {
	return resource(() => {
		const value = shallowRef(toValue(source));
		const filter = useDebounceFn((next) => {
			value.value = next;
		}, ms, options);
		watch(() => toValue(source), filter.call, { flush: "sync" });
		return {
			value,
			cancel: filter.cancel,
			flush: filter.flush,
			isPending: filter.isPending
		};
	});
}
function useThrottle(source, ms = 200, options = {}) {
	return resource(() => {
		const value = shallowRef(toValue(source));
		const filter = useThrottleFn((next) => {
			value.value = next;
		}, ms, options);
		watch(() => toValue(source), filter.call, { flush: "sync" });
		return {
			value,
			cancel: filter.cancel,
			flush: filter.flush,
			isPending: filter.isPending
		};
	});
}
// src/reactivity/state.ts
function usePrevious(source, initial) {
	return resource(() => {
		const previous = shallowRef(initial);
		watch(() => toValue(source), (_value, old) => {
			previous.value = old;
		}, { flush: "sync" });
		return { previous };
	});
}
function useCounter(initial = 0, { min = -Infinity, max = Infinity } = {}) {
	if (min > max) throw new RangeError("Counter min must not exceed max.");
	const count = shallowRef(clamp(initial, min, max));
	const set = (value) => {
		count.value = clamp(value, min, max);
	};
	return {
		count,
		set,
		inc: (delta = 1) => set(count.value + delta),
		dec: (delta = 1) => set(count.value - delta),
		reset: () => set(initial)
	};
}
function useToggle(initial = false) {
	const value = shallowRef(initial);
	const set = (next) => {
		value.value = next;
	};
	return {
		value,
		set,
		toggle: () => {
			value.value = !value.value;
			return value.value;
		}
	};
}
function useCycle(values, initialIndex = 0) {
	const index = shallowRef(initialIndex);
	const normalized = computed(() => {
		const length = toValue(values).length;
		return length ? (index.value % length + length) % length : -1;
	});
	const state = computed(() => toValue(values)[normalized.value]);
	const next = (delta = 1) => {
		index.value = normalized.value + delta;
	};
	return {
		state,
		index: normalized,
		next,
		prev: (delta = 1) => next(-delta),
		reset: () => {
			index.value = initialIndex;
		}
	};
}
/** Each call creates an isolated bus. Share this returned object explicitly or via provide/inject. */
function useEventBus() {
	return resource((cleanup, alive) => {
		const listeners = /* @__PURE__ */ new Set();
		const on = (listener) => {
			if (alive()) listeners.add(listener);
			const off = () => {
				listeners.delete(listener);
			};
			if (getCurrentScope()) onScopeDispose(off);
			return off;
		};
		cleanup(() => listeners.clear());
		return {
			on,
			emit: (event) => {
				if (alive()) {
					for (const listener of Array.from(listeners)) if (listeners.has(listener)) listener(event);
				}
			},
			clear: () => listeners.clear()
		};
	});
}
// src/reactivity/history.ts
function useRefHistory(source, options) {
	if (isReadonly(source)) throw new TypeError("useRefHistory requires a writable ref.");
	const capacity = options.capacity ?? 100;
	if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError("History capacity must be a positive integer.");
	return resource((_cleanup, alive) => {
		const snapshots = shallowRef([options.clone(source.value)]);
		const position = shallowRef(0);
		const isPaused = shallowRef(false);
		let restoring = false;
		const commit = () => {
			if (!alive() || restoring || isPaused.value) return;
			const next = [...snapshots.value.slice(0, position.value + 1), options.clone(source.value)];
			snapshots.value = next.slice(-capacity);
			position.value = snapshots.value.length - 1;
		};
		watch(source, commit, {
			flush: "sync",
			deep: options.deep
		});
		const restore = (index) => {
			if (!alive() || index < 0 || index >= snapshots.value.length) return;
			restoring = true;
			try {
				source.value = options.clone(snapshots.value[index]);
				position.value = index;
			} finally {
				restoring = false;
			}
		};
		const clear = () => {
			if (alive()) {
				snapshots.value = [options.clone(source.value)];
				position.value = 0;
			}
		};
		return {
			history: snapshots,
			position,
			canUndo: computed(() => position.value > 0),
			canRedo: computed(() => position.value < snapshots.value.length - 1),
			isPaused,
			commit,
			clear,
			undo: () => restore(position.value - 1),
			redo: () => restore(position.value + 1),
			pause: () => {
				isPaused.value = true;
			},
			resume: () => {
				if (alive()) isPaused.value = false;
			}
		};
	});
}
export { useCounter, useCycle, useDebounce, useDebounceFn, useEventBus, usePrevious, useRefHistory, useThrottle, useThrottleFn, useToggle };
