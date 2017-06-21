import {isObj} from './type'
import {getKey} from './get'

/**
 * @constructor
 */
export function Emit() {
	this.dtree = Object.create(null)
	this.child = []
	this.value = []
}
Emit.prototype = {
	get: function(key) {
		return Array.isArray(key) ? key.reduce(get, this) : get(this, key)
	},
	set: function(key) {
		return Array.isArray(key) ? key.reduce(set, this) : set(this, key)
	},
	del: function(key) {
		del(this, Array.isArray(key) ? key : [key], 0)
	},
	indexOf: function(typ, fcn, ctx) {
		var list = this[typ]
		if (list) for (var i=0; i<list.length; ++i) if (list[i].f === fcn && list[i].c === ctx) return i
		return -1
	},
	fire: function(val, old) { //TODO take optional keys for direct path
		if (isObj(val) || isObj(old)) for (var i=0, ks=Object.keys(this.dtree); i<ks.length; ++i) {
			var k = ks[i],
					v = getKey(val, k),
					o = getKey(old, k)
			if (v !== o) {
				fire(this.child, val, old, k)
				this.get(k).fire(v,o)
			}
		}
		fire(this.value, val, old)
	}
}

function get(evt, key) {
	if (evt) return evt.dtree[key]
}

function set(evt, key) {
	return evt.dtree[key] || (evt.dtree[key] = new Emit)
}

function del(trie, keys, idx) {
	var key = keys[idx++],
			kid = trie.get(key),
			tip = (idx === keys.length) || del(kid, keys, idx)
	if (!tip || (Object.keys(kid.dtree).length + kid.child.length + kid.value.length)) return false
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
