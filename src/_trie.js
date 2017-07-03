import {getKey} from './get-key'
import {pathKeys} from './path-keys'
import {patch, set, del} from './patch'
import {isObj} from './type'

/**
 * @constructor
 * @param {*} [data]
 */
export function Trie(data) {
	this._ks = new Map
	this._fs = []
	this.data = data
}

/**
 * @memberof Store
 * @param {Array|string|number} [path]
 * @return {!Object}
 */
Trie.prototype = {

	on: function(key, fcn, ctx) {
		var leaf = setLeaf(this, pathKeys(key)),
				list = leaf._fs
		if (indexOf(list, fcn, ctx) === -1) list.push({f: fcn, c:ctx||null})
		return this
	},

	off: function(key, fcn, ctx) {
		var keys = pathKeys(key),
				itm = getLeaf(this, keys),
				arr = itm && itm._fs,
				idx = indexOf(arr, fcn, ctx)
		if (idx !== -1) {
			arr.splice(idx, 1)
			if (!arr.length && !itm._ks.size) delLeaf(this, keys, 0)
		}
		return this
	},

	once: function(key, fcn, ctx) {
		function wrap(a,b) {
			this.off(key, wrap, this);
			fcn.call(ctx, a,b)
		}
		return this.on(key, wrap, this)
	},

	/**
	 * @param {*} val
	 * @return {void}
	 */
	_set: function(val) {
		if (val !== this.data) {
			var old = this.data
			this.data = val

			// fire kids first...
			this._ks.forEach(updateKid, val)
			// ...then self
			for (var i=0, fs=this._fs; i<fs.length; ++i) {
				fs[i].f.call(fs[i].c, val, old)
			}
		}
	},

	patch: patch,
	set: set,
	delete: del,
	get: function(path) {
		var keys = pathKeys(path)
		for (var i=0, itm = this.data; i<keys.length; ++i) {
			if (isObj(itm)) itm = itm[keys[i]]
			else return
		}
		return itm
	}

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
		if (!itm._ks.has(key)) itm._ks.set(key, new Trie(getKey(itm.data, key)))
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

function updateKid(kid, k) {
	kid._set(getKey(this, k))
}
