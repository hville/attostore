import {setKey} from './key-set'
import {isEqual} from './is-eq'

export function set(data) {
	var val = data == null ? null : data
	if (!isEqual(this.data, val)) {
		this._set(val) // update data and refs trees down to the root
		this._setKids(val) // update kids
	}
	return this
}

export function _setKey(key, val) { //self down to root
	var data = this.kin._setKey(key, val)

	var last = this.data
	this.data = data
	var kin = this.kin
	if (kin) kin._set(setKey(kin.data, this.key, data))
	this._fire(last)
}

export function _set(data) { //self down to root
	var last = this.data
	this.data = data
	var kin = this.kin
	if (kin) kin._set(setKey(kin.data, this.key, data))
	this._fire(last)
}

export function _setKids(data) {
	var kids = this._kids
	for (var i=0, ks=Object.keys(kids); i<ks.length; ++i) {
		var key = ks[i],
				kid = kids[key],
				val = (data && data[key]) == null ? null : data[key]
		if (kid.data !== val) {
			kid.data = val
			kid._fire()
			kid._setKids(val)
		}
	}
}
