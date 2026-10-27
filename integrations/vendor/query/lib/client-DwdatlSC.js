import { getCurrentScope, hasInjectionContext, inject } from "@usevibejs/ui";
import { QueryClient } from "@tanstack/query-core";
// src/errors.ts
/** Raised when VibeQuery is used outside a supported setup or with options it cannot apply. */
var VibeQueryError = class extends Error {
	name = "VibeQueryError";
};
// src/client.ts
/** App-level key for the `QueryClient` installed by {@link createVibeQueryPlugin}. */
const queryClientKey = Symbol("vibequery.QueryClient");
function createClient(options) {
	if (options instanceof QueryClient) return options;
	return options.queryClient ?? new QueryClient(options.queryClientConfig);
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
function createVibeQueryPlugin(options = {}) {
	const client = createClient(options);
	return { install(app) {
		client.mount();
		app.provide(queryClientKey, client);
		app.onUnmount(() => {
			client.unmount();
		});
	} };
}
/**
* The `QueryClient` provided by the surrounding application. Pass `override` to use a specific
* client, which is how tests and helpers target a client without an injection context.
*/
function useQueryClient(override) {
	if (override) return override;
	if (!hasInjectionContext()) throw new VibeQueryError("useQueryClient() must run inside a component setup or app.runWithContext() after createVibeQueryPlugin() is installed.");
	const client = inject(queryClientKey);
	if (!client) throw new VibeQueryError("No QueryClient was provided. Install createVibeQueryPlugin() with app.use().");
	return client;
}
/** Throws when `hook` runs outside a component setup or an effect scope. */
function assertScope(hook) {
	if (!getCurrentScope()) throw new VibeQueryError(`${hook}() must be called inside a component setup or an effect scope.`);
}
export { VibeQueryError as a, useQueryClient as i, createVibeQueryPlugin as n, queryClientKey as r, assertScope as t };
