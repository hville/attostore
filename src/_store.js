import {pathKeys} from './path-keys'
import {isObj} from './type'
import {set, del, act, run} from './_store-edits'
import {on, off, once} from './_store-events'

/**
 * @constructor
 * @param {*} [data]
 */
export function Store(data) {
	this._ks = new Map
	this._fs = []
	this.data = data
}

Store.prototype.on = on
Store.prototype.off = off
Store.prototype.once = once

Store.prototype.set = set
Store.prototype.delete = del
Store.prototype.act = act
Store.prototype.run = run


Store.prototype.get = function(path) {
	var keys = pathKeys(path)
	for (var i=0, itm = this.data; i<keys.length; ++i) {
		if (isObj(itm)) itm = itm[keys[i]]
		else return
	}
	return itm
}
