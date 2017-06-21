export function on(typ, fcn, ctx) {
	var trie = this._db._emit.set(this.keys),
			list = trie[typ]
	if (list && trie.indexOf(typ, fcn, ctx) === -1) list.push({f: fcn, c:ctx||null})
	return this
}

export function	off(typ, fcn, ctx) {
	var root = this._db._emit,
			trie = root.get(this.keys)
	if (trie) {
		var list = trie[typ],
				idx = trie.indexOf(typ, fcn, ctx)
		if (idx !== -1) {
			list.splice(idx, 1)
			if (!list.length) root.del(this.keys)
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
