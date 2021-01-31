import LZString from 'lz-string';
import { useMemo } from 'preact/hooks';

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

export function useGridStyle(x: number, y: number) {
	return useMemo(() => ({ gridArea: `${y + 1} / ${x + 1} / auto / auto` }), [x,y]);
}
