var isObj = require('./src/is-obj')

module.exports = function(reference, value) {
	var keys = isObj(reference) ? Object.keys(reference) : []
	return isObj(value) ? keys.filter(filterVoid, value) : keys
}

function filterVoid(k) {
	return this[k] === undefined
}
