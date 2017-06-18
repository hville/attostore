/**
 * @param {!Array|string} path
 * @param {!Array} [root]
 * @returns {!Array}
 */
export function getKeys(path, root) {
	var keys = root || []
	return !path ? keys : keys.concat(Array.isArray(path) ? path : path.split('/'))
}
