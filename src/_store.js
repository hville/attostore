import {Trie} from './_trie'
import {State} from './_state'
import {getKey} from './get-key'

/**
 * @constructor
 * @param {*} initValue
 * @param {Object} commands
 */
export function Store(initValue, commands) {
	this._ks = new Map
	this._fs = []
	this._cs = commands || {}
	this.data = initValue
	this._ts = new State(initValue)
}

Store.prototype.on = Trie.prototype.on
Store.prototype.off = Trie.prototype.off
Store.prototype.once = Trie.prototype.once

Store.prototype.get = State.prototype.get

/**
 * @param {string} name
 * @param {...*} [param]
 * @return {Error|void}
 */
Store.prototype.run = function(name, param) { //eslint-disable-line no-unused-vars
	var cmd = this._cs[name],
			tmp = this._ts
	if (!cmd) return Error('invalid command ' + name)
	tmp.data = this.data
	for (var i=1, args=[]; i<arguments.length; ++i) args[i-1] = arguments[i]
	cmd.apply(tmp, args)
	return tmp.data instanceof Error ? tmp.data : update(this, tmp.data, null)
}

/**
 * @param {!Object} trie
 * @param {*} val
 * @param {string} key
 * @return {void|Error}
 */
function update(trie, val, key) {
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
