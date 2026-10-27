import { a as useMotionSettings, c as onDispose, i as provideMotionConfig, l as requireScope, n as applySettings, o as useReducedMotion, r as motionConfigKey, s as bindElement, t as createAnimate$1, u as sameTarget } from "./engine-uwti5lxH.js";
import { computed, isRef, nextTick, shallowRef, toValue, watch } from "@usevibejs/ui";
import { animate, animateLayout, animateLayout as animateLayout$1, animateView, animateView as animateView$1, anticipate, attachSpring, attrEffect, backIn, backInOut, backOut, circIn, circInOut, circOut, cubicBezier, drag, easeIn, easeInOut, easeOut, hover, inView, inertia, isMotionValue, isMotionValue as isMotionValue$1, mapValue, mapValue as mapValue$1, mix, motionValue, motionValue as motionValue$1, press, scopeMotion, scroll, spring, springValue, stagger, steps, styleEffect, transformValue, transformValue as transformValue$1 } from "motion";
// src/animate.ts
/** @internal Hybrid engine allocation. The mini entry imports engine.ts directly. */
function createAnimate(settings, root, engine = animate) {
	return createAnimate$1(settings, root, engine);
}
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
function useAnimate(root) {
	return createAnimate(useMotionSettings(), root);
}
// src/controls.ts
function useMotionControls() {
	requireScope();
	let disposed = false;
	let owned = null;
	const animation = shallowRef(null);
	const state = shallowRef("idle");
	const speed = shallowRef(1);
	let generation = 0;
	const track = (current, id) => {
		current.finished.then(() => {
			if (id === generation && state.value !== "idle") state.value = "finished";
		}, () => {
			if (id === generation) state.value = "idle";
		});
	};
	const end = (method, next) => {
		const current = animation.value;
		if (!current || disposed) return;
		generation++;
		current[method]();
		state.value = next;
	};
	const controls = {
		animation,
		state,
		speed: computed({
			get: () => speed.value,
			set: (rate) => {
				speed.value = rate;
				if (!disposed && animation.value) animation.value.speed = rate;
			}
		}),
		get time() {
			return animation.value?.time ?? 0;
		},
		set time(seconds) {
			if (!disposed && animation.value) animation.value.time = seconds;
		},
		get duration() {
			return animation.value?.duration ?? 0;
		},
		get finished() {
			return animation.value ? animation.value.finished.then(() => {}) : Promise.resolve();
		},
		set(next) {
			if (disposed) {
				next.stop();
				return next;
			}
			const id = ++generation;
			owned = next;
			animation.value = next;
			if (speed.value !== 1) next.speed = speed.value;
			state.value = "running";
			track(next, id);
			return next;
		},
		play() {
			const current = animation.value;
			if (!current || disposed) return;
			if (state.value === "finished" || state.value === "idle") track(current, ++generation);
			current.play();
			state.value = "running";
		},
		pause() {
			if (disposed || !animation.value || state.value !== "running") return;
			animation.value.pause();
			state.value = "paused";
		},
		stop: () => end("stop", "idle"),
		cancel: () => end("cancel", "idle"),
		complete: () => end("complete", "finished")
	};
	onDispose(() => {
		disposed = true;
		generation++;
		owned?.stop();
		owned = null;
	});
	return controls;
}
// src/target.ts
/** The values a property returns to when no state defines it. */
const restingValues = {
	x: 0,
	y: 0,
	z: 0,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	rotateZ: 0,
	skewX: 0,
	skewY: 0,
	scale: 1,
	scaleX: 1,
	scaleY: 1,
	opacity: 1
};
/** Resolves variant names to one target. Unknown names throw, so typos fail loudly. */
function resolveTarget(definition, variants) {
	if (!definition) return {};
	if (typeof definition === "object" && !Array.isArray(definition)) return definition;
	const names = typeof definition === "string" ? [definition] : definition;
	const merged = {};
	for (const name of names) {
		const variant = variants?.[name];
		if (!variant) throw new Error(`[VibeMotion] Unknown variant "${name}".`);
		Object.assign(merged, variant);
	}
	return merged;
}
/** Splits `transition` off a target. */
function splitTarget(target) {
	const { transition, ...keyframes } = target;
	return [keyframes, transition];
}
/**
* Layers targets by priority: the last active layer that defines a property wins; a property no
* active layer defines returns to its value in `rest`, or the CSS default for transforms and
* opacity. Returns the keyframes and the transition of the highest active layer that has one.
*/
function composeLayers(layers, rest) {
	const out = {};
	let transition;
	for (const { active, target } of layers) {
		const [keyframes, own] = splitTarget(target);
		for (const key of Object.keys(keyframes)) if (active) {
			const value = keyframes[key];
			out[key] = Array.isArray(value) ? [...value] : value;
		} else if (!(key in out)) {
			const fallback = rest[key] ?? restingValues[key];
			if (fallback !== void 0) out[key] = fallback;
		}
		if (active && own) transition = own;
	}
	return [out, transition];
}
/** Prepends the `from` values as first keyframes, so an enter animation starts from them. */
function fromTo(from, to) {
	const out = { ...to };
	for (const [key, start] of Object.entries(from)) {
		if (!(key in to) || start === void 0) continue;
		const end = to[key];
		const first = Array.isArray(start) ? start[0] : start;
		out[key] = Array.isArray(end) ? [first, ...end] : [first, end];
	}
	return out;
}
// src/motion.ts
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
function useMotion(target, options) {
	const settings = useMotionSettings();
	const animate = createAnimate(settings);
	const controls = useMotionControls();
	const isHovered = shallowRef(false);
	const isPressed = shallowRef(false);
	const isInView = shallowRef(false);
	const isAnimating = shallowRef(false);
	const resolve = (definition) => resolveTarget(definition, toValue(options.variants));
	const initial = resolve(options.initial);
	let element;
	let last;
	let generation = 0;
	let disposed = false;
	let lastTransition;
	const compose = () => composeLayers([
		{
			active: true,
			target: resolve(toValue(options.animate))
		},
		{
			active: isInView.value,
			target: resolve(options.inView)
		},
		{
			active: isHovered.value,
			target: resolve(options.hover)
		},
		{
			active: isPressed.value,
			target: resolve(options.press)
		}
	], {
		...initial,
		...resolve(toValue(options.animate))
	});
	const run = (keyframes, transition) => {
		if (!element || disposed) return Promise.resolve();
		const id = ++generation;
		const merged = {
			...toValue(options.transition),
			...transition
		};
		if (options.interrupt === "replace") controls.stop();
		if (options.interrupt === "cancel") controls.cancel();
		options.onAnimationStart?.(keyframes);
		isAnimating.value = true;
		return controls.set(animate(element, keyframes, merged)).finished.then(() => {
			if (id !== generation) return;
			isAnimating.value = false;
			options.onAnimationComplete?.(keyframes);
		});
	};
	const update = (enter = false) => {
		const [keyframes, transition] = compose();
		const resolvedTransition = applySettings(settings, {
			...toValue(options.transition),
			...transition
		});
		if (!enter && sameTarget(keyframes, last) && sameTarget(resolvedTransition, lastTransition)) return;
		last = keyframes;
		lastTransition = resolvedTransition;
		if (enter && options.initial === false) run(keyframes, {
			duration: 0,
			delay: 0,
			type: false
		});
		else run(enter ? fromTo(splitTarget(initial)[0], keyframes) : keyframes, transition);
	};
	const stopElement = bindElement(target, (el) => {
		element = el;
		update(true);
		const cleanups = [];
		if (options.hover) cleanups.push(hover(el, () => {
			isHovered.value = true;
			return () => isHovered.value = false;
		}));
		if (options.press) cleanups.push(press(el, () => {
			isPressed.value = true;
			return () => isPressed.value = false;
		}));
		if (options.inView) {
			const { once, ...viewport } = options.viewport ?? {};
			cleanups.push(inView(el, () => {
				isInView.value = true;
				return once ? void 0 : () => isInView.value = false;
			}, viewport));
		}
		return () => {
			generation++;
			animate.stop();
			isAnimating.value = false;
			for (const cleanup of cleanups) cleanup();
			isHovered.value = isPressed.value = isInView.value = false;
			element = void 0;
			last = void 0;
		};
	});
	const stopWatch = watch(() => [
		compose(),
		{ ...toValue(options.transition) },
		settings.reduced.value,
		settings.config.value.skipAnimations
	], () => update());
	const dispose = () => {
		if (disposed) return;
		disposed = true;
		stopWatch();
		stopElement();
		generation++;
		animate.stop();
		isAnimating.value = false;
	};
	onDispose(dispose);
	return {
		controls,
		isHovered,
		isPressed,
		isInView,
		isAnimating,
		start(definition, transition) {
			const [keyframes, own] = splitTarget(resolve(definition));
			last = void 0;
			return run(keyframes, {
				...own,
				...transition
			});
		},
		stop() {
			generation++;
			animate.stop();
			isAnimating.value = false;
		},
		dispose
	};
}
// src/values.ts
/**
* Ownership: a motion value created by a VibeMotion composable is destroyed with the scope that
* created it. A motion value passed in by the caller is only read or subscribed to, never
* destroyed.
*/
function own(value) {
	onDispose(() => value.destroy());
	return value;
}
/** A Motion value, destroyed when the calling scope stops. Changing it never re-renders Vibe.js. */
function useMotionValue(initial) {
	requireScope();
	return own(motionValue$1(initial));
}
function sourceValue(source) {
	if (isMotionValue$1(source)) return source;
	if (typeof source === "number") return source;
	const reactive = source;
	const input = own(motionValue$1(toValue(reactive)));
	watch(() => toValue(reactive), (next) => input.set(next), { flush: "sync" });
	return input;
}
/**
* A motion value that follows `source` with a spring: a number, a motion value, or a ref or getter
* of a number. `options` can be reactive; a change applies from the current velocity. With reduced
* motion the value follows its source instantly.
*/
function useSpring(source, options = {}) {
	requireScope();
	const input = sourceValue(source);
	const initial = typeof input === "number" ? input : input.get();
	const output = own(motionValue$1(initial));
	const settings = useMotionSettings();
	let detach;
	watch(() => [toValue(options), settings.reduced.value || !!settings.config.value.skipAnimations], ([spring, isReduced]) => {
		detach?.();
		detach = void 0;
		if (isReduced) {
			if (typeof input === "number") output.jump(input);
			else {
				output.jump(input.get());
				detach = input.on("change", (latest) => output.jump(latest));
			}
		} else detach = attachSpring(output, input, spring);
	}, { immediate: true });
	onDispose(() => detach?.());
	return output;
}
function useTransform(input, inputRange, outputRange, options) {
	requireScope();
	if (typeof input === "function") return own(transformValue$1(input));
	return own(mapValue$1(input, inputRange ?? [], outputRange ?? [], options));
}
/**
* Opts in to reactive observation of a motion value: a readonly ref updated on each change (each explicit set may emit). Use it for text or logic; bind motion values to styles with
* `useMotionStyle()` instead, which skips Vibe.js rendering entirely.
*/
function useMotionValueState(value) {
	requireScope();
	const state = shallowRef(value.get());
	const unsubscribe = value.on("change", (latest) => state.value = latest);
	onDispose(unsubscribe);
	return state;
}
/** Reads the velocity of a motion value in units per second (not reactive). */
const getVelocity = (value) => value.getVelocity();
function useEffect(effect, target, values) {
	let current;
	let remove;
	const apply = () => {
		remove?.();
		remove = void 0;
		if (!current) return;
		const owned = [];
		const resolved = Object.fromEntries(Object.entries(toValue(values)).map(([key, value]) => {
			if (isMotionValue$1(value)) return [key, value];
			const wrapped = motionValue$1(value);
			owned.push(wrapped);
			return [key, wrapped];
		}));
		const unbind = effect(current, resolved);
		remove = () => {
			unbind();
			for (const value of owned) value.destroy();
		};
	};
	const stopElement = bindElement(target, (element) => {
		current = element;
		apply();
		return () => {
			remove?.();
			remove = current = void 0;
		};
	});
	const stopValues = isRef(values) || typeof values === "function" ? watch(() => toValue(values), apply) : void 0;
	const stop = () => {
		stopValues?.();
		stopElement();
	};
	onDispose(stop);
	return stop;
}
/**
* Binds motion values (or static values) to the element's styles through Motion's frame loop,
* batching writes once per frame. Transforms such as `x`, `scale` and `rotate` compose into one
* `transform`. Vibe.js owns the other style bindings; do not bind the same property in both.
*/
function useMotionStyle(target, styles) {
	return useEffect(styleEffect, target, styles);
}
/** Binds motion values to attributes, for example an SVG path's `pathLength` or a `d` string. */
function useMotionAttrs(target, attrs) {
	return useEffect(attrEffect, target, attrs);
}
// src/gestures.ts
/**
* Tracks pointer hover with Motion's `hover()` gesture, which ignores emulated touch hover.
* Follows the element of the template ref when it is replaced.
*/
function useHover(target, options = {}) {
	const isHovered = shallowRef(false);
	const { onStart, onEnd, ...eventOptions } = options;
	return {
		isHovered,
		stop: bindElement(target, (element) => {
			const remove = hover(element, (_element, event) => {
				isHovered.value = true;
				onStart?.(event);
				return (endEvent) => {
					isHovered.value = false;
					onEnd?.(endEvent);
				};
			}, eventOptions);
			return () => {
				remove();
				isHovered.value = false;
			};
		})
	};
}
/**
* Tracks presses with Motion's `press()` gesture: primary pointer only, Enter on focused elements,
* and cancellation when the pointer is released outside. Elements that are not natively focusable
* receive `tabindex="0"` from Motion so keyboard users can press them; give them a role too.
*/
function usePress(target, options = {}) {
	const isPressed = shallowRef(false);
	const { onStart, onEnd, onCancel, ...eventOptions } = options;
	return {
		isPressed,
		stop: bindElement(target, (element) => {
			const remove = press(element, (_element, event) => {
				isPressed.value = true;
				onStart?.(event);
				return (endEvent, { success }) => {
					isPressed.value = false;
					(success ? onEnd : onCancel)?.(endEvent);
				};
			}, eventOptions);
			return () => {
				remove();
				isPressed.value = false;
			};
		})
	};
}
const isElementConstraint = (value) => typeof Element !== "undefined" && value instanceof Element || typeof value === "object" && value !== null && "value" in value || typeof value === "function";
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
function useDrag(target, options = {}) {
	const settings = useMotionSettings();
	const isDragging = shallowRef(false);
	const lockedAxis = shallowRef(null);
	const lastRelease = shallowRef(null);
	let rebind;
	const stopElement = bindElement(target, (element) => {
		let remove;
		const bind = () => {
			remove?.();
			remove = void 0;
			isDragging.value = false;
			lockedAxis.value = null;
			const { constraints, disabled, onStart, onMove, onEnd, onSettle, onDirectionLock, ...rest } = toValue(options);
			if (disabled) return;
			const resolvedConstraints = isElementConstraint(constraints) ? toValue(constraints) ?? void 0 : constraints;
			const reduced = settings.reduced.value || settings.config.value.skipAnimations;
			remove = drag(element, {
				...rest,
				constraints: resolvedConstraints,
				...reduced ? {
					momentum: false,
					snapToOrigin: false
				} : {},
				onStart: (event, info) => {
					isDragging.value = true;
					onStart?.(event, info);
				},
				onMove,
				onEnd: (event, info) => {
					isDragging.value = false;
					lockedAxis.value = null;
					lastRelease.value = {
						offset: { ...info.offset },
						velocity: { ...info.velocity }
					};
					onEnd?.(event, info);
				},
				onDirectionLock: (axis) => {
					lockedAxis.value = axis;
					onDirectionLock?.(axis);
				},
				onTransitionEnd: onSettle
			});
		};
		rebind = bind;
		bind();
		return () => {
			remove?.();
			rebind = void 0;
			isDragging.value = false;
			lockedAxis.value = null;
		};
	});
	const stopOptions = watch(() => {
		const value = toValue(options);
		return [
			value,
			isElementConstraint(value.constraints) ? toValue(value.constraints) : null,
			settings.reduced.value,
			settings.config.value.skipAnimations
		];
	}, () => rebind?.());
	const stop = () => {
		stopOptions();
		stopElement();
	};
	onDispose(stop);
	return {
		isDragging,
		lockedAxis,
		lastRelease,
		stop
	};
}
// src/scroll.ts
/** Waits until every provided element target has an element, then calls `setup` with them. */
function bindTargets(targets, setup, extra) {
	requireScope();
	let cleanup;
	const stopWatch = watch(() => [...targets.map((t) => t === void 0 ? void 0 : toValue(t)), extra?.()], (all) => {
		const elements = all.slice(0, targets.length);
		cleanup?.();
		cleanup = void 0;
		if (elements.every((element, i) => element || targets[i] === void 0)) cleanup = setup(elements.map((element) => element ?? void 0));
	}, {
		immediate: true,
		flush: "post"
	});
	const stop = () => {
		stopWatch();
		cleanup?.();
		cleanup = void 0;
	};
	onDispose(stop);
	return stop;
}
/**
* Scroll position and progress as motion values, from Motion's `scroll()`, which shares one
* listener per container and measures only on resize. The values are destroyed with the scope.
* Feed them to `useTransform()` and `useMotionStyle()` for parallax and progress bars.
*/
function useScroll(options = {}) {
	requireScope();
	const scrollX = motionValue$1(0);
	const scrollY = motionValue$1(0);
	const scrollXProgress = motionValue$1(0);
	const scrollYProgress = motionValue$1(0);
	const stopBinding = bindTargets([options.container, options.target], ([container, target]) => scroll((_progress, { x, y }) => {
		scrollX.set(x.current);
		scrollXProgress.set(x.progress);
		scrollY.set(y.current);
		scrollYProgress.set(y.progress);
	}, {
		container,
		target,
		offset: options.offset,
		axis: options.axis
	}));
	const stop = () => {
		stopBinding();
		for (const value of [
			scrollX,
			scrollY,
			scrollXProgress,
			scrollYProgress
		]) value.destroy();
	};
	onDispose(stop);
	return {
		scrollX,
		scrollY,
		scrollXProgress,
		scrollYProgress,
		stop
	};
}
/**
* Links an animation's progress to scroll. Motion drives it with a native `ScrollTimeline` where
* the browser supports one, off the main thread. With reduced motion, the element stays in its
* resting styles and nothing is linked.
*/
function useScrollAnimation(element, keyframes, options = {}) {
	const settings = useMotionSettings();
	const animate = createAnimate(settings);
	return { stop: bindTargets([
		element,
		options.container,
		options.target
	], ([el, container, target]) => {
		if (settings.reduced.value || settings.config.value.skipAnimations) return () => {};
		const animation = animate(el, keyframes, {
			duration: 1,
			ease: "linear",
			...options.transition
		});
		animation.pause();
		const link = options.container !== void 0 || options.target !== void 0 ? (progress) => {
			animation.time = progress * animation.duration;
		} : animation;
		const unlink = scroll(link, {
			container,
			target,
			offset: options.offset,
			axis: options.axis
		});
		return () => {
			unlink();
			animation.cancel();
		};
	}, () => [settings.reduced.value, settings.config.value.skipAnimations]) };
}
/** Whether the element intersects the viewport (or `root`), from Motion's shared `inView()` observers. */
function useInView(target, options = {}) {
	const isInView = shallowRef(false);
	const { once, onEnter, onLeave, ...observerOptions } = options;
	let done = false;
	return {
		isInView,
		stop: bindElement(target, (element) => {
			if (done) return;
			let remove = inView(element, (_element, entry) => {
				isInView.value = true;
				onEnter?.(entry);
				if (once) {
					done = true;
					queueMicrotask(() => {
						remove?.();
						remove = void 0;
					});
					return;
				}
				return (leaveEntry) => {
					isInView.value = false;
					onLeave?.(leaveEntry);
				};
			}, observerOptions);
			return () => {
				remove?.();
				remove = void 0;
				if (!once) isInView.value = false;
			};
		})
	};
}
// src/layout.ts
/** Motion's layout engine, scoped to a container and synchronized with Vibe.js DOM updates. */
function useLayoutMotion(scope, options = {}) {
	const settings = useMotionSettings();
	const owner = scopeMotion();
	const isAnimating = shallowRef(false);
	const running = /* @__PURE__ */ new Set();
	let generation = 0;
	let stoppedThrough = 0;
	let disposed = false;
	const measuredRoots = /* @__PURE__ */ new Set();
	const stop = () => {
		stoppedThrough = ++generation;
		for (const animation of running) animation.stop();
		running.clear();
		isAnimating.value = false;
	};
	onDispose(() => {
		disposed = true;
		stop();
		owner.stop();
		const roots = [...measuredRoots];
		measuredRoots.clear();
		nextTick(() => {
			if (isRef(scope)) scope.value;
			for (const root of roots) if (!root.isConnected) animateLayout$1(root, () => {}, { skipAnimations: true }).then((animation) => animation.stop());
		});
	});
	return {
		isAnimating,
		stop,
		async update(mutate) {
			if (disposed) return;
			const commit = async () => {
				if (disposed) return;
				await mutate();
				await nextTick();
			};
			const root = scope === void 0 ? void 0 : toValue(scope);
			if (scope !== void 0 && !root || settings.reduced.value || settings.config.value.skipAnimations) {
				await commit();
				return;
			}
			for (const previous of measuredRoots) if (!previous.isConnected) measuredRoots.delete(previous);
			if (root) measuredRoots.add(root);
			else if (typeof document !== "undefined") for (const element of document.querySelectorAll("[data-layout],[data-layout-id]")) measuredRoots.add(element);
			const transition = applySettings(settings, toValue(options.transition) ?? {});
			const id = ++generation;
			isAnimating.value = true;
			try {
				const builder = owner.run(() => root ? animateLayout$1(root, commit, transition) : animateLayout$1(commit, transition));
				for (const [sharedId, shared] of Object.entries(options.shared ?? {})) builder.shared(sharedId, shared);
				const { animation } = await new Promise((resolve, reject) => builder.then((readyAnimation) => resolve({ animation: readyAnimation }), reject));
				if (disposed || id <= stoppedThrough) {
					animation.stop();
					return;
				}
				running.add(animation);
				const done = () => {
					running.delete(animation);
					if (id === generation) isAnimating.value = false;
				};
				animation.finished.then(done, done);
			} catch (error) {
				if (id === generation) isAnimating.value = false;
				throw error;
			}
		}
	};
}
/** Snapshot transitions through Motion's public builder; crossfade is the default. */
function useViewTransition() {
	const settings = useMotionSettings();
	const isTransitioning = shallowRef(false);
	let owner = scopeMotion();
	let generation = 0;
	let disposed = false;
	const releases = /* @__PURE__ */ new Set();
	let stoppedThrough = 0;
	const stop = () => {
		stoppedThrough = ++generation;
		for (const release of releases) release();
		releases.clear();
		owner.stop();
		isTransitioning.value = false;
	};
	onDispose(() => {
		disposed = true;
		stop();
	});
	return {
		isTransitioning,
		stop,
		async start(mutate, configure, options) {
			if (disposed) return;
			const id = ++generation;
			const commit = async () => {
				if (!disposed && id > stoppedThrough) {
					await mutate();
					await nextTick();
				}
			};
			if (typeof document === "undefined" || typeof document.startViewTransition !== "function" || settings.reduced.value || settings.config.value.skipAnimations) {
				await commit();
				return;
			}
			if (owner.state !== "active") owner = scopeMotion();
			isTransitioning.value = true;
			let release;
			const cancelled = new Promise((resolve) => {
				release = resolve;
			});
			releases.add(release);
			try {
				const builder = owner.run(() => animateView$1(commit, applySettings(settings, options)).new({ opacity: [0, 1] }));
				configure?.(builder);
				const ready = new Promise((resolve, reject) => {
					builder.then((...args) => {
						const candidate = args[0];
						resolve({ animation: candidate && typeof candidate === "object" && "finished" in candidate && "stop" in candidate ? candidate : void 0 });
					}, reject);
				});
				await Promise.race([ready.then(({ animation }) => animation?.finished), cancelled]);
			} finally {
				releases.delete(release);
				if (id === generation) isTransitioning.value = false;
			}
		}
	};
}
// src/presence.ts
const FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex=\"-1\"])";
/** Shared enter/exit animation logic of the presence composables. */
function createPresenceAnimator(options) {
	const animate = createAnimate(useMotionSettings());
	const resolve = (definition) => resolveTarget(definition, options.variants);
	const [initial] = splitTarget(resolve(options.initial));
	const run = (element, target, from) => {
		const [keyframes, transition] = splitTarget(target);
		const frames = from ? fromTo(from, keyframes) : keyframes;
		return animate(element, frames, {
			...options.transition,
			...transition
		});
	};
	return {
		animate,
		/** Animates from `initial` to `animate`; `instant` jumps there (no appear animation). */
		enter(element, instant) {
			const target = resolve(options.animate);
			if (instant) return animate(element, splitTarget(target)[0], {
				duration: 0,
				delay: 0,
				type: false
			});
			return run(element, target, initial);
		},
		/** Animates back to `animate` from wherever an interrupted exit left the element. */
		resume: (element) => run(element, resolve(options.animate)),
		exit: (element) => run(element, resolve(options.exit))
	};
}
/** Exiting content cannot be focused, clicked or read by assistive technology. */
const exitingAttributes = /* @__PURE__ */ new WeakMap();
function setExiting(element, exiting) {
	if (exiting) {
		if (!exitingAttributes.has(element)) exitingAttributes.set(element, {
			inert: element.getAttribute("inert"),
			hidden: element.getAttribute("aria-hidden")
		});
		element.setAttribute("inert", "");
		element.setAttribute("aria-hidden", "true");
	} else {
		const saved = exitingAttributes.get(element);
		if (!saved) return;
		for (const [key, value] of [["inert", saved.inert], ["aria-hidden", saved.hidden]]) if (value === null) element.removeAttribute(key);
		else element.setAttribute(key, value);
		exitingAttributes.delete(element);
	}
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
function usePresence(show, target, options = {}) {
	const animator = createPresenceAnimator(options);
	const isPresent = shallowRef(!!toValue(show));
	const isExiting = shallowRef(false);
	const { appear = true, restoreFocus = true } = options;
	let element;
	let generation = 0;
	let firstRender = true;
	let returnFocus = null;
	const rememberFocus = () => {
		if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) returnFocus = document.activeElement;
	};
	if (isPresent.value) rememberFocus();
	onDispose(() => {
		generation++;
		if (element) setExiting(element, false);
	});
	const finishEnter = (animation, id) => animation.finished.then(() => {
		if (id === generation && !isExiting.value) options.onEnterComplete?.();
	});
	bindElement(target, (el) => {
		element = el;
		const id = ++generation;
		finishEnter(animator.enter(el, firstRender && !appear), id);
		firstRender = false;
		return () => {
			generation++;
			animator.animate.stop();
			setExiting(el, false);
			if (element === el) element = void 0;
		};
	});
	watch(() => !!toValue(show), (visible) => {
		const id = ++generation;
		if (visible) {
			if (isExiting.value && element) {
				isExiting.value = false;
				setExiting(element, false);
				finishEnter(animator.resume(element), id);
			} else {
				isExiting.value = false;
				rememberFocus();
				isPresent.value = true;
			}
			return;
		}
		if (!isPresent.value) return;
		const el = element;
		if (!el) {
			isPresent.value = false;
			return;
		}
		if (restoreFocus && returnFocus?.isConnected && el.contains(document.activeElement)) returnFocus.focus({ preventScroll: true });
		isExiting.value = true;
		setExiting(el, true);
		animator.exit(el).finished.then(() => {
			if (id !== generation) return;
			isExiting.value = false;
			setExiting(el, false);
			isPresent.value = false;
			options.onExitComplete?.();
		});
	});
	return {
		isPresent,
		isExiting
	};
}
/**
* Presence for a keyed `v-for`: items removed from `source` stay in `items`, at their previous
* position, until their exit animation finishes. Items added back during their exit reverse from
* the current values. Use one item (`[activeTab]`) with `mode: 'wait'` for content that swaps.
*/
function usePresenceList(source, options) {
	const animator = createPresenceAnimator(options);
	const { key, mode = "sync", appear = false, layout } = options;
	const entries = (list) => {
		const seen = /* @__PURE__ */ new Set();
		return list.map((item) => {
			const id = key(item);
			if (seen.has(id)) throw new Error(`[VibeMotion] Duplicate presence key "${String(id)}".`);
			seen.add(id);
			return {
				key: id,
				item,
				exiting: false
			};
		});
	};
	const items = shallowRef(entries(toValue(source)));
	const elements = /* @__PURE__ */ new Map();
	const generations = /* @__PURE__ */ new Map();
	const bump = (k) => {
		const next = (generations.get(k) ?? 0) + 1;
		generations.set(k, next);
		return next;
	};
	let disposed = false;
	onDispose(() => {
		disposed = true;
		for (const element of elements.values()) setExiting(element, false);
		elements.clear();
		generations.clear();
	});
	const initialKeys = new Set(appear ? [] : items.value.map((entry) => entry.key));
	nextTick(() => initialKeys.clear());
	const commit = (next) => {
		if (layout && !disposed) layout.update(() => void (items.value = next));
		else items.value = next;
	};
	const merge = (previous, list) => {
		const next = entries(list);
		const keys = new Set(next.map((entry) => entry.key));
		previous.forEach((entry, index) => {
			if (keys.has(entry.key)) return;
			let at = 0;
			for (let j = index - 1; j >= 0; j--) {
				const found = next.findIndex((candidate) => candidate.key === previous[j].key);
				if (found >= 0) {
					at = found + 1;
					break;
				}
			}
			next.splice(at, 0, entry.exiting ? entry : {
				...entry,
				exiting: true
			});
		});
		if (mode === "wait" && next.some((entry) => entry.exiting)) {
			const before = new Set(previous.filter((entry) => !entry.exiting).map((entry) => entry.key));
			return next.filter((entry) => entry.exiting || before.has(entry.key));
		}
		return next;
	};
	const exit = (entry) => {
		const id = bump(entry.key);
		const element = elements.get(entry.key);
		const remove = () => {
			if (generations.get(entry.key) !== id || disposed) return;
			if (element) setExiting(element, false);
			elements.delete(entry.key);
			generations.delete(entry.key);
			const remaining = items.value.filter((candidate) => candidate.key !== entry.key);
			commit(mode === "wait" && !remaining.some((e) => e.exiting) ? merge(remaining, toValue(source)) : remaining);
			options.onExitComplete?.(entry.key);
		};
		if (!element) return remove();
		if (element.contains(document.activeElement)) moveFocus(entry.key);
		setExiting(element, true);
		animator.exit(element).finished.then(remove);
	};
	const moveFocus = (from) => {
		const list = items.value.filter((entry) => !entry.exiting || entry.key === from);
		const index = list.findIndex((entry) => entry.key === from);
		for (const neighbour of [list[index + 1], list[index - 1]]) {
			const element = neighbour && neighbour.key !== from ? elements.get(neighbour.key) : void 0;
			const focusable = element?.matches(FOCUSABLE) ? element : element?.querySelector(FOCUSABLE);
			if (focusable instanceof HTMLElement) return focusable.focus({ preventScroll: true });
		}
	};
	watch(() => [...toValue(source)], (list) => {
		const previous = items.value;
		const next = merge(previous, list);
		const wasExiting = new Set(previous.filter((entry) => entry.exiting).map((entry) => entry.key));
		commit(next);
		for (const entry of next) if (entry.exiting && !wasExiting.has(entry.key)) exit(entry);
		else if (!entry.exiting && wasExiting.has(entry.key)) {
			bump(entry.key);
			const element = elements.get(entry.key);
			if (element) {
				setExiting(element, false);
				animator.resume(element);
			}
		}
	});
	return {
		items,
		bind(k, value) {
			if (disposed) return;
			if (!(value instanceof HTMLElement || value instanceof SVGElement)) {
				if (!items.value.some((entry) => entry.key === k)) elements.delete(k);
				return;
			}
			if (elements.get(k) === value) return;
			elements.set(k, value);
			animator.enter(value, initialKeys.has(k));
		}
	};
}
// src/route.ts
/** Retain the old route through a public beforeResolve guard, then animate the flushed new page. */
function useRouteTransition(router, container, options = {}) {
	const settings = useMotionSettings();
	const animate = createAnimate(settings);
	const owner = scopeMotion();
	const { mode = "animate", initial = {}, animate: target = {}, exit = {}, transition } = options;
	let disposed = false;
	let generation = 0;
	let pending;
	const clear = () => {
		pending?.release();
		pending?.rendered?.();
		pending?.restore?.();
		pending = void 0;
	};
	const removeGuard = router.beforeResolve((to, from) => {
		clear();
		const id = ++generation;
		const element = toValue(container);
		if (disposed || !element || to.fullPath === from.fullPath || settings.reduced.value || settings.config.value.skipAnimations) return;
		let release;
		const interrupted = new Promise((resolve) => {
			release = resolve;
		});
		const request = {
			path: to.fullPath,
			release
		};
		pending = request;
		if (mode === "view" && typeof document.startViewTransition === "function") return new Promise((proceed) => {
			request.release = proceed;
			owner.run(() => animateView$1(async () => {
				if (disposed || id !== generation) return;
				const rendered = new Promise((resolve) => {
					request.rendered = resolve;
				});
				proceed();
				await rendered;
				await nextTick();
			}, applySettings(settings, transition)).new({ opacity: [0, 1] })).then(() => {}, () => proceed());
		});
		if (!Object.keys(exit).length) return;
		const inert = element.getAttribute("inert");
		element.setAttribute("inert", "");
		request.restore = () => {
			if (inert === null) element.removeAttribute("inert");
			else element.setAttribute("inert", inert);
		};
		return Promise.race([animate(element, exit, transition).finished, interrupted]).then(() => request.restore?.());
	});
	const removeHook = router.afterEach((to, from, failure) => {
		if (disposed || pending && pending.path !== to.fullPath) return;
		const view = !!pending?.rendered;
		clear();
		const id = generation;
		nextTick(() => {
			const element = toValue(container);
			if (disposed || id !== generation || view || !element || settings.reduced.value || to.fullPath === from.fullPath) return;
			const keyframes = failure ? target : fromTo(initial, target);
			if (Object.keys(keyframes).length) animate(element, keyframes, transition);
		});
	});
	const stop = () => {
		if (disposed) return;
		disposed = true;
		generation++;
		removeGuard();
		removeHook();
		clear();
		animate.stop();
		owner.stop();
	};
	onDispose(stop);
	return { stop };
}
export { animateLayout, animateView, anticipate, backIn, backInOut, backOut, circIn, circInOut, circOut, cubicBezier, easeIn, easeInOut, easeOut, getVelocity, inertia, isMotionValue, mapValue, mix, motionConfigKey, motionValue, provideMotionConfig, spring, springValue, stagger, steps, transformValue, useAnimate, useDrag, useHover, useInView, useLayoutMotion, useMotion, useMotionAttrs, useMotionControls, useMotionStyle, useMotionValue, useMotionValueState, usePresence, usePresenceList, usePress, useReducedMotion, useRouteTransition, useScroll, useScrollAnimation, useSpring, useTransform, useViewTransition };
