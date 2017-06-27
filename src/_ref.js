import {pathKeys} from './path-keys'
import {Emit} from './_emit'


/**
 * @constructor
 * @param {!Object} root
 * @param {!Array} keys
 */
export function Ref(root, keys) {
	this._db = root
	this.keys = keys
}

Ref.prototype = {
	get path() { return this.keys.join('/') },
	get parent() { return new Ref(this._db, this.keys.slice(0,-1)) },
	get root() { return new Ref(this._db, []) },

	/**
	 * @memberof Ref
	 * @param {Array|string} [path]
	 * @return {!Object}
	 */
	ref: function(path) {
		return new Ref(this._db, this.keys.concat(pathKeys(path)))
	},

	set: function(val, ondone) {
		return this._db.patch([{k:this.keys, v:val}], ondone)
	},

	del: function(ondone) {
		return this._db.patch([{k:this.keys}], ondone)
	},

	on: function(typ, fcn, ctx) {
		this._db._trie.set(this.keys).on(typ, fcn, ctx)
		return this
	},

	off: function(typ, fcn, ctx) {
		var root = this._db._trie,
				trie = root.get(this.keys)
		if (trie) {
			trie.off(typ, fcn, ctx)
			if (!trie._evts.size) root.del(this.keys)
		}
		return this
	},
	once: Emit.prototype.once
}
