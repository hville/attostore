import {cType} from './c-type'

/**
 * deep Equal check on JSON-like objects
 * @function
 * @param {!Object|!Array} obj - object to check
 * @param {!Object|!Array} ref - the reference
 * @return {boolean|void} true if equal
 */
export function isEqual(obj, ref) {
	var cO = cType(obj),
			cR = cType(ref)
	if (cO !== cR) return false
	if (cO === Array) {
		if (obj.length !== ref.length) return false
		for (var i=0; i<obj.length; ++i) if (!isEqual(obj[i], ref[i])) return false
		return true
	}
	if (cO === Object) {
		var ko = Object.keys(obj) //TODO type annotation obj === object
		if (ko.length !== Object.keys(ref).length) return false //TODO type annotation ref === object
		for (i=0; i<ko.length; ++i) if (!isEqual(obj[ko[i]], ref[ko[i]])) return false
		return true
	}
	else return obj === ref
}
