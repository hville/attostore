import {getKey} from './get-key'
import {pathKeys} from './path-keys'
import {isObj} from './type'
import {isEqual} from './is-eq'

/**
 * @constructor
 * @param {*} [data]
 */
export function Store(data) {
	this._ks = new Map
	this._fs = []
	this.data = data
}

/**
 * @param {Array|string|number} key
 * @param {Function} fcn
 * @param {*} [ctx]
 * @return {!Object}
 */
Store.prototype.on = function(key, fcn, ctx) {
	var leaf = setLeaf(this, pathKeys(key)),
			list = leaf._fs
	if (indexOf(list, fcn, ctx) === -1) list.push({f: fcn, c:ctx||null})
	return this
}

/**
 * @param {Array|string|number} key
 * @param {Function} fcn
 * @param {*} [ctx]
 * @return {!Object}
 */
Store.prototype.off = function(key, fcn, ctx) {
	var keys = pathKeys(key),
			itm = getLeaf(this, keys),
			arr = itm && itm._fs,
			idx = indexOf(arr, fcn, ctx)
	if (idx !== -1) {
		arr.splice(idx, 1)
		if (!arr.length && !itm._ks.size) delLeaf(this, keys, 0)
	}
	return this
}

/**
 * @param {Array|string|number} key
 * @param {Function} fcn
 * @param {*} [ctx]
 * @return {!Object}
 */
Store.prototype.once = function(key, fcn, ctx) {
	function wrap(v,k,o) {
		this.off(key, wrap, this);
		fcn.call(ctx, v,k,o)
	}
	return this.on(key, wrap, this)
}

Store.prototype.set = set

Store.prototype.get = function(path) {
	var keys = pathKeys(path)
	for (var i=0, itm = this.data; i<keys.length; ++i) {
		if (isObj(itm)) itm = itm[keys[i]]
		else return
	}
	return itm
}


function getLeaf(root, keys) {
	for (var i=0, itm = root; i<keys.length; ++i) {
		if (itm !== undefined) itm = itm._ks.get(''+keys[i])
	}
	return itm
}

function setLeaf(root, keys) {
	for (var i=0, itm = root; i<keys.length; ++i) {
		var key = ''+keys[i]
		if (!itm._ks.has(key)) itm._ks.set(key, new Store(getKey(itm.data, key)))
		itm = itm._ks.get(key)
	}
	return itm
}

function delLeaf(trie, keys, idx) {
	var key = keys[idx++],
			kid = trie._ks.get(key)
	if (kid) {
		if (idx !== keys.length) delLeaf(kid, keys, idx)
		if (!kid._ks.size && !kid._fs.length) trie._ks.delete(key)
	}
}

function indexOf(arr, fcn, ctx) {
	if (arr) for (var i=0; i<arr.length; ++i) if (arr[i].f === fcn && arr[i].c === ctx) return i
	return -1
}

function set(acts, ondone) {
	var data = Array.isArray(acts) ? acts.reduce(setRed, this.data) : setRed(this.data, acts)
	if (data instanceof Error) {
		if (!ondone) return Promise.reject(data)
		ondone(data)
		return
	}
	var done = data === this.data ? null : acts
	update(this, data, null)
	if (!ondone) return Promise.resolve(done)
	ondone(null, done)
}

function setRed(res, act) {
	return res instanceof Error ? res : setKeys(res, pathKeys(act.key), act.val, 0)
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
	return v === o ? obj : Array.isArray(obj) ? aSet(obj, +k, v) : oSet(obj, k, v)
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

/**
 * @param {!Object} store
 * @param {*} val
 * @param {string} key
 * @return {void}
 */
function update(store, val, key) {
	if (val !== store.data) {
		var old = store.data
		store.data = val
		// fire kids first...
		store._ks.forEach(updateKid, val)
		// ...then self
		for (var i=0, fs=store._fs; i<fs.length; ++i) {
			fs[i].f.call(fs[i].c, val, key, old)
		}
	}
}

function updateKid(kid, k) {
	update(kid, getKey(this, k), k)
}
