/**
 * Replacer function for JSON serialization.
 * @param {string} key - The key of the current property being processed.
 * @param {*} value - The value of the current property being processed.
 * @returns {*} The value to be included in the serialized JSON output.
 */
export function replacer(key, value) {
	return value;
}