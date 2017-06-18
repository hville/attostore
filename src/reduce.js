export function reduce(source, callback, result, context) {
	var ctx = context || this
	if (Array.isArray(source)) for (var i=0; i<source.length; ++i) {
		result = callback.call(ctx, result, source[i], i, source)
	}
	else for (var j=0, ks=Object.keys(source); j<ks.length; ++j) {
		result = callback.call(ctx, result, source[ks[j]], ks[j], source)
	}
	return result
}
