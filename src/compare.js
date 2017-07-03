import {isObj} from './type'

export function missingKeys(reference, value) {
	var keys = isObj(reference) ? Object.keys(reference) : []
	return isObj(value) ? keys.filter(filterVoid, value) : keys
}

export function changedKeys(reference, value) {
	var keys = isObj(reference) ? Object.keys(reference) : [],
			diff = []
	if (isObj(value)) for (var i=0; i<keys.length; ++i) {
		var key = keys[i],
				val = value[key]
		if (val !== reference[key] && val !== undefined) diff.push(key)
	}
	return diff
}

function filterVoid(k) {
	return this[k] === undefined
}
