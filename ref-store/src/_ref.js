import {on, off, once, _fire, _indexOfHandler} from './_ref-proto-events'
import {set, _set, _setKids} from './_ref-proto-update'

/**
 * @constructor
 * @param {Object} kin
 * @param {string|number} key
 * @param {*} val
 */
export function Ref(kin, key, val) {
	this.kin = kin //root: null
	this.key = key //root: null
	this._kids = {}
	this._subs = []
	this.data = val == null ? null : val
}

Ref.prototype = {

	get root() {
		var ref = this
		while (ref.kin) ref = ref.kin
		return ref
	},

	ref: function(path) {
		var keys = Array.isArray(path) ? path : path.split('/'),
				kids = this._kids,
				kid = this,
				val = this.data
		for (var i=0; i<keys.length; ++i) {
			var key = keys[i]
			val = val && val[key]
			kid = kids[key] || (kids[key] = new Ref(this, key, val))
		}
		return kid
	},

	// event handlers
	on: on,
	off: off,
	once: once,
	_fire: _fire,
	_indexOfHandler: _indexOfHandler,

	// updates
	set: set,
	_set: _set,
	_setKids: _setKids
}
