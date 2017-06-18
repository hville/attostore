import {cType} from './c-type'

/**
 * @function
 * @param {!Object} obj
 * @param {string|number} key
 * @returns {!Object} clone
 */
export function delKey(obj, key) { //TODO number vs string keys
	var ctyp = cType(obj)
	if (ctyp === Array && key === obj.length - 1) return obj.slice(0,-1) //TODO errors
	if (ctyp === Object) {
		for (var i=0, ks=Object.keys(obj), res={}; i<ks.length; ++i) if (ks[i] !== key) res[ks[i]] = obj[ks[i]]
		return res
	}
	return obj
}
