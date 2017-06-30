/*
	patchAsync: function(patch, ondone) {
		return promisify(setTimeout, [patchSync, 0, this, patch], ondone)
	},

	patchSync: function(patch, ondone) {
		return promisify(patchSync, [this, patch], ondone)
	}
*/
export function promisify(fcn, args, cb) {
	// avoids promises and return void if a callback is provided
	if (cb) fcn.apply(null, args.concat(cb))

	// return a promise only if no callback provided
	else return new Promise(function(done, fail) {
		fcn.apply(null, args.concat(function(err, res) {
			if (err) fail(err)
			else done(res)
		}))
	})
}
