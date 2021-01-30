import LZString from 'lz-string';

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
	return Math.floor(Math.random() * (max-min) + min);
}
export function rndInt(min: number, max: number) {
	return Math.floor(rnd(min, max));
}
export function rndItm<T>(array: T[]) {
	return array[rndInt(0, array.length)];
}

