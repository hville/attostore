/**
 * @function
 * @param {*} v - object to test
 * @return {Object} object Constructor type
 */
export function cType(v) {
	//null, String, Boolean, Number, Object, Array
	return v == null ? v : v.constructor || Object
}
