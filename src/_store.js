import {pathKeys} from './path-keys'
import {isObj} from './type'
import {patch} from './_store-edits'
import {run} from './_store-ops'
import {on, off, once} from './_store-events'

/**
 * @constructor
 * @param {*} [data]
 * @param {Object} [commands]
 */
export function Store(data, commands) {
	this._ks = new Map
	this._fs = []
	this._cs = commands || {}
	this.data = data
}

Store.prototype.on = on
Store.prototype.off = off
Store.prototype.once = once

Store.prototype.patch = patch
Store.prototype.run = run

Store.prototype.get = function(path) {
	var keys = pathKeys(path)
	for (var i=0, itm = this.data; i<keys.length; ++i) {
		if (isObj(itm)) itm = itm[keys[i]]
		else return
	}
	return itm
}
