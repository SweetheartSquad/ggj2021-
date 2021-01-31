import LZString from 'lz-string';
import { useMemo } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import { mapSpacing } from './config';

/**
 * @param input base64 encoded json
 * @returns parsed object
 */
export function parseInput(input: string) {
	try {
		const str = LZString.decompressFromBase64(input);
		if (!str) return undefined;
		return JSON.parse(str);
	} catch {
		return undefined;
	}
}

/**
 * @param output object to convert
 * @returns base64 encoded json
 */
export function generateOutput(output: unknown) {
	return LZString.compressToBase64(JSON.stringify(output));
}

export function rnd(min: number, max: number) {
	return Math.floor(Math.random() * (max - min) + min);
}
export function rndInt(min: number, max: number) {
	return Math.floor(rnd(min, max));
}
export function rndItm<T>(array: T[]) {
	return array[rndInt(0, array.length)];
}

export function calcAngleDegrees(x: number, y: number) {
	return (Math.atan2(y, x) * 180) / Math.PI;
}
export function angleBetween(sx: number, sy: number, ex: number, ey: number) {
	if (ex > sx) {
		return calcAngleDegrees(ex - sx, ey - sy);
	}
	return calcAngleDegrees(sx - ex, sy - ey);
}

export function useGridPosStyle(x: number, y: number, w?: number, h?: number) {
	return useMemo(() => ({ gridArea: `${y + 1} / ${x + 1} / ${h ? `span ${h}` : 'auto'} / ${w ? `span ${w}` : 'auto'}` }), [x, y, w, h]);
}

export function useGridStyle(w: number, h: number, base?: JSXInternal.CSSProperties) {
	return useMemo(() => ({ ...base, gridTemplateColumns: `repeat(${w}, ${mapSpacing}rem)`, gridTemplateRows: `repeat(${h}, ${mapSpacing}rem)` }), [w, h, base]);
}

export function useTextDimensions(text: string) {
	const w = useMemo(() => text.split('\n').reduce((max, i) => Math.max(max, i.length), 0), [text]);
	const h = useMemo(() => text.split('\n').length, [text]);
	return [w, h] as const;
}

// eslint-disable-next-line no-unused-vars
export function findIndexOrUndefined<T>(array: T[], predicate: (_: T) => boolean) {
	const result = array.findIndex(predicate);
	return result === -1 ? undefined : result;
}
