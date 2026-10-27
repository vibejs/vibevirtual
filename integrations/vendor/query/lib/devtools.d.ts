export interface QueryDevtoolsQuery {
  readonly queryHash: string;
  readonly queryKey: readonly unknown[];
  readonly status: string;
  readonly fetchStatus: string;
  readonly isStale: boolean;
  readonly observers: number;
  readonly dataUpdatedAt: number;
  readonly error: string | null;
  readonly data: unknown;
}
export interface QueryDevtoolsMutation {
  readonly mutationId: number;
  readonly mutationKey: readonly unknown[] | undefined;
  readonly status: string;
  readonly isPaused: boolean;
  readonly submittedAt: number;
  readonly variables: unknown;
  readonly error: string | null;
}
export interface QueryDevtoolsEvent {
  readonly time: number;
  readonly scope: 'query' | 'mutation';
  readonly type: string;
  readonly action: string;
  readonly detail: string;
}
export interface QueryDevtools {
  readonly queries: readonly QueryDevtoolsQuery[];
  readonly mutations: readonly QueryDevtoolsMutation[];
  readonly events: readonly QueryDevtoolsEvent[];
  clearEvents(): void;
}
/**
 * A live, read-only view of the active client's query cache, mutation cache, and recent cache
 * events. Import it from `@usevibejs/query/devtools` so production bundles that never import that
 * entry do not include it. Rendering is left to `QueryDevtools.vibe` or to application code.
 */
export declare function useQueryDevtools(): QueryDevtools;
//# sourceMappingURL=devtools.d.ts.map