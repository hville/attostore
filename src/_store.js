import {Trie} from './_trie'
import {getKey} from './get-key'
import {isEqual} from './is-eq'
import {pathKeys} from './path-keys'
import {isObj} from './type'

/**
 * @constructor
 * @param {*} initValue
 */
export function Store(initValue) {
	this._ks = new Map
	this._fs = []
	this.data = initValue
}

Store.prototype.on = Trie.prototype.on
Store.prototype.off = Trie.prototype.off
Store.prototype.once = Trie.prototype.once

Store.prototype.get = function(path) {
	var keys = pathKeys(path)
	for (var i=0, itm = this.data; i<keys.length; ++i) {
		if (isObj(itm)) itm = itm[keys[i]]
		else return
	}
	return itm
}

/**
 * @param {Array|Object} ops
 * @return {Error|void}
 */
Store.prototype.act = function(ops) {
	var res = Array.isArray(ops) ? ops.reduce(act, this.data) : act(this.data, ops)
	return res instanceof Error ? res : update(this, res, null)
}
function act(res, op) {
	return res instanceof Error ? res : setKeys(res, pathKeys(op.p), op.v, 0)
}

/**
 * @param {!Object} trie
 * @param {*} val
 * @param {string} key
 * @return {void|Error}
 */
function update(trie, val, key) { //TODO key???
	if (val instanceof Error) return val

	if (val !== trie.data) {
		var old = trie.data
		trie.data = val
		// fire kids first...
		trie._ks.forEach(updateKid, val)
		// ...then self
		for (var i=0, fs=trie._fs; i<fs.length; ++i) {
			fs[i].f.call(fs[i].c, val, key, old)
		}
	}
}

function updateKid(kid, k) {
	update(kid, getKey(this, k), k)
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
