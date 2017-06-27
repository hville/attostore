/**
 * @constructor
 */
export function Emit() {
	this._evts = new Map
}

Emit.prototype.on = function(typ, fcn, ctx) {
	var list = 	this._evts.get(typ)
	if (!list) this._evts.set(typ, list = [{f: fcn, c:ctx||null}])
	else if (indexOf(list, fcn, ctx) === -1) list.push({f: fcn, c:ctx||null})
}

Emit.prototype.off = function(typ, fcn, ctx) {
	var arr = this._evts.get(typ),
			idx = indexOf(arr, fcn, ctx)
	if (idx !== -1) {
		arr.splice(idx, 1)
		if (!arr.length) this._evts.delete(typ)
	}
}

Emit.prototype.once = function(etyp, fcn, ctx) {
	function wrapped(data, last, ks) {
		this.off(etyp, wrapped, this)
		fcn.call(ctx || this, data, last, ks)
	}
	return this.on(etyp, wrapped, this)
}

/**
 * @param {string} typ
 * @param {*} [a0]
 * @param {*} [a1]
 * @param {*} [a2]
 * @return {void}
 */
Emit.prototype.fire = function(typ, a0, a1, a2) {
	var list = 	this._evts.get(typ)
	if (list) for (var i=0; i<list.length; ++i) list[i].f.call(list[i].c, a0, a1, a2)
}


function indexOf(arr, fcn, ctx) {
	if (arr) for (var i=0; i<arr.length; ++i) if (arr[i].f === fcn && arr[i].c === ctx) return i
	return -1
}
