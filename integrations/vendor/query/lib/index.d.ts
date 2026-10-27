import { ComputedRef, InjectionKey, MaybeRefOrGetter, Plugin, Ref } from "@usevibejs/ui";
import { CancelOptions, CancelledError, DataTag, DataTag as DataTag$1, DefaultError, DefaultError as DefaultError$1, DefaultOptions, DefinedQueryObserverResult, DefinedQueryObserverResult as DefinedQueryObserverResult$1, DehydratedState, FetchNextPageOptions, FetchPreviousPageOptions, InfiniteData, InfiniteData as InfiniteData$1, InfiniteQueryObserver, InfiniteQueryObserverOptions, InfiniteQueryObserverResult, InfiniteQueryObserverResult as InfiniteQueryObserverResult$1, InvalidateOptions, MutationCache, MutationFilters, MutationFilters as MutationFilters$1, MutationFunction, MutationFunction as MutationFunction$1, MutationFunctionContext, MutationKey, MutationObserver, MutationObserverOptions, MutationObserverOptions as MutationObserverOptions$1, MutationObserverResult, MutationObserverResult as MutationObserverResult$1, MutationState, QueriesObserver, QueryCache, QueryClient, QueryClient as QueryClient$1, QueryClientConfig, QueryFilters, QueryFilters as QueryFilters$1, QueryFunction, QueryFunctionContext, QueryKey, QueryKey as QueryKey$1, QueryObserver, QueryObserverOptions, QueryObserverOptions as QueryObserverOptions$1, QueryObserverResult, QueryObserverResult as QueryObserverResult$1, QueryState, RefetchOptions, SkipToken, dehydrate, focusManager, hashKey, hydrate, isCancelledError, keepPreviousData, matchMutation, matchQuery, onlineManager, partialMatchKey, replaceEqualDeep, skipToken } from "@tanstack/query-core";
/** Raised when VibeQuery is used outside a supported setup or with options it cannot apply. */
export declare class VibeQueryError extends Error {
  readonly name = "VibeQueryError";
}
/** App-level key for the `QueryClient` installed by {@link createVibeQueryPlugin}. */
export declare const queryClientKey: InjectionKey<QueryClient$1>;
/** Options for {@link createVibeQueryPlugin}. Pass a `QueryClient` directly to use that instance. */
interface VibeQueryPluginOptions {
  /** An existing client. When omitted, the plugin builds one from `queryClientConfig`. */
  readonly queryClient?: QueryClient$1;
  /** Forwarded to `new QueryClient` when `queryClient` is omitted. */
  readonly queryClientConfig?: QueryClientConfig;
}
/**
 * Installs a `QueryClient` on the application. `app.use(plugin)` provides the client to
 * `useQueryClient()` and mounts Query Core's focus and online listeners. Each application that
 * installs the plugin holds one mount; the listeners disconnect when the last of those
 * applications unmounts. The client and its cache stay in memory, so a shared client can outlive
 * one application without leaking listeners into the next.
 *
 * Creating the plugin does not install a process-wide singleton. Two applications that do not
 * share a client cannot see each other's queries.
 */
export declare function createVibeQueryPlugin(options?: QueryClient$1 | VibeQueryPluginOptions): Plugin;
/**
 * The `QueryClient` provided by the surrounding application. Pass `override` to use a specific
 * client, which is how tests and helpers target a client without an injection context.
 */
export declare function useQueryClient(override?: QueryClient$1): QueryClient$1;
type AllowRefDistributed<T> = T extends ((...args: never[]) => unknown) ? T | Ref<T> | ComputedRef<T> : T extends readonly unknown[] ? { readonly [K in keyof T]: AllowRef<T[K]>; } | Ref<T> | ComputedRef<T> : T extends object ? { readonly [K in keyof T]: AllowRef<T[K]>; } | Ref<T> | ComputedRef<T> : T | Ref<T> | ComputedRef<T>;
/**
 * `boolean` option unions distribute into `Ref<true> | Ref<false>`, which rejects `ref(false)`.
 * When the field can be any boolean, accept a boolean ref as well.
 */
type AllowRef<T> = [boolean] extends [T] ? AllowRefDistributed<T> | Ref<boolean> | ComputedRef<boolean> : AllowRefDistributed<T>;
type ReactiveFields<T> = { readonly [K in keyof T]: AllowRef<T[K]>; };
/**
 * `QueryObserverOptions` whose fields may be refs, computed refs, or — for `queryKey` — a getter.
 * Callbacks such as `queryFn` and `select` stay functions. A ref holding one of those callbacks is
 * unwrapped; the callback itself runs only when Query Core fetches or selects.
 */
type UseQueryOptions<TQueryFnData = unknown, TError = DefaultError$1, TData = TQueryFnData, TQueryKey extends QueryKey$1 = QueryKey$1> = ReactiveFields<QueryObserverOptions$1<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>> & {
  readonly queryKey: MaybeRefOrGetter<TQueryKey>;
};
/** Options for {@link import('./useInfiniteQuery.ts').useInfiniteQuery}. */
type UseInfiniteQueryOptions<TQueryFnData = unknown, TError = DefaultError$1, TData = InfiniteData$1<TQueryFnData>, TQueryKey extends QueryKey$1 = QueryKey$1, TPageParam = unknown> = ReactiveFields<InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>> & {
  readonly queryKey: MaybeRefOrGetter<TQueryKey>;
};
/**
 * Names a query's key and function together so `useQuery` and `queryClient.fetchQuery` share one
 * type. The returned object is the same reference; the helper exists for inference and for the
 * `DataTag` brand on `queryKey`.
 */
export declare function queryOptions<TQueryFnData = unknown, TError = DefaultError$1, TData = TQueryFnData, TQueryKey extends QueryKey$1 = QueryKey$1>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  readonly queryKey: DataTag$1<TQueryKey, TQueryFnData, TError>;
};
/** The infinite-query counterpart of {@link queryOptions}. */
export declare function infiniteQueryOptions<TQueryFnData = unknown, TError = DefaultError$1, TData = InfiniteData$1<TQueryFnData>, TQueryKey extends QueryKey$1 = QueryKey$1, TPageParam = unknown>(options: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
  readonly queryKey: DataTag$1<TQueryKey, TQueryFnData, TError>;
};
/** The cache snapshot `optimisticMutation` restores when the mutation fails. */
interface OptimisticContext<TQuery> {
  readonly previous: TQuery | undefined;
  readonly queryKey: QueryKey$1;
}
interface OptimisticMutationOptions<TData, TVariables, TQuery> {
  readonly queryClient: QueryClient$1;
  readonly mutationFn: MutationFunction$1<TData, TVariables>;
  /** A key, or a function of the mutation variables when the target query depends on them. */
  readonly queryKey: QueryKey$1 | ((variables: TVariables) => QueryKey$1);
  /** Returns the cache value to show until the mutation settles. */
  readonly update: (current: TQuery | undefined, variables: TVariables) => TQuery;
  /**
   * When `true` (the default), the targeted query is invalidated after the mutation settles so
   * active observers refetch the server value.
   */
  readonly invalidate?: boolean;
}
/**
 * Builds mutation callbacks that cancel in-flight fetches, write an optimistic cache value, restore
 * the previous value if the mutation fails, and invalidate the query when it settles.
 * Pass the result to `useMutation`. The helpers close over `queryClient`, so they can be created
 * outside setup.
 */
export declare function optimisticMutation<TData, TVariables = void, TQuery = unknown, TError = DefaultError$1>(options: OptimisticMutationOptions<TData, TVariables, TQuery>): MutationObserverOptions$1<TData, TError, TVariables, OptimisticContext<TQuery>>;
/**
 * Subscribes to an infinite query. `fetchNextPage` and `fetchPreviousPage` stay bound to this
 * subscription. Page cursors belong in `initialPageParam`, `getNextPageParam`, and
 * `getPreviousPageParam`; the page identity that should refetch belongs in `queryKey`.
 */
export declare function useInfiniteQuery<TQueryFnData, TError = DefaultError$1, TData = InfiniteData$1<TQueryFnData>, TQueryKey extends QueryKey$1 = QueryKey$1, TPageParam = unknown>(options: MaybeRefOrGetter<UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>>): InfiniteQueryObserverResult$1<TData, TError>;
/** How many queries matching `filters` are currently fetching. Omit `filters` to count them all. */
export declare function useIsFetching(filters?: MaybeRefOrGetter<QueryFilters$1>): ComputedRef<number>;
/** How many mutations matching `filters` are currently pending. Omit `filters` to count them all. */
export declare function useIsMutating(filters?: MaybeRefOrGetter<MutationFilters$1>): ComputedRef<number>;
type UseMutationReturn<TData = unknown, TError = DefaultError$1, TVariables = void, TOnMutateResult = unknown> = MutationObserverResult$1<TData, TError, TVariables, TOnMutateResult> & {
  /**
   * Runs the mutation and resolves with its data, or rejects with its error.
   * `mutate` is the same function: Query Core's observer method returns a promise.
   */
  readonly mutateAsync: MutationObserverResult$1<TData, TError, TVariables, TOnMutateResult>['mutate'];
};
/**
 * `MutationObserverOptions` with a synchronous or asynchronous `mutationFn`, and a `mutationKey`
 * that may be a ref or a zero-argument getter.
 */
type UseMutationOptions<TData = unknown, TError = DefaultError$1, TVariables = void, TOnMutateResult = unknown> = Omit<MutationObserverOptions$1<TData, TError, TVariables, TOnMutateResult>, 'mutationFn' | 'mutationKey'> & {
  readonly mutationFn?: (variables: TVariables, context: MutationFunctionContext) => TData | Promise<TData>;
  readonly mutationKey?: MaybeRefOrGetter<MutationKey>;
};
/**
 * Subscribes to a mutation. The returned object keeps the latest status, variables, and data.
 * `mutate` follows the most recently started call; earlier calls still settle their own promises
 * and remain visible to `useIsMutating()`. Unmounting stops the subscription and does not cancel
 * a mutation that has already started.
 */
export declare function useMutation<TData = unknown, TError = DefaultError$1, TVariables = void, TOnMutateResult = unknown>(options: MaybeRefOrGetter<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>>): UseMutationReturn<TData, TError, TVariables, TOnMutateResult>;
type AnyOptions = QueryObserverOptions$1<any, any, any, any, any>;
interface UseQueriesOptions<TCombined> {
  readonly queries: readonly MaybeRefOrGetter<AnyOptions>[];
  readonly combine?: (results: readonly QueryObserverResult$1[]) => TCombined;
}
/**
 * Subscribes to several queries with one observer set. Observers are reused when a query hash
 * stays the same and replaced when the list changes. `results` is either the per-query results or
 * the value returned by `combine`.
 */
export declare function useQueries<TCombined>(source: MaybeRefOrGetter<UseQueriesOptions<TCombined> & {
  readonly combine: (results: readonly QueryObserverResult$1[]) => TCombined;
}>): {
  readonly results: TCombined;
};
export declare function useQueries(source: MaybeRefOrGetter<UseQueriesOptions<readonly QueryObserverResult$1[]>>): {
  readonly results: readonly QueryObserverResult$1[];
};
/**
 * Subscribes to a query for the lifetime of the active component or effect scope.
 *
 * The returned object is stable. Read `data`, `error`, and the status flags on it in the template
 * or in a `computed`/`watch`. Destructuring copies the current values and does not stay reactive.
 * Put every value that should start a new request in `queryKey`. `queryFn` receives an
 * `AbortSignal` and is not called while the options are read.
 */
export declare function useQuery<TQueryFnData, TError = DefaultError$1, TData = TQueryFnData, TQueryKey extends QueryKey$1 = QueryKey$1>(options: MaybeRefOrGetter<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  readonly initialData: TQueryFnData | (() => TQueryFnData);
}>): DefinedQueryObserverResult$1<TData, TError>;
export declare function useQuery<TQueryFnData, TError = DefaultError$1, TData = TQueryFnData, TQueryKey extends QueryKey$1 = QueryKey$1>(options: MaybeRefOrGetter<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>>): QueryObserverResult$1<TData, TError>;
export { type CancelOptions, CancelledError, type DataTag, type DefaultError, type DefaultOptions, type DefinedQueryObserverResult, type DehydratedState, type FetchNextPageOptions, type FetchPreviousPageOptions, type InfiniteData, InfiniteQueryObserver, type InfiniteQueryObserverResult, type InvalidateOptions, MutationCache, type MutationFilters, type MutationFunction, MutationObserver, type MutationObserverOptions, type MutationObserverResult, type MutationState, type OptimisticContext, type OptimisticMutationOptions, QueriesObserver, QueryCache, QueryClient, type QueryFilters, type QueryFunction, type QueryFunctionContext, type QueryKey, QueryObserver, type QueryObserverOptions, type QueryObserverResult, type QueryState, type RefetchOptions, type SkipToken, type UseInfiniteQueryOptions, type UseMutationOptions, type UseMutationReturn, type UseQueriesOptions, type UseQueryOptions, type VibeQueryPluginOptions, dehydrate, focusManager, hashKey, hydrate, isCancelledError, keepPreviousData, matchMutation, matchQuery, onlineManager, partialMatchKey, replaceEqualDeep, skipToken };
//# sourceMappingURL=index.d.ts.map