import {isObj} from './type'
import {getKey} from './get'
import {Emit} from './_emit'

/**
 * @constructor
 */
export function Trie() {
	this._kids = new Map
	this._evts = new Map
}
Trie.prototype = {
	on: Emit.prototype.on,
	off: Emit.prototype.off,
	once: Emit.prototype.once,
	get: function(key) {
		return Array.isArray(key) ? key.reduce(get, this) : get(this, key)
	},
	set: function(key) {
		return Array.isArray(key) ? key.reduce(set, this) : set(this, key)
	},

	del: function(key) {
		del(this, Array.isArray(key) ? key : [key], 0)
	},

	fire: function(val, old) {
		if (val !== old) {
			if (this._evts.has('child')) {
				var valObj = isObj(val),
						oldObj = isObj(old)
				if (valObj) for (var i=0, kvs=Object.keys(val); i<kvs.length; ++i) {
					if (!oldObj || (val[kvs[i]] !== old[kvs[i]])) Emit.prototype.fire.call(this, 'child', val, old, kvs[i])
				}
				if (oldObj) for (var j=0, kos=Object.keys(old); j<kos.length; ++j) {
					if (!valObj || val[kos[j]] === undefined) Emit.prototype.fire.call(this, 'child', val, old, kos[j])
				}
			}
			if (valObj || oldObj) this._kids.forEach(function(kid, key) {
				var v = getKey(val, key),
						o = getKey(old, key)
				if (v !== o) kid.fire(v,o)
			})
			Emit.prototype.fire.call(this, 'value', val, old)
		}
	}
}

function get(trie, key) {
	return trie && trie._kids.get(key)
}

function set(trie, key) {
	if (!trie._kids.has(key)) trie._kids.set(key, new Trie)
	return trie._kids.get(key)
}

function del(trie, keys, idx) {
	var key = keys[idx++],
			kid = trie._kids.get(key)
	if (kid) {
		if (idx !== keys.length) del(kid, keys, idx)
		if (!kid._kids.size && !kid._evts.size) trie._kids.delete(key)
	}
}
