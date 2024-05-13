import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";
import type { LoroMapClient } from "./loro-converters/client";
import { readable, type Readable, type Unsubscriber } from "svelte/store";

export function flattenLoroClientMap<T extends Record<string, unknown>>(obj: Record<string, LoroMapClient<T>>): Record<string, T> {
	return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v.value]));
}

export function recordToArray<T, K extends string>(obj: Record<string, T>, keyName: K): (T & { [obj in K]: string })[] {
	return Object.entries<T>(obj).map(([key, value]) => ({
		[keyName]: key,
		...value
	} as (T & { [obj in K]: string })));
}

export function unpromisifyStore<T, R>(store: Promise<Readable<T | null>>, transform: (value: T) => R, defaultValue: R): Readable<R> {
	return readable(defaultValue, set => {
		let unsubscribe: Unsubscriber | null = null;

    store.then(s => {
      unsubscribe = s.subscribe(value => {
        if (value === null) set(defaultValue);
        else {
          set(transform(value));
        }
      });
    });
    return () => unsubscribe?.();
	});
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};

export const flyAndScale = (
	node: Element,
	params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
	const style = getComputedStyle(node);
	const transform = style.transform === "none" ? "" : style.transform;

	const scaleConversion = (
		valueA: number,
		scaleA: [number, number],
		scaleB: [number, number]
	) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (
		style: Record<string, number | string | undefined>
	): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, "");
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: cubicOut
	};
};