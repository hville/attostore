import {getKey} from './get-key'
import {pathKeys} from './path-keys'

/**
 * @param {Array|string|number} key
 * @param {Function} fcn
 * @param {*} [ctx]
 * @return {!Object}
 */
export function on(key, fcn, ctx) {
	var leaf = setLeaf(this, pathKeys(key)),
			list = leaf._fs
	if (indexOf(list, fcn, ctx) === -1) list.push({f: fcn, c:ctx})
	return this
}

/**
 * @param {Array|string|number} key
 * @param {Function} fcn
 * @param {*} [ctx]
 * @return {!Object}
 */
export function off(key, fcn, ctx) {
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
export function once(key, fcn, ctx) {
	var store = this
	function wrap(v,k,o) {
		store.off(key, wrap, ctx);
		fcn.call(this, v,k,o)
	}
	return this.on(key, wrap, ctx)
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
		if (!itm._ks.has(key)) itm._ks.set(key, new itm.constructor(getKey(itm.data, key)))
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
