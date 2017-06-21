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

	on: on,
	off: off,
	once: once
}
