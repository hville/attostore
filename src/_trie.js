import {isObj} from './type'
import {getKey} from './get'
import {pathKeys} from './path-keys'
import {once} from './once'
import {Ref} from './_ref'


/**
 * @constructor
 */
export function Trie() {
	this._ks = new Map
	this._fs = []
	this.data = undefined
}

/**
 * @memberof Store
 * @param {Array|string|number} [path]
 * @return {!Object}
 */
Trie.prototype.ref = function(path) {
	return new Ref(this, pathKeys(path))
}


Trie.prototype.on = function(key, fcn, ctx) {
	var leaf = set(this, pathKeys(key)),
			list = leaf._fs
	if (indexOf(list, fcn, ctx) === -1) list.push({f: fcn, c:ctx||null})
	return this
}

Trie.prototype.off = function(key, fcn, ctx) {
	var keys = pathKeys(key),
			itm = get(this, keys),
			arr = itm && itm._fs,
			idx = indexOf(arr, fcn, ctx)
	if (idx !== -1) {
		arr.splice(idx, 1)
		if (!arr.length && !itm._ks.size) del(this, keys, 0)
	}
	return this
}

Trie.prototype.once = once

/**
 * @param {*} val
 * @return {void}
 */
Trie.prototype.update = function(val) {
	if (val !== this.data) {
		var old = this.data,
				dif = null
		// update kids first
		this._ks.forEach(updateKid, val)

		// update self
		for (var i=0, fs=this._fs; i<fs.length; ++i) {
			var fcn = fs[i].f
			//compute changes only once and only if required
			if (fcn.length > 2) {
				if (!dif) dif = compare(val, old)
				fcn.call(fs[i].c, val, old, dif[0], dif[1], dif[2])
			}
			else fcn.call(fs[i].c, val, old)
		}
	}
}

function get(root, keys) {
	for (var i=0, itm = root; i<keys.length; ++i) {
		if (itm !== undefined) itm = itm._ks.get(''+keys[i])
	}
	return itm
}

function set(root, keys) {
	for (var i=0, itm = root; i<keys.length; ++i) {
		var key = ''+keys[i]
		if (!itm._ks.has(key)) itm._ks.set(key, new Trie)
		itm = itm._ks.get(key)
	}
	return itm
}

function del(trie, keys, idx) {
	var key = keys[idx++],
			kid = trie._ks.get(key)
	if (kid) {
		if (idx !== keys.length) del(kid, keys, idx)
		if (!kid._ks.size && !kid._fs.length) trie._ks.delete(key)
	}
}

function indexOf(arr, fcn, ctx) {
	if (arr) for (var i=0; i<arr.length; ++i) if (arr[i].f === fcn && arr[i].c === ctx) return i
	return -1
}

function compare(val, old) {
	var kvs = isObj(val) ? Object.keys(val) : [],
			kos = isObj(old) ? Object.keys(old) : []

	if (!kvs.length || !kos.length) return [kvs, [], kos]
	var dif = [[],[],[]]
	for (var i=0; i<kvs.length; ++i) {
		if (old[kvs[i]] === undefined) dif[0].push(kvs[i]) // added
		if (val[kvs[i]] !== old[kvs[i]]) dif[1].push(kvs[i]) // changed
	}
	for (var j=0; j<kos.length; ++j) {
		if (val[kos[j]] === undefined) dif[2].push(kos[j]) // removed
	}
	return dif
}

function updateKid(kid, k) {
	kid.update(getKey(this, k))
}
