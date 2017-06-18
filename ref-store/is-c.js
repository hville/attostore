/**
 * @param {*} val
 * @param {Function} ctr
 * @return {Object|undefined} object Constructor type
 */
export function isC(val, ctr) {
	return (val == null ? val : val.constructor || Object) === ctr
}

