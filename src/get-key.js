var isObj = require('./is-obj')

module.exports = function getKey(obj, key) {
	if (isObj(obj)) return obj[key]
}
