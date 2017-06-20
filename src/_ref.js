import {on, off, once} from './_ref-event'
import {pathKeys} from './path-keys'

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
	 * @param {Array|string} [path]
	 * @return {!Object}
	 */
	ref: function(path) {
		return new Ref(this._db, this.keys.concat(pathKeys(path)))
	},

	set: function(val, ondone) {
		this._db.set(this.keys, val, ondone)
		return this
	},

	on: on,
	off: off,
	once: once
}
