import {cType} from './c-type'
import {clone} from './clone'
import {delKey} from './key-del'

/**
 * @function
 * @param {!Object} obj
 * @param {string|number} key
 * @param {*} val
 * @returns {!Object} clone
 */
export function setKey(obj, key, val) { //TODO number vs string keys
	var ctyp = cType(obj),
			res = obj

	if (ctyp === Object) {
		if (val == null) return delKey(obj, key)
		res = clone(obj)
		res[key] = val
	}
	else if (ctyp === Array && key <= obj.length) { //TODO errors
		res = obj.slice()
		res[key] = val
	}
	return res
}
