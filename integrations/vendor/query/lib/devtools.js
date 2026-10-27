import { i as useQueryClient, t as assertScope } from "./client-DwdatlSC.js";
import { onScopeDispose, shallowReadonly, shallowRef } from "@usevibejs/ui";
// src/devtools.ts
const MAX_EVENTS = 50;
function errorText(error) {
	if (error == null) return null;
	if (error instanceof Error) return error.message;
	return String(error);
}
function actionType(event) {
	if (!("action" in event)) return "";
	const action = event.action;
	return String(action.type);
}
function queryRows(client) {
	return client.getQueryCache().getAll().map((query) => ({
		queryHash: query.queryHash,
		queryKey: query.queryKey,
		status: query.state.status,
		fetchStatus: query.state.fetchStatus,
		isStale: query.isStale(),
		observers: query.getObserversCount(),
		dataUpdatedAt: query.state.dataUpdatedAt,
		error: errorText(query.state.error),
		data: query.state.data
	}));
}
function mutationRows(client) {
	return client.getMutationCache().getAll().map((mutation) => ({
		mutationId: mutation.mutationId,
		mutationKey: mutation.options.mutationKey,
		status: mutation.state.status,
		isPaused: mutation.state.isPaused,
		submittedAt: mutation.state.submittedAt,
		variables: mutation.state.variables,
		error: errorText(mutation.state.error)
	}));
}
function detailFor(event, scope) {
	if (scope === "query") return event.query.queryHash;
	const mutation = event.mutation;
	return mutation ? String(mutation.mutationId) : "";
}
/**
* A live, read-only view of the active client's query cache, mutation cache, and recent cache
* events. Import it from `@usevibejs/query/devtools` so production bundles that never import that
* entry do not include it. Rendering is left to `QueryDevtools.vibe` or to application code.
*/
function useQueryDevtools() {
	assertScope("useQueryDevtools");
	const client = useQueryClient();
	const version = shallowRef(0);
	const events = [];
	const push = (event, scope) => {
		events.push({
			time: Date.now(),
			scope,
			type: String(event.type),
			action: actionType(event),
			detail: detailFor(event, scope)
		});
		if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
		version.value += 1;
	};
	const unsubscribeQuery = client.getQueryCache().subscribe((event) => {
		push(event, "query");
	});
	const unsubscribeMutation = client.getMutationCache().subscribe((event) => {
		push(event, "mutation");
	});
	onScopeDispose(() => {
		unsubscribeQuery();
		unsubscribeMutation();
	});
	return shallowReadonly({
		get queries() {
			version.value;
			return queryRows(client);
		},
		get mutations() {
			version.value;
			return mutationRows(client);
		},
		get events() {
			version.value;
			return events.slice();
		},
		clearEvents() {
			events.length = 0;
			version.value += 1;
		}
	});
}
export { useQueryDevtools };
