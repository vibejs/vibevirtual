import { effectScope, onScopeDispose } from "@usevibejs/ui";
// src/shared/resource.ts
/** A private child scope owns watchers as well as nested composables. */
function resource(setup) {
	const scope = effectScope();
	try {
		const result = scope.run(() => setup(onScopeDispose, () => scope.active));
		if (!result) throw new Error("VibeUse cannot allocate resources inside a stopped scope.");
		return Object.assign(result, { stop: () => scope.stop() });
	} catch (error) {
		scope.stop();
		throw error;
	}
}
const defaultWindow = () => typeof window === "undefined" ? void 0 : window;
const defaultDocument = () => defaultWindow()?.document;
const defaultNavigator = () => defaultWindow()?.navigator;
export { resource as i, defaultNavigator as n, defaultWindow as r, defaultDocument as t };
