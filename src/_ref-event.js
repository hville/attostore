export function on(typ, fcn, ctx) {
	var evts = this._db.event,
			leaf = evts.setLeaf(this.keys),
			list = evts[typ].get(leaf),
			evtO = {f: fcn, c:ctx||null}
	if (!list) evts[typ].set(leaf, [evtO])
	else if (indexOfEvt(list, fcn, ctx) === -1) list.push(evtO)
	return this
}

export function	off(typ, fcn, ctx) {
	var evts = this._db.event,
			leaf = evts.getLeaf(this.keys),
			list = leaf && evts[typ].get(leaf)
	if (list) {
		var idx = indexOfEvt(list, fcn, ctx)
		if (idx !== -1) list.splice(idx, 1)
		if (!list.length) {
			evts[typ].delete(leaf)
			evts.delLeaf(this.keys)
		}
	}
	return this
}

export function once(etyp, fcn, ctx) {
	function wrapped(data, last, ks) {
		this.off(etyp, wrapped, this)
		fcn.call(ctx || this, data, last, ks)
	}
	return this.on(etyp, wrapped, this)
}

function indexOfEvt(lst, fcn, ctx) {
	for (var i=0; i<lst.length; ++i) if (lst[i].f === fcn && lst[i].c === ctx) return i
	return -1
}
