import {on, off, once} from './_ref-event'
import {set} from './_ref-value'
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

	set: set,
	on: on,
	off: off,
	once: once
}
