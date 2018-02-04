/**
 * @function
 * @param {*} v - object to test
 * @return {*} null|undefined|Constructor
 */
module.exports = function(v) {
	//null, String, Boolean, Number, Object, Array
	return v == null ? v : v.constructor || Object
}
