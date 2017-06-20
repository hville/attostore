import {on, off, once} from './_ref-event'
import {set} from './_ref-value'

/**
 * @constructor
 * @param {!Object} root
 * @param {!Array} keys
 */
export function Ref(root, keys) {
	//props: data, last, root, keys, path
	this.root = root
	this.keys = keys
}

Ref.prototype = {
	get path() { return this.keys.join('/') },

	/**
	 * @param {Array|string} [path]
	 * @return {!Object}
	 */
	ref: function(path) {
		return !path ? this : new Ref(this.root, this.keys.concat(Array.isArray(path) ? path : path.split('/')))
	},

	set: set,
	on: on,
	off: off,
	once: once
}
