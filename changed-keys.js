var isObj = require('./src/is-obj')

module.exports = function(reference, value) {
	var keys = isObj(reference) ? Object.keys(reference) : [],
			diff = []
	if (isObj(value)) for (var i=0; i<keys.length; ++i) {
		var key = keys[i],
				val = value[key]
		if (val !== reference[key] && val !== undefined) diff.push(key)
	}
	return diff
}
