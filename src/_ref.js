import {getKeys} from './get-keys'

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

	set: function(val) {
		this.root.set(this.keys, val)
		return this
	},

	ref: function(path) {
		return !path ? this : new Ref(this.root, getKeys(path, this.keys))
	},

	on: function(evt, fcn, ctx) {
		this.root.events.on(evt, this.keys, fcn, ctx||this, 0)
		return this
	},

	off: function(evt, fcn, ctx) {
		this.root.events.off(evt, this.keys, fcn, ctx||this, 0)
		return this
	},

	once: function(evt, fcn, ctx) {
		this.root.events.once(evt, this.keys, fcn, ctx||this, 0)
		return this
	}
}
