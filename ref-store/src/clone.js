/**
 * @function
 * @param {!Object} obj - object or array to be cloned
 * @returns {!Object} clone
 */
export function clone(obj) {
	for (var i=0, ks=Object.keys(obj), res={}; i<ks.length; ++i) res[ks[i]] = obj[ks[i]]
	return res
}
