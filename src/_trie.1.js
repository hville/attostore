import {isObj} from './type'
import {getKey} from './get'
import {pathKeys} from './path-keys'

/**
 * @constructor
 */
export function Trie() {
	this._ks = new Map
	this._fs = []
}

Trie.prototype = {
	on: function(key, fcn, ctx) {
		var leaf = set(this, pathKeys(key)),
				list = leaf._fs
		if (indexOf(list, fcn, ctx) === -1) list.push({f: fcn, c:ctx||null})
	},
	off: function(key, fcn, ctx) {
		var keys = pathKeys(key),
				itm = get(this, keys),
				arr = itm && itm._fs,
				idx = indexOf(arr, fcn, ctx)
		if (idx !== -1) {
			arr.splice(idx, 1)
			if (!arr.length && !itm._ks.size) del(this, keys, 0)
		}
	},
	once: function(key, fcn, ctx) {
		function wrapped(data, last, ks) {
			this.off(key, wrapped, this)
			fcn.call(ctx || this, data, last, ks)
		}
		return this.on(key, wrapped, this)
	},
	emit: function(val, old) {
		this._ks.forEach(function(kid, key) {
			if (key === '*') {
				var keys = filterKeys(val, old)
				for (var i=0; i<keys.length; ++i) emit(kid, getKey(val, keys[i]), keys[i], val, old)
			}
			else {
				var v = getKey(val, key),
						o = getKey(old, key)
				if (v !== o) {
					kid.emit(v, o)
					emit(kid, v, key, val, old)
				}
			}
		})
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

function emit(trie, v, k, n, o) {
	for (var i=0, fs=trie._fs; i<fs.length; ++i) fs[i].f.call(fs[i].c, v,k,n,o)
}

function filterKeys(val, old) {
	var res = [],
			kvs = isObj(val) ? Object.keys(val) : [],
			kos = isObj(old) ? Object.keys(old) : []
	if (!kvs.length) return kos
	if (!kos.length) return kvs

	for (var i=0; i<kvs.length; ++i) if (val[kvs[i]] !== old[kvs[i]]) res.push(kvs[i])
	for (var j=0; j<kos.length; ++j) if (val[kos[j]] === undefined) res.push(kos[j])
	return res
}
