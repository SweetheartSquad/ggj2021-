/**
 * @param input base64 encoded json
 * @returns parsed object
 */
export function parseInput(input: string) {
	try {
		return JSON.parse(atob(input));
	} catch {
		return undefined;
	}
}

/**
 * @param output object to convert
 * @returns base64 encoded json
 */
export function generateOutput(output: unknown) {
	return btoa(JSON.stringify(output));
}
