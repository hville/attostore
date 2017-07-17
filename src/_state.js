import {isEqual} from './is-eq'
import {pathKeys} from './path-keys'
import {isObj} from './type'

/**
 * @constructor
 * @param {*} [data]
 * @param {Object} [commands]
 */
export function State(data) {
	this.data = data
}

State.prototype.get = function(path) {
	var keys = pathKeys(path)
	for (var i=0, itm = this.data; i<keys.length; ++i) {
		if (isObj(itm)) itm = itm[keys[i]]
		else return
	}
	return itm
}

/**
 * @param {null|string|Array} path
 * @param {*} data
 * @return {Object}
 */
State.prototype.set = function(path, data) {
	if (!(this.data instanceof Error)) this.data = setKeys(this.data, pathKeys(path), data, 0)
	return this
}

/**
 * @param {null|string|Array} path
 * @return {Object}
 */
State.prototype.delete = function(path) {
	return this.set(path, undefined)
}

/**
 * @param {*} obj
 * @param {!Array} keys
 * @param {*} val
 * @param {number} idx
 * @return {*}
 */
function setKeys(obj, keys, val, idx) {
	// last key reached => close
	if (idx === keys.length) return isEqual(obj, val) ? obj : val

	// recursive calls to end of path
	if (!isObj(obj)) return Error('invalid path: ' + keys.join('/'))
	var k = keys[idx],
			o = obj[k],
			v = setKeys(o, keys, val, idx+1)
	return v instanceof Error ? v : v === o ? obj : Array.isArray(obj) ? aSet(obj, +k, v) : oSet(obj, k, v)
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
	if (key <= arr.length) {
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
