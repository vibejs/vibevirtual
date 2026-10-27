import { constructTable } from "@tanstack/table-core";
import { computed, effectScope, getCurrentScope, onScopeDispose, shallowRef, toValue, unref, watch, watchEffect } from "@usevibejs/ui";
export * from "@tanstack/table-core";
// src/reactivity.ts
/** Isolates a read using a short-lived public watcher, without an internal tracking API. */
function untrack(fn) {
	let result;
	let failure;
	watchEffect(() => {
		try {
			result = fn();
		} catch (error) {
			failure = { error };
		}
	}, { flush: "sync" })();
	if (failure) throw failure.error;
	return result;
}
/** Creates native atoms owned by the active Vibe effect scope. */
function vibeReactivity() {
	if (!getCurrentScope()?.active) throw new Error("VibeTable requires an active component or effect scope.");
	const scope = effectScope();
	const subscriptions = /* @__PURE__ */ new Set();
	scope.run(() => onScopeDispose(() => {
		for (const subscription of subscriptions) subscription.unsubscribe();
		subscriptions.clear();
	}));
	function readonlyAtom(source) {
		return {
			get: () => source.value,
			subscribe(observer) {
				if (!scope.active) return { unsubscribe() {} };
				const stop = scope.run(() => watch(() => source.value, (value) => {
					if (typeof observer === "function") observer(value);
					else observer.next?.(value);
				}, { flush: "sync" }));
				return { unsubscribe: () => stop?.() };
			}
		};
	}
	return {
		createOptionsStore: true,
		wrapExternalAtoms: true,
		createWritableAtom(value, options) {
			const source = shallowRef(value);
			return {
				...readonlyAtom(source),
				set(updater) {
					const previous = untrack(() => source.value);
					const next = typeof updater === "function" ? updater(previous) : updater;
					if (!options?.compare?.(previous, next)) source.value = next;
				}
			};
		},
		createReadonlyAtom(fn, options) {
			let initialized = false;
			return readonlyAtom(computed((previous) => {
				const next = fn();
				if (initialized && options?.compare?.(previous, next)) return previous;
				initialized = true;
				return next;
			}));
		},
		addSubscription(subscription) {
			subscriptions.add(subscription);
		},
		untrack,
		batch: (fn) => fn(),
		schedule(fn) {
			queueMicrotask(() => {
				if (scope.active) untrack(fn);
			});
		},
		unmount: () => scope.stop()
	};
}
/** An externally owned native state slice. Create it in the same scope as its table. */
function useTableAtom(initialValue) {
	return vibeReactivity().createWritableAtom(initialValue);
}
// src/useTable.ts
function resolveOptions(source) {
	const options = toValue(source);
	const resolved = Object.fromEntries(Object.entries(options).map(([key, value]) => [key, unref(value)]));
	resolved.data = toValue(options.data);
	resolved.columns = toValue(options.columns);
	const state = options.state === void 0 ? void 0 : toValue(options.state);
	resolved.state = state === void 0 ? void 0 : Object.fromEntries(Object.entries(state).map(([key, value]) => [key, toValue(value)]));
	resolved.atoms = options.atoms === void 0 ? void 0 : { ...options.atoms };
	return resolved;
}
/**
* Constructs one stable headless table, owned by the current component/effect scope.
* Read table/row/column methods inside templates, computed values, or watchers to track them.
* Data and columns use reference replacement, following TanStack's memoization contract.
*/
function useTable(options) {
	if (!getCurrentScope()?.active) throw new Error("useTable() requires an active component or effect scope.");
	const reactivity = vibeReactivity();
	try {
		const initial = resolveOptions(options);
		const table = constructTable({
			...initial,
			features: {
				...initial.features,
				coreReactivityFeature: reactivity
			}
		});
		onScopeDispose(() => reactivity.unmount?.());
		watch(() => resolveOptions(options), (next) => table.setOptions(next), { flush: "sync" });
		return table;
	} catch (error) {
		reactivity.unmount?.();
		throw error;
	}
}
// src/rendering.ts
/**
* Checks a .vibe component's context and all required props at registration time.
* Pass the result directly as column.cell/header. No mounting or DOM work happens here.
*/
function componentRenderer(component) {
	return (context) => ({
		kind: "component",
		component,
		context
	});
}
/** Evaluates a text template or registered component without interpreting strings as HTML. */
function renderContent(template, context) {
	const content = typeof template === "function" ? template(context) : template;
	if (content === null || content === void 0 || typeof content === "string" || typeof content === "number" || typeof content === "bigint" || typeof content === "boolean") return content;
	if (typeof content === "object" && "kind" in content && content.kind === "component" && "component" in content && "context" in content) return content;
	throw new TypeError("Table content must be text or componentRenderer(Component) output. Use a .vibe component or a slot for markup.");
}
/** Narrows content for declarative dynamic-component outlets. */
function isComponentContent(content) {
	return typeof content === "object" && content !== null;
}
export { componentRenderer, isComponentContent, renderContent, useTable, useTableAtom, vibeReactivity };
