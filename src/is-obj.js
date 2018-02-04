/**
 * @function
 * @param {*} v - object to test
 * @return {boolean}
 */
module.exports = function(v) {
	return v ? typeof v === 'object' : false
}
