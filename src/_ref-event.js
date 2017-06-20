export function on(typ, fcn, ctx) {
	var evts = this.root.event,
			leaf = setLeaf(evts.dtree, this.keys),
			list = evts[typ].get(leaf),
			evtO = {f: fcn, c:ctx||null}
	if (!list) evts[typ].set(leaf, [evtO])
	else if (indexOfEvt(list, fcn, ctx) === -1) list.push(evtO)
	return this
}

export function	off(typ, fcn, ctx) {
	var evts = this.root.event,
			leaf = getLeaf(evts.dtree, this.keys),
			list = leaf && evts[typ].get(leaf)
	if (list) {
		var idx = indexOfEvt(list, fcn, ctx)
		if (idx !== -1) list.splice(idx, 1)
		if (!list.length) {
			evts[typ].remove(leaf)
			delLeaf(evts.dtree, this.keys, 0, evts.child, evts.value)
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

function getLeaf(trie, keys) {
	for (var i=0, leaf=trie; i<keys.length; ++i) {
		if (!(leaf = leaf[keys[i]])) return
	}
	return leaf
}

function setLeaf(trie, keys) {
	for (var i=0, leaf=trie; i<keys.length; ++i) {
		leaf = leaf[keys[i]] || (leaf[keys[i]] = Object.create(null))
	}
	return leaf
}

function delLeaf(trie, keys, step, mapC, mapV) {
	if (step < keys.length) {
		if (!delLeaf(trie[keys[step]], keys, step+1, mapC, mapV)) return false
		delete trie[keys[step]]
	}
	return !Object.keys(trie).length && !mapC.get(trie) && !mapV.get(trie)
}

function indexOfEvt(lst, fcn, ctx) {
	for (var i=0; i<lst.length; ++i) if (lst[i].f === fcn && lst[i].c === ctx) return i
	return -1
}
