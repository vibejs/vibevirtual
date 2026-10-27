import { ApiError, ApiResult, Route, RouteData } from "@usevibejs/contract";
interface ProblemLike {
  readonly code: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
}
/**
 * A failed `ApiResult` thrown so Query Core records it as a query or mutation error.
 * HTTP and network failures from `@usevibejs/contract` resolve instead of rejecting; this error
 * is the boundary between that result and Query Core.
 */
export declare class ApiResultError<E extends ProblemLike = ProblemLike> extends Error {
  readonly name = "ApiResultError";
  readonly problem: E;
  readonly response: Response | undefined;
  readonly code: string;
  readonly status: number;
  constructor(problem: E, response: Response | undefined);
}
interface ApiSuccess<T> {
  readonly ok: true;
  readonly data: T;
  readonly response: Response;
}
interface ApiFailure<E extends ProblemLike> {
  readonly ok: false;
  readonly error: E;
  readonly response: Response | undefined;
}
/** The success data of `result`, or an {@link ApiResultError} when `result.ok` is false. */
export declare function unwrapApiResult<T, E extends ProblemLike>(result: ApiSuccess<T> | ApiFailure<E>): T;
/**
 * Unwraps a contract call for `queryFn` and `mutationFn`.
 * `ApiResult` is accepted structurally, so a typed contract client keeps its success type.
 *
 * @example
 * queryFn: ({ signal }) => fromApiResult(api.users.one({ params: { id } }, { signal }))
 */
export declare function fromApiResult<T, E extends ProblemLike>(result: ApiSuccess<T> | ApiFailure<E> | Promise<ApiSuccess<T> | ApiFailure<E>>): Promise<T>;
export type { ApiError, ApiResult, Route, RouteData };
//# sourceMappingURL=contract.d.ts.map