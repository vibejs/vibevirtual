import { a as useMotionSettings, i as provideMotionConfig, o as useReducedMotion, r as motionConfigKey, t as createAnimate } from "./engine-uwti5lxH.js";
import { animate } from "motion/mini";
// src/mini.ts
/**
* Like `useAnimate()` from `@usevibejs/motion`, on Motion's mini engine: Web Animations API only,
* for element keyframes, without springs on independent transforms, motion values or sequences.
* With reduced motion or `skipAnimations`, animations jump to their end state.
*/
function useAnimate(root) {
	const engine = (element, keyframes, options = {}) => {
		const { reduceMotion, skipAnimations, ...rest } = options;
		return animate(element, keyframes, reduceMotion || skipAnimations ? {
			...rest,
			duration: 0,
			delay: 0
		} : rest);
	};
	return createAnimate(useMotionSettings(), root, engine);
}
export { motionConfigKey, provideMotionConfig, useAnimate, useReducedMotion };
