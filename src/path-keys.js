var cType = require('./c-type')

/**
 * @param {*} path
 * @return {Array<string>}
 */
module.exports = function(path) {
	switch (cType(path)) {
		case Number: return ['' + path]
		case Array: return path.map(keyString)
		case undefined: case null: return []
		case String:
			if (!path) return []
			if (path[0] !== '/') return path.split('/')
	}
	throw Error('invalid key of type ' + typeof path)
}

function keyString(k) {
	switch (cType(k)) {
		case String: return k
		case Number: return '' + k
	}
	throw Error('invalid key of type ' + typeof k)
}
