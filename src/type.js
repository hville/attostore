/**
 * @function
 * @param {*} v - object to test
 * @return {*} null|undefined|Constructor
 */
export function cType(v) {
	//null, String, Boolean, Number, Object, Array
	return v == null ? v : v.constructor || Object
}

export function isObj(v) {
	return typeof v === 'object'
}
