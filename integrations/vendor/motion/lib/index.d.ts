import { a as provideMotionConfig, i as motionConfigKey, n as MotionConfig, o as useReducedMotion, r as ReducedMotionSetting, t as ElementTarget } from "./internal-CF0d7Hh6.js";
import { MaybeRefOrGetter, Ref, ShallowRef } from "@usevibejs/ui";
import { AnimationOptions, AnimationOptions as AnimationOptions$1, AnimationPlaybackControls, AnimationPlaybackControls as AnimationPlaybackControls$1, AnimationPlaybackControlsWithThen, AnimationPlaybackControlsWithThen as AnimationPlaybackControlsWithThen$1, AnimationSequence, DOMKeyframesDefinition, DOMKeyframesDefinition as DOMKeyframesDefinition$1, DragOptions, DragOptions as DragOptions$1, Easing, EventOptions, MotionValue, MotionValue as MotionValue$1, PanInfo, PanInfo as PanInfo$1, SpringOptions, SpringOptions as SpringOptions$1, TransformOptions, Transition, animateLayout, animateView, animateView as animateView$1, anticipate, backIn, backInOut, backOut, circIn, circInOut, circOut, createScopedAnimate, cubicBezier, easeIn, easeInOut, easeOut, inView, inertia, isMotionValue, mapValue, mix, motionValue, scroll, spring, springValue, stagger, steps, transformValue } from "motion";
/** Motion's `animate()` signatures: elements, selectors, motion values, numbers, objects and sequences. */
type AnimateFunction = ReturnType<typeof createScopedAnimate>;
type ScopedAnimate = AnimateFunction & {
  /** Stops every animation this function started that is still running. */
  stop(): void;
  /** The number of animations still running. */
  readonly running: number;
};
/**
 * Returns Motion's `animate()` bound to the calling scope: animations respect reduced motion and
 * the nearest `provideMotionConfig()`, and are stopped when the component unmounts or the effect
 * scope stops. Calls after disposal start nothing and return an already finished animation.
 * With `root`, selector strings resolve inside that element instead of the whole document.
 *
 * ```ts
 * const root = useTemplateRef<HTMLElement>('root')
 * const animate = useAnimate(root)
 * onMounted(() => animate('li', { opacity: [0, 1], y: [12, 0] }, { delay: stagger(0.05) }))
 * ```
 */
export declare function useAnimate(root?: ElementTarget): ScopedAnimate;
type MotionPlayState = 'idle' | 'running' | 'paused' | 'finished';
/**
 * Reactive playback controls around the latest Motion animation handed to `set()`. The play
 * state and speed are reactive; `time` is read and written on demand so that a running animation
 * never schedules a Vibe.js update per frame.
 */
interface MotionControls {
  /** The animation being controlled, `null` before the first one. */
  readonly animation: Readonly<ShallowRef<AnimationPlaybackControls$1 | null>>;
  readonly state: Readonly<Ref<MotionPlayState>>;
  /** Playback rate. Writing it changes the current animation and every later one. */
  readonly speed: Ref<number>;
  /** The current time of the animation in seconds (not reactive). */
  time: number;
  /** The duration in seconds, `0` without an animation (not reactive). */
  readonly duration: number;
  /** Resolves when the current animation finishes, immediately without one. */
  readonly finished: Promise<void>;
  /** Takes control of `animation`; the previous one keeps running unless stopped first. */
  set<A extends AnimationPlaybackControls$1>(animation: A): A;
  play(): void;
  pause(): void;
  /** Stops at the current values. The animation cannot resume. */
  stop(): void;
  /** Stops and reverts to the values before the animation started. */
  cancel(): void;
  /** Jumps to the end state. */
  complete(): void;
}
export declare function useMotionControls(): MotionControls;
/** Options of Motion's `inView()`: `root`, `margin` and `amount`. */
type InViewOptions = NonNullable<Parameters<typeof inView>[2]>;
type ScrollOffset = NonNullable<NonNullable<Parameters<typeof scroll>[1]>['offset']>;
interface UseScrollOptions {
  /** The scrolling element; the page when omitted. A template ref waits for its element. */
  container?: ElementTarget;
  /** Track this element's progress through the container instead of the container's own scroll. */
  target?: ElementTarget;
  /** Where tracking starts and ends, for example `['start end', 'end start']`. */
  offset?: ScrollOffset;
  axis?: 'x' | 'y';
}
interface ScrollValues {
  readonly scrollX: MotionValue$1<number>;
  readonly scrollY: MotionValue$1<number>;
  readonly scrollXProgress: MotionValue$1<number>;
  readonly scrollYProgress: MotionValue$1<number>;
  stop(): void;
}
/**
 * Scroll position and progress as motion values, from Motion's `scroll()`, which shares one
 * listener per container and measures only on resize. The values are destroyed with the scope.
 * Feed them to `useTransform()` and `useMotionStyle()` for parallax and progress bars.
 */
export declare function useScroll(options?: UseScrollOptions): ScrollValues;
interface ScrollAnimationOptions extends UseScrollOptions {
  /** Options of the animation; `ease` maps scroll progress to animation progress. */
  transition?: AnimationOptions$1;
}
/**
 * Links an animation's progress to scroll. Motion drives it with a native `ScrollTimeline` where
 * the browser supports one, off the main thread. With reduced motion, the element stays in its
 * resting styles and nothing is linked.
 */
export declare function useScrollAnimation(element: ElementTarget, keyframes: DOMKeyframesDefinition$1, options?: ScrollAnimationOptions): {
  stop(): void;
};
interface UseInViewOptions extends InViewOptions {
  /** Stop observing after the first entry. */
  once?: boolean;
  onEnter?: (entry: IntersectionObserverEntry) => void;
  onLeave?: (entry: IntersectionObserverEntry) => void;
}
/** Whether the element intersects the viewport (or `root`), from Motion's shared `inView()` observers. */
export declare function useInView(target: ElementTarget, options?: UseInViewOptions): {
  readonly isInView: Readonly<Ref<boolean>>;
  stop(): void;
};
/** A keyframe target with an optional transition that overrides the default one. */
type MotionTarget = DOMKeyframesDefinition$1 & {
  transition?: AnimationOptions$1;
};
/** Named targets. */
type Variants<V extends string = string> = Record<V, MotionTarget>;
/** A target, a variant name, or variant names merged left to right. */
type TargetOrVariant<V extends string = string> = MotionTarget | V | readonly V[];
interface ViewportOptions extends InViewOptions {
  /** Keep the `inView` state once the element has entered. Defaults to `false`. */
  once?: boolean;
}
interface UseMotionOptions<V extends string = string> {
  /** Named targets that the other options can refer to by name. */
  variants?: MaybeRefOrGetter<Variants<V>>;
  /**
   * The state the element starts in when it appears; `false` jumps straight to `animate`
   * without animating. Omitted, the element animates from its current styles.
   */
  initial?: TargetOrVariant<NoInfer<V>> | false;
  /** The resting target. A ref or getter is watched: each change animates from the current values. */
  animate?: MaybeRefOrGetter<TargetOrVariant<NoInfer<V>> | undefined>;
  /** The default transition. Reactive; a change applies to the next animation. */
  transition?: MaybeRefOrGetter<AnimationOptions$1 | undefined>;
  /** Applied while a pointer hovers the element. Touch input is ignored. */
  hover?: TargetOrVariant<NoInfer<V>>;
  /** Applied while the element is pressed by a pointer, or by Enter on a focused element. */
  press?: TargetOrVariant<NoInfer<V>>;
  /** Applied while the element intersects the viewport, or `viewport.root`. */
  inView?: TargetOrVariant<NoInfer<V>>;
  viewport?: ViewportOptions;
  /** Continuation preserves Motion's velocity; replace stops first; cancel reverts first. */
  interrupt?: 'continue' | 'replace' | 'cancel';
  /** Called when an animation to a new target starts. */
  onAnimationStart?: (target: Record<string, unknown>) => void;
  /** Called when an animation completes without being interrupted by a newer one. */
  onAnimationComplete?: (target: Record<string, unknown>) => void;
}
interface MotionHandle<V extends string = string> {
  readonly controls: MotionControls;
  readonly isHovered: Readonly<Ref<boolean>>;
  readonly isPressed: Readonly<Ref<boolean>>;
  readonly isInView: Readonly<Ref<boolean>>;
  /** Whether an animation of this element is running. */
  readonly isAnimating: Readonly<Ref<boolean>>;
  /**
   * Animates to a target or variant once, outside the declared states. The next state change
   * animates back to the declared target. Resolves when the animation ends.
   */
  start(definition: TargetOrVariant<V>, transition?: AnimationOptions$1): Promise<void>;
  /** Stops the running animation at its current values. */
  stop(): void;
  /** Stops tracking the element and its gestures. Called automatically with the scope. */
  dispose(): void;
}
/**
 * Animates one element declaratively: an initial state, a reactive `animate` target, named
 * variants, and hover, press and viewport states layered on top in that order of priority.
 * A new target interrupts the running animation and continues from the current values, keeping
 * spring velocity. Gestures and observers are bound to the element of the template ref and move
 * with it when it is replaced.
 *
 * ```ts
 * const card = useTemplateRef<HTMLElement>('card')
 * useMotion(card, {
 *   initial: { opacity: 0, y: 16 },
 *   animate: { opacity: 1, y: 0 },
 *   hover: { scale: 1.03 },
 *   press: { scale: 0.97 },
 *   transition: { type: 'spring', bounce: 0.25 },
 * })
 * ```
 */
export declare function useMotion<const V extends string = string>(target: ElementTarget<HTMLElement | SVGElement>, options: UseMotionOptions<V>): MotionHandle<V>;
/** A Motion value, destroyed when the calling scope stops. Changing it never re-renders Vibe.js. */
export declare function useMotionValue<T>(initial: T): MotionValue$1<T>;
type SpringSource = number | MotionValue$1<number> | MaybeRefOrGetter<number>;
/**
 * A motion value that follows `source` with a spring: a number, a motion value, or a ref or getter
 * of a number. `options` can be reactive; a change applies from the current velocity. With reduced
 * motion the value follows its source instantly.
 */
export declare function useSpring(source: SpringSource, options?: MaybeRefOrGetter<SpringOptions$1 | undefined>): MotionValue$1<number>;
/**
 * A derived motion value.
 * - `useTransform(() => x.get() * 2)` recomputes from the motion values the function reads.
 * - `useTransform(progress, [0, 1], ['#fff', '#000'])` maps a number through ranges, with clamping
 *   and easing from `options`.
 */
export declare function useTransform<O>(compute: () => O): MotionValue$1<O>;
export declare function useTransform<O>(input: MotionValue$1<number>, inputRange: number[], outputRange: O[], options?: TransformOptions<O>): MotionValue$1<O>;
/**
 * Opts in to reactive observation of a motion value: a readonly ref updated on each change (each explicit set may emit). Use it for text or logic; bind motion values to styles with
 * `useMotionStyle()` instead, which skips Vibe.js rendering entirely.
 */
export declare function useMotionValueState<T>(value: MotionValue$1<T>): Readonly<Ref<T>>;
/** Reads the velocity of a motion value in units per second (not reactive). */
export declare const getVelocity: (value: MotionValue$1<number>) => number;
type EffectValues = Record<string, MotionValue$1 | string | number>;
/**
 * Binds motion values (or static values) to the element's styles through Motion's frame loop,
 * batching writes once per frame. Transforms such as `x`, `scale` and `rotate` compose into one
 * `transform`. Vibe.js owns the other style bindings; do not bind the same property in both.
 */
export declare function useMotionStyle(target: ElementTarget<HTMLElement | SVGElement>, styles: MaybeRefOrGetter<EffectValues>): () => void;
/** Binds motion values to attributes, for example an SVG path's `pathLength` or a `d` string. */
export declare function useMotionAttrs(target: ElementTarget<HTMLElement | SVGElement>, attrs: MaybeRefOrGetter<EffectValues>): () => void;
interface HoverOptions extends EventOptions {
  onStart?: (event: PointerEvent) => void;
  onEnd?: (event: PointerEvent) => void;
}
interface GestureHandle {
  /** Removes the gesture. Called automatically when the scope stops. */
  stop(): void;
}
/**
 * Tracks pointer hover with Motion's `hover()` gesture, which ignores emulated touch hover.
 * Follows the element of the template ref when it is replaced.
 */
export declare function useHover(target: ElementTarget, options?: HoverOptions): GestureHandle & {
  readonly isHovered: Readonly<Ref<boolean>>;
};
interface PressOptions extends EventOptions {
  /** Listen for the release on `window`, so dragging off the element still ends the press. */
  useGlobalTarget?: boolean;
  stopPropagation?: boolean;
  onStart?: (event: PointerEvent) => void;
  /** The press ended on the element (or with Enter): an activation. */
  onEnd?: (event: PointerEvent) => void;
  /** The press ended off the element, or was cancelled. */
  onCancel?: (event: PointerEvent) => void;
}
/**
 * Tracks presses with Motion's `press()` gesture: primary pointer only, Enter on focused elements,
 * and cancellation when the pointer is released outside. Elements that are not natively focusable
 * receive `tabindex="0"` from Motion so keyboard users can press them; give them a role too.
 */
export declare function usePress(target: ElementTarget, options?: PressOptions): GestureHandle & {
  readonly isPressed: Readonly<Ref<boolean>>;
};
interface UseDragOptions extends Omit<DragOptions$1, 'constraints' | 'onStart' | 'onMove' | 'onEnd' | 'onTransitionEnd'> {
  /** Pixel distances from the origin, or an element (or template ref) to stay within. */
  constraints?: DragOptions$1['constraints'] | ElementTarget;
  /** Disable dragging without removing the composable. */
  disabled?: boolean;
  onStart?: (event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo$1) => void;
  onMove?: (event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo$1) => void;
  onEnd?: (event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo$1) => void;
  /** The momentum or snap-back animation after release has finished. */
  onSettle?: () => void;
}
interface DragHandle extends GestureHandle {
  readonly isDragging: Readonly<Ref<boolean>>;
  /** The axis chosen by `directionLock`, `null` while unlocked. */
  readonly lockedAxis: Readonly<Ref<'x' | 'y' | null>>;
  /** The pointer offset and velocity when the last drag ended, in pixels and pixels per second. */
  readonly lastRelease: Readonly<Ref<Pick<PanInfo$1, 'offset' | 'velocity'> | null>>;
}
/**
 * Makes an element draggable with Motion's `drag()` gesture: axis and direction locking,
 * constraints in pixels or an element, elastic edges, momentum and snap-to-origin. The element
 * moves through its `x`/`y` transform, which `useAnimate()` can animate afterwards. Options are
 * reactive: a change rebinds the gesture without moving the element. With reduced motion,
 * momentum and animated snap-back are disabled.
 *
 * Drag here is visual: for sortable lists or moving data between containers, use a drag-and-drop
 * library and let VibeMotion animate the result.
 */
export declare function useDrag(target: ElementTarget, options?: MaybeRefOrGetter<UseDragOptions>): DragHandle;
type Update = () => void | Promise<void>;
interface LayoutMotionOptions {
  transition?: MaybeRefOrGetter<AnimationOptions$1 | undefined>;
  /** Transitions for explicit data-layout-id values. IDs must be unique across the document. */
  shared?: Record<string, AnimationOptions$1>;
}
interface LayoutMotion {
  /** Snapshot, mutate reactive state, await nextTick, then project to the new layout. */
  update(mutate: Update): Promise<void>;
  readonly isAnimating: Readonly<Ref<boolean>>;
  stop(): void;
}
/** Motion's layout engine, scoped to a container and synchronized with Vibe.js DOM updates. */
export declare function useLayoutMotion(scope?: ElementTarget, options?: LayoutMotionOptions): LayoutMotion;
interface ViewTransitionHandle {
  /** Complete a view transition, or just commit on unsupported browsers or with reduced motion. */
  start(mutate: Update, configure?: (builder: ReturnType<typeof animateView$1>) => void, options?: AnimationOptions$1 & {
    interrupt?: 'wait' | 'immediate';
  }): Promise<void>;
  readonly isTransitioning: Readonly<Ref<boolean>>;
  /** Stops the current transition. Future calls remain available until scope disposal. */
  stop(): void;
}
/** Snapshot transitions through Motion's public builder; crossfade is the default. */
export declare function useViewTransition(): ViewTransitionHandle;
type AnimatedElement = HTMLElement | SVGElement;
interface PresenceAnimationOptions<V extends string = string> {
  variants?: Variants<V>;
  /** Where entering content starts. */
  initial?: TargetOrVariant<NoInfer<V>>;
  /** The resting state of present content. */
  animate?: TargetOrVariant<NoInfer<V>>;
  /** Where exiting content animates to before it is removed. */
  exit?: TargetOrVariant<NoInfer<V>>;
  /** The default transition; a target's own `transition` overrides it. */
  transition?: AnimationOptions$1;
}
interface UsePresenceOptions<V extends string = string> extends PresenceAnimationOptions<V> {
  /** Animate the first appearance when `show` starts `true`. Defaults to `true`. */
  appear?: boolean;
  /**
   * Return focus to the element that was focused when the content appeared, if focus is inside
   * the content when it starts exiting. Defaults to `true`.
   */
  restoreFocus?: boolean;
  onEnterComplete?: () => void;
  onExitComplete?: () => void;
}
interface Presence {
  /** Render the content while this is `true`: `v-if="presence.isPresent"`. */
  readonly isPresent: Readonly<Ref<boolean>>;
  /** The content is playing its exit animation; it is `inert` and hidden from assistive technology. */
  readonly isExiting: Readonly<Ref<boolean>>;
}
/**
 * Keeps conditional content rendered until its exit animation has finished. Vibe.js removes a
 * `v-if` branch immediately, so render with `v-if="presence.isPresent"` instead of `v-if="show"`:
 * when `show` turns `false`, the element plays `exit` and only then is `isPresent` cleared.
 * Turning `show` back on during the exit reverses it from the current values; a stale exit
 * never removes content that was shown again.
 *
 * ```ts
 * const open = ref(false)
 * const panel = useTemplateRef<HTMLElement>('panel')
 * const presence = usePresence(open, panel, {
 *   initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 },
 * })
 * // <div v-if="presence.isPresent" ref="panel">…</div>
 * ```
 */
export declare function usePresence<const V extends string = string>(show: MaybeRefOrGetter<boolean>, target: ElementTarget<AnimatedElement>, options?: UsePresenceOptions<V>): Presence;
interface PresenceEntry<T> {
  readonly key: PropertyKey;
  readonly item: T;
  /** The entry left the source list and is playing its exit animation. */
  readonly exiting: boolean;
}
interface UsePresenceListOptions<T, V extends string = string> extends PresenceAnimationOptions<V> {
  /** A stable identity for each item, also used as the `:key` of the `v-for`. */
  key: (item: T) => PropertyKey;
  /**
   * `'sync'` (default) lets entering and exiting items animate at the same time. `'wait'` adds new
   * items only after every exiting item is gone, for content that replaces other content.
   */
  mode?: 'sync' | 'wait';
  /** Animate the items present on the first render. Defaults to `false`. */
  appear?: boolean;
  /** Animate the positions of the remaining items when entries are added and removed. */
  layout?: LayoutMotion;
  onExitComplete?: (key: PropertyKey) => void;
}
interface PresenceList<T> {
  /**
   * Render these:
   * `v-for="entry in list.items.value" :key="entry.key" :ref="(el) => list.bind(entry.key, el)"`.
   */
  readonly items: Readonly<ShallowRef<readonly PresenceEntry<T>[]>>;
  /** Connects an entry to its element, from a function ref. Vibe.js calls it with `null` on removal. */
  bind(key: PropertyKey, element: unknown): void;
}
/**
 * Presence for a keyed `v-for`: items removed from `source` stay in `items`, at their previous
 * position, until their exit animation finishes. Items added back during their exit reverse from
 * the current values. Use one item (`[activeTab]`) with `mode: 'wait'` for content that swaps.
 */
export declare function usePresenceList<T, const V extends string = string>(source: MaybeRefOrGetter<readonly T[]>, options: UsePresenceListOptions<T, V>): PresenceList<T>;
interface RouterHooks {
  beforeResolve(guard: (to: {
    fullPath: string;
  }, from: {
    fullPath: string;
  }) => unknown): () => void;
  afterEach(hook: (to: {
    fullPath: string;
  }, from: {
    fullPath: string;
  }, failure?: unknown) => void): () => void;
}
interface RouteTransitionOptions {
  mode?: 'animate' | 'view';
  initial?: DOMKeyframesDefinition$1;
  animate?: DOMKeyframesDefinition$1;
  exit?: DOMKeyframesDefinition$1;
  transition?: AnimationOptions$1;
}
/** Retain the old route through a public beforeResolve guard, then animate the flushed new page. */
export declare function useRouteTransition(router: RouterHooks, container: ElementTarget<HTMLElement>, options?: RouteTransitionOptions): {
  stop(): void;
};
export { type AnimateFunction, type AnimationOptions, type AnimationPlaybackControls, type AnimationPlaybackControlsWithThen, type AnimationSequence, type DOMKeyframesDefinition, type DragHandle, type DragOptions, type Easing, type ElementTarget, type GestureHandle, type HoverOptions, type InViewOptions, type LayoutMotion, type LayoutMotionOptions, type MotionConfig, type MotionControls, type MotionHandle, type MotionPlayState, type MotionTarget, type MotionValue, type PanInfo, type Presence, type PresenceAnimationOptions, type PresenceEntry, type PresenceList, type PressOptions, type ReducedMotionSetting, type RouteTransitionOptions, type RouterHooks, type ScopedAnimate, type ScrollAnimationOptions, type ScrollValues, type SpringOptions, type TargetOrVariant, type Transition, type UseDragOptions, type UseInViewOptions, type UseMotionOptions, type UsePresenceListOptions, type UsePresenceOptions, type UseScrollOptions, type Variants, type ViewTransitionHandle, type ViewportOptions, animateLayout, animateView, anticipate, backIn, backInOut, backOut, circIn, circInOut, circOut, cubicBezier, easeIn, easeInOut, easeOut, inertia, isMotionValue, mapValue, mix, motionConfigKey, motionValue, provideMotionConfig, spring, springValue, stagger, steps, transformValue, useReducedMotion };
//# sourceMappingURL=index.d.ts.map