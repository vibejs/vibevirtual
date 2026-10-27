import { a as provideMotionConfig, i as motionConfigKey, n as MotionConfig, o as useReducedMotion, r as ReducedMotionSetting, t as ElementTarget } from "./internal-CF0d7Hh6.js";
import { AnimationOptions, AnimationPlaybackControlsWithThen, DOMKeyframesDefinition, ElementOrSelector } from "motion";
export interface MiniAnimate {
  (element: ElementOrSelector, keyframes: DOMKeyframesDefinition, options?: AnimationOptions): AnimationPlaybackControlsWithThen;
  stop(): void;
  readonly running: number;
}
/**
 * Like `useAnimate()` from `@usevibejs/motion`, on Motion's mini engine: Web Animations API only,
 * for element keyframes, without springs on independent transforms, motion values or sequences.
 * With reduced motion or `skipAnimations`, animations jump to their end state.
 */
export declare function useAnimate(root?: ElementTarget): MiniAnimate;
export { type ElementTarget, type MotionConfig, type ReducedMotionSetting, motionConfigKey, provideMotionConfig, useReducedMotion };
//# sourceMappingURL=mini.d.ts.map