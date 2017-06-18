var r = require( 'rollup' )
var p = require('path')

var KEY = '__importedModule'

module.exports = function getModule(paths, cb) {
	var dir = p.dirname(module.parent.filename)

	function getPath(path) {
		return r.rollup({entry: p.resolve(dir, path)}).then(function(bundle) {
			eval(bundle.generate({format: 'iife', moduleName: KEY}).code)
			return this[KEY]
		})
	}

	return Promise.all((Array.isArray(paths) ? paths : [paths])
	.map(getPath))
	.then(function(mods) {
		var imports = {}
		for (var i=0; i<mods.length; ++i) Object.assign(imports, mods[i])
		cb(imports)
	})
}

