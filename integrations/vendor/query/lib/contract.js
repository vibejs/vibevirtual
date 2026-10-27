// src/contract.ts
/**
* A failed `ApiResult` thrown so Query Core records it as a query or mutation error.
* HTTP and network failures from `@usevibejs/contract` resolve instead of rejecting; this error
* is the boundary between that result and Query Core.
*/
var ApiResultError = class extends Error {
	name = "ApiResultError";
	problem;
	response;
	code;
	status;
	constructor(problem, response) {
		super(problem.detail ?? problem.title);
		this.problem = problem;
		this.response = response;
		this.code = problem.code;
		this.status = problem.status;
	}
};
/** The success data of `result`, or an {@link ApiResultError} when `result.ok` is false. */
function unwrapApiResult(result) {
	if (result.ok) return result.data;
	throw new ApiResultError(result.error, result.response);
}
/**
* Unwraps a contract call for `queryFn` and `mutationFn`.
* `ApiResult` is accepted structurally, so a typed contract client keeps its success type.
*
* @example
* queryFn: ({ signal }) => fromApiResult(api.users.one({ params: { id } }, { signal }))
*/
function fromApiResult(result) {
	return Promise.resolve(result).then((value) => unwrapApiResult(value));
}
export { ApiResultError, fromApiResult, unwrapApiResult };
