import { ComputedRef, InjectionKey, MaybeRefOrGetter } from "@usevibejs/ui";
import { AnimationOptions } from "motion";
/**
 * - `'user'` follows the `prefers-reduced-motion` media query (default).
 * - `'always'` reduces motion regardless of the preference.
 * - `'never'` ignores the preference; only for motion that carries meaning, never for decoration.
 */
type ReducedMotionSetting = 'user' | 'always' | 'never';
interface MotionConfig {
  /** How VibeMotion reacts to `prefers-reduced-motion`. Defaults to `'user'`. */
  reducedMotion?: ReducedMotionSetting;
  /** Jump every animation to its end state. For tests, screenshots or an app-level switch. */
  skipAnimations?: boolean;
  /** The default transition merged under every animation's own options. */
  transition?: AnimationOptions;
}
/** The injection key behind `provideMotionConfig()`. `app.provide(motionConfigKey, config)` sets it app-wide. */
declare const motionConfigKey: InjectionKey<MaybeRefOrGetter<MotionConfig>>;
/** Sets the motion configuration for the calling component and its descendants. */
declare function provideMotionConfig(config: MaybeRefOrGetter<MotionConfig>): void;
/**
 * Whether motion should be reduced: the user's `prefers-reduced-motion` preference combined with
 * the nearest `provideMotionConfig()`. Updates when either changes.
 */
declare function useReducedMotion(): ComputedRef<boolean>;
/**
 * An element, a ref or template ref holding one, or a getter returning one. `null` and
 * `undefined` mean "not rendered yet": the composable waits for the element to appear.
 */
type ElementTarget<E extends Element = Element> = MaybeRefOrGetter<E | null | undefined>;
export { provideMotionConfig as a, motionConfigKey as i, MotionConfig as n, useReducedMotion as o, ReducedMotionSetting as r, ElementTarget as t };
//# sourceMappingURL=internal-CF0d7Hh6.d.ts.map