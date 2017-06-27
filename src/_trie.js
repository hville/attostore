import {isObj} from './type'
import {getKey} from './get'
import {Emit} from './_emit'

/**
 * @constructor
 */
export function Trie() {
	this.dtree = Object.create(null)
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
	fire: function(val, old) { //TODO take optional keys for direct path
		if (isObj(val) || isObj(old)) for (var i=0, ks=Object.keys(this.dtree); i<ks.length; ++i) {
			var k = ks[i],
					v = getKey(val, k),
					o = getKey(old, k)
			if (v !== o) {
				Emit.prototype.fire.call(this, 'child', val, old, k)
				this.get(k).fire(v,o)
			}
		}
		Emit.prototype.fire.call(this, 'value', val, old)
	}
}

function get(evt, key) {
	if (evt) return evt.dtree[key]
}

function set(evt, key) {
	return evt.dtree[key] || (evt.dtree[key] = new Trie)
}

function del(trie, keys, idx) {
	var key = keys[idx++],
			kid = trie.get(key),
			tip = (idx === keys.length) || del(kid, keys, idx)
	if (!tip || (Object.keys(kid.dtree).length + kid._evts.size)) return false
	return delete trie.dtree[key]
}

/**
 * @param {Array} list
 * @param {*} data
 * @param {*} last
 * @param {string|number} [key]
 * @return {void}
 */
function fire(list, data, last, key) {
	if (list) for (var i=0; i<list.length; ++i) list[i].f.call(list[i].c, data, last, key)
}
