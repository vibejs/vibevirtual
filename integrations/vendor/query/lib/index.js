import { a as VibeQueryError, i as useQueryClient, n as createVibeQueryPlugin, r as queryClientKey, t as assertScope } from "./client-DwdatlSC.js";
import { computed, isRef, onScopeDispose, shallowReadonly, shallowRef, toValue, watch } from "@usevibejs/ui";
import { CancelledError, InfiniteQueryObserver, InfiniteQueryObserver as InfiniteQueryObserver$1, MutationCache, MutationObserver, MutationObserver as MutationObserver$1, QueriesObserver, QueriesObserver as QueriesObserver$1, QueryCache, QueryClient, QueryObserver, QueryObserver as QueryObserver$1, dehydrate, focusManager, hashKey, hydrate, isCancelledError, keepPreviousData, matchMutation, matchQuery, onlineManager, partialMatchKey, replaceEqualDeep, skipToken } from "@tanstack/query-core";
// src/options.ts
/**
* Names a query's key and function together so `useQuery` and `queryClient.fetchQuery` share one
* type. The returned object is the same reference; the helper exists for inference and for the
* `DataTag` brand on `queryKey`.
*/
function queryOptions(options) {
	return options;
}
/** The infinite-query counterpart of {@link queryOptions}. */
function infiniteQueryOptions(options) {
	return options;
}
// src/optimistic.ts
/**
* Builds mutation callbacks that cancel in-flight fetches, write an optimistic cache value, restore
* the previous value if the mutation fails, and invalidate the query when it settles.
* Pass the result to `useMutation`. The helpers close over `queryClient`, so they can be created
* outside setup.
*/
function optimisticMutation(options) {
	const keyFor = (variables) => typeof options.queryKey === "function" ? options.queryKey(variables) : options.queryKey;
	return {
		mutationFn: options.mutationFn,
		async onMutate(variables) {
			const queryKey = keyFor(variables);
			await options.queryClient.cancelQueries({ queryKey });
			const previous = options.queryClient.getQueryData(queryKey);
			options.queryClient.setQueryData(queryKey, (current) => options.update(current, variables));
			return {
				previous,
				queryKey
			};
		},
		onError(_error, _variables, context) {
			if (context) options.queryClient.setQueryData(context.queryKey, context.previous);
		},
		onSettled(_data, _error, _variables, context) {
			if (options.invalidate === false || !context) return;
			return options.queryClient.invalidateQueries({ queryKey: context.queryKey });
		}
	};
}
// src/resolve.ts
/**
* Fields whose zero-argument functions are Vibe getters (`() => value`) rather than Query Core
* callbacks. Callbacks that declare a parameter are left intact so Query Core can call them with
* the query. `queryFn`, `select`, and page-param callbacks are never in this set: evaluating them
* while reading options would start work or depend on data the option pass does not have.
*/
const ZERO_ARG_GETTER_FIELDS = /* @__PURE__ */ new Set([
	"enabled",
	"gcTime",
	"initialPageParam",
	"maxPages",
	"mutationKey",
	"networkMode",
	"queryKey",
	"refetchInterval",
	"refetchIntervalInBackground",
	"refetchOnMount",
	"refetchOnReconnect",
	"refetchOnWindowFocus",
	"retryOnMount",
	"staleTime"
]);
function isPlainRecord(value) {
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}
function readGetter(field, getter) {
	const result = getter();
	if (result instanceof Promise) throw new VibeQueryError(`VibeQuery: \`${field}\` must be synchronous. Read reactive values in the option getter and do asynchronous work in queryFn or mutationFn.`);
	return result;
}
/**
* Copies `value`, replacing refs with their current values. Function values are kept, except
* zero-argument getters of {@link ZERO_ARG_GETTER_FIELDS}, which are called so the watcher that
* reads options subscribes to the refs they touch. `queryFn` is never called here.
*/
function cloneDeepUnref(value, field) {
	if (isRef(value)) return cloneDeepUnref(value.value, field);
	if (typeof value === "function") {
		if (field !== void 0 && ZERO_ARG_GETTER_FIELDS.has(field) && value.length === 0) return cloneDeepUnref(readGetter(field, value), field);
		return value;
	}
	if (typeof value !== "object" || value === null) return value;
	if (Array.isArray(value)) return value.map((item) => cloneDeepUnref(item));
	if (!isPlainRecord(value)) return value;
	const copy = {};
	for (const key of Object.keys(value)) copy[key] = cloneDeepUnref(value[key], key);
	return copy;
}
function isThenable(value) {
	return typeof value === "object" && value !== null && typeof value.then === "function";
}
/** The current plain value of an options bag, ref, or getter. */
function resolveOptions(source) {
	const resolved = cloneDeepUnref(toValue(source));
	if (isThenable(resolved)) throw new VibeQueryError("VibeQuery: options must be synchronous. Read reactive values in the option getter and do asynchronous work in queryFn or mutationFn.");
	if (typeof resolved !== "object" || resolved === null || Array.isArray(resolved)) throw new VibeQueryError("VibeQuery: options must be an object, a ref, or a getter.");
	return resolved;
}
// src/observer.ts
/**
* Subscribes one observer for the lifetime of the active scope and exposes a stable readonly view
* of its latest result. Property reads track the observer's notifications, so a template that reads
* `data` updates when that result changes and does not poll Query Core on its own.
*/
function useObserverResult(source, create, validate) {
	const version = shallowRef(0);
	const read = () => {
		const options = resolveOptions(source);
		validate?.(options);
		return options;
	};
	const observer = create(read());
	const unsubscribe = observer.subscribe(() => {
		version.value += 1;
	});
	onScopeDispose(unsubscribe);
	watch(read, (options) => {
		observer.setOptions(options);
		version.value += 1;
	}, { flush: "sync" });
	return expose(observer, version);
}
function expose(observer, version) {
	const sample = observer.getCurrentResult();
	const target = {};
	for (const key of Object.keys(sample)) if (typeof sample[key] === "function") target[key] = (...args) => {
		const method = observer.getCurrentResult()[key];
		return Reflect.apply(method, observer, args);
	};
	else Object.defineProperty(target, key, {
		enumerable: true,
		configurable: true,
		get() {
			version.value;
			if ("trackProp" in observer && typeof observer.trackProp === "function") observer.trackProp(key);
			return observer.getCurrentResult()[key];
		}
	});
	if (typeof target.mutate === "function") {
		const mutate = target.mutate;
		target.mutateAsync = (...args) => mutate(...args);
	}
	return shallowReadonly(target);
}
/** Requires an array `queryKey` before an observer is allowed to subscribe. */
function assertQueryKey(hook, options) {
	if (!Array.isArray(options.queryKey)) throw new VibeQueryError(`${hook}() requires queryKey to be an array.`);
}
// src/useInfiniteQuery.ts
/**
* Subscribes to an infinite query. `fetchNextPage` and `fetchPreviousPage` stay bound to this
* subscription. Page cursors belong in `initialPageParam`, `getNextPageParam`, and
* `getPreviousPageParam`; the page identity that should refetch belongs in `queryKey`.
*/
function useInfiniteQuery(options) {
	assertScope("useInfiniteQuery");
	const client = useQueryClient();
	return useObserverResult(options, (resolved) => new InfiniteQueryObserver$1(client, resolved), (resolved) => {
		assertQueryKey("useInfiniteQuery", resolved);
		if (!Object.hasOwn(resolved, "initialPageParam")) throw new VibeQueryError("useInfiniteQuery() requires initialPageParam.");
		if (typeof resolved.getNextPageParam !== "function") throw new VibeQueryError("useInfiniteQuery() requires getNextPageParam.");
	});
}
// src/useIsFetching.ts
function useCacheCount(read, subscribe) {
	const version = shallowRef(0);
	const count = computed(() => read(version));
	const unsubscribe = subscribe(() => {
		version.value += 1;
	});
	onScopeDispose(unsubscribe);
	return count;
}
/** How many queries matching `filters` are currently fetching. Omit `filters` to count them all. */
function useIsFetching(filters) {
	assertScope("useIsFetching");
	const client = useQueryClient();
	return useCacheCount((version) => {
		version.value;
		return client.isFetching(filters === void 0 ? void 0 : resolveOptions(filters));
	}, (onStoreChange) => client.getQueryCache().subscribe(onStoreChange));
}
/** How many mutations matching `filters` are currently pending. Omit `filters` to count them all. */
function useIsMutating(filters) {
	assertScope("useIsMutating");
	const client = useQueryClient();
	return useCacheCount((version) => {
		version.value;
		return client.isMutating(filters === void 0 ? void 0 : resolveOptions(filters));
	}, (onStoreChange) => client.getMutationCache().subscribe(onStoreChange));
}
// src/useMutation.ts
/**
* Subscribes to a mutation. The returned object keeps the latest status, variables, and data.
* `mutate` follows the most recently started call; earlier calls still settle their own promises
* and remain visible to `useIsMutating()`. Unmounting stops the subscription and does not cancel
* a mutation that has already started.
*/
function useMutation(options) {
	assertScope("useMutation");
	const client = useQueryClient();
	return useObserverResult(options, (resolved) => new MutationObserver$1(client, resolved));
}
// src/useQueries.ts
function useQueries(source) {
	assertScope("useQueries");
	const client = useQueryClient();
	const version = shallowRef(0);
	let combine;
	const read = () => {
		const resolved = toValue(source);
		if (typeof resolved !== "object" || resolved === null || !Array.isArray(resolved.queries)) throw new VibeQueryError("useQueries() requires a queries array.");
		return {
			queries: resolved.queries.map((query) => {
				const options = cloneDeepUnref(toValue(query));
				const queryKey = typeof options === "object" && options !== null && "queryKey" in options ? options.queryKey : void 0;
				if (typeof options !== "object" || options === null || !Array.isArray(queryKey)) throw new VibeQueryError("useQueries() requires every query to have an array queryKey.");
				return options;
			}),
			combine: resolved.combine
		};
	};
	const initial = read();
	combine = initial.combine;
	const observer = new QueriesObserver$1(client, initial.queries, { combine });
	const unsubscribe = observer.subscribe(() => {
		version.value += 1;
	});
	onScopeDispose(unsubscribe);
	watch(read, (next) => {
		combine = next.combine;
		observer.setQueries(next.queries, { combine });
		version.value += 1;
	}, { flush: "sync" });
	const results = computed(() => {
		version.value;
		const raw = observer.getCurrentResult();
		return combine ? combine(raw) : raw;
	});
	return shallowReadonly({ get results() {
		return results.value;
	} });
}
// src/useQuery.ts
function useQuery(options) {
	assertScope("useQuery");
	const client = useQueryClient();
	return useObserverResult(options, (resolved) => new QueryObserver$1(client, resolved), (resolved) => {
		assertQueryKey("useQuery", resolved);
	});
}
export { CancelledError, InfiniteQueryObserver, MutationCache, MutationObserver, QueriesObserver, QueryCache, QueryClient, QueryObserver, VibeQueryError, createVibeQueryPlugin, dehydrate, focusManager, hashKey, hydrate, infiniteQueryOptions, isCancelledError, keepPreviousData, matchMutation, matchQuery, onlineManager, optimisticMutation, partialMatchKey, queryClientKey, queryOptions, replaceEqualDeep, skipToken, useInfiniteQuery, useIsFetching, useIsMutating, useMutation, useQueries, useQuery, useQueryClient };
