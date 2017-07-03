// @ts-check
import {pathKeys} from './path-keys'
import {isObj} from './type'
import {isEqual} from './is-eq'


export function set(path, value, ondone) {
	this.patch([{path: path, data: value}], ondone)
}

export function del(path, ondone) {
	this.patch([{path: path}], ondone)
}

export function patch(acts, ondone) {
	for (var i=0, data=this.data; i<acts.length; ++i) {
		data = setKeys(data, pathKeys(acts[i].path), acts[i].data, 0)
		if (data instanceof Error) {
			if (ondone) ondone(data)
			else throw data // no unhandled errors
			return
		}
	}
	var change = data !== this.data
	if (change) this._set(data)
	if (ondone) ondone(null, change ? acts : null)
}


/**
 * @param {*} obj
 * @param {!Array} keys
 * @param {*} val
 * @param {number} idx
 * @return {*}
 */
function setKeys(obj, keys, val, idx) {
	if (val instanceof Error) return val

	// last key reached => close
	if (idx === keys.length) return isEqual(obj, val) ? obj : val

	// recursive calls to end of path
	if (!isObj(obj)) return Error('invalid path: ' + keys.join('.'))
	var k = keys[idx],
			o = obj[k],
			v = setKeys(o, keys, val, idx+1)
	return v === o ? obj
		: Array.isArray(obj) ? aSet(obj, +k, v)
			: oSet(obj, k, v)
}


/**
 * @param {!Array} arr
 * @param {number} key
 * @param {*} val
 * @return {!Array|Error}
 */
function aSet(arr, key, val) {
	var tgt = arr.slice()
	if (val === undefined) {
		if (key !== arr.length-1) return Error('only the last array item can be deleted')
		tgt.length = key
		return tgt
	}
	if (key < arr.length) {
		tgt[key] = val
		return tgt
	}
	return Error('invalid array index: ' + key)
}

/**
 * @param {!Object} obj
 * @param {string} key
 * @param {*} val
 * @return {!Object}
 */
function oSet(obj, key, val) {
	for (var i=0, ks=Object.keys(obj), res={}; i<ks.length; ++i) if (ks[i] !== key) res[ks[i]] = obj[ks[i]]
	if (val !== undefined) res[key] = val
	return res
}
