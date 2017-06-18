import {get} from './get'
import {reduce} from './reduce'

/*
	this._keysTree = Object.create(null)
	this._handlers = {
		value: new Map,
		child_added: new Map,
		child_removed: new Map,
		child_changed: new Map,
	}
*/
function getLeaf(tree, keys) {
	for (var i=0, leaf=tree; i<keys.length; ++i) {
		leaf = leaf[keys[i]] || (leaf[keys[i]] = Object.create(null))
	}
}

export function on(etyp, keys, fcn, ctx) {
	var leaf = getLeaf(this._etree, keys),
			evts = this._handlers
	if (!evts[etyp].has(leaf)) evts[etyp].set(leaf, [{f: fcn, c:ctx||null}])
	else evts[etyp].get(leaf).push({f: fcn, c:ctx||null})
}

export function off(etyp, keys, fcn, ctx) {
	var leaf = getLeaf(this._etree, keys),
			evts = this._handlers,
			list = evts[etyp].get(leaf)
	if (list) {
		var idx = indexOfEvt(list, fcn, ctx)
		if (idx !== -1) list.splice(idx, 1)
		if (!list.length) evts[etyp].remove(leaf)
	}
}

export function once(etyp, keys, fcn, ctx) {
	function wrapped(data, last, ks) {
		this.off(etyp, keys, wrapped, this, 0)
		fcn.call(ctx || this, data, last, ks)
	}
	return this.on(etyp, keys, wrapped, this, 0)
}

function fireAdd(evts, leaf, data) {
	var addEvts = evts.child_added.get(leaf),
			valEvts = evts.value.get(leaf)
	if (addEvts && typeof data === 'object') for (var i=0, ks=Object.keys(data); i<ks.length; ++i) {
		var key = ks[i]
		fireList(addEvts, data, undefined, key)
		if (leaf[key]) fireAdd(evts, leaf[key], data[key])
	}
	if (valEvts) fireList(valEvts, data, undefined)
}

function fireDel(evts, leaf, last) {
	var delEvts = evts.child_removed.get(leaf),
			valEvts = evts.value.get(leaf)
	if (delEvts && typeof leaf === 'object') for (var i=0, ks=Object.keys(leaf); i<ks.length; ++i) {
		var key = ks[i]
		fireList(delEvts, undefined, last, key)
		if (leaf[key]) fireDel(evts, leaf[key], last[key])
	}
	if (valEvts) fireList(valEvts, undefined, last)
}

function fireMod(evts, leaf, data, last) {
	if (data === undefined)
	var modEvts = evts.child_changed.get(leaf),
			valEvts = evts.value.get(leaf)
	if (addEvts && typeof data === 'object') for (var i=0, ks=Object.keys(data); i<ks.length; ++i) {
		var key = ks[i]
		fireList(addEvts, data, undefined, key)
		if (leaf[key]) fireAdd(evts, leaf[key], data[key])
	}
	if (valEvts) fireList(valEvts, data, undefined)
}














export function fire(data, last, keys) {
	var evts = this._handlers,
			leaf = this._etree,
			val = data,
			old = last

	// fire events up the path
	for (var i=0; leaf && i<keys.length; ++i) {
		var key = keys[i],
				valEvts = evts.value.get(leaf)

		if (get(old, key) === undefined) fireList(evts.child_added.get(leaf), val, old, key)
		else if (get(val, key) === undefined) fireList(evts.child_removed.get(leaf), val, old, key)
		else if (get(val, key) !== get(old, key)) fireList(evts.child_changed.get(leaf), val, old, key)

		old = get(old, key)
		val = get(val, key)
		leaf = get(leaf, key)
		fireList(evts.value.get(leaf), val, old, key)
	}
	//TODO go up if last key
	fireList(evts.value.get(this._etree), data, last)
}

function fireLeaf(evts, leaf, data, last) {
	var list = ctx._han
}
function fireChild(evts, leaf, data, last, key) {
}

	if (delEvts && typeof last === 'object') for (var i=0, ks=Object.keys(last); i<ks.length; ++i) {
		var key = ks[i]
		if (!data || data[key] === undefined) fireList(delEvts, data, last, key)
	}

	if (valEvts) fireList(evts.value.get(leaf), data, last)
}
function fireLeafs(evts, leaf, data, last) {
	var addEvts = evts.child_added.get(leaf),
			modEvts = evts.child_added.get(leaf),
			delEvts = evts.child_added.get(leaf)
	//added, changed
	if ((addEvts || modEvts) && typeof data === 'object') for (var i=0, ks=Object.keys(data); i<ks.length; ++i) {
		var key = ks[i]
		//TODO add --> add
		//change --> any
		if (!last || last[key] === undefined) fireList(addEvts, data, last, key)
		else if (data[key] === last[key]) fireList(modEvts, data, last, key)
	}
	if (delEvts && typeof last === 'object') for (var i=0, ks=Object.keys(last); i<ks.length; ++i) {
		var key = ks[i]
		if (!data || data[key] === undefined) fireList(delEvts, data, last, key)
	}

	if (valEvts) fireList(evts.value.get(leaf), data, last)
}
function fireList(list, data, last, key) {
	if (list) for (var i=0; i<list.length; ++i) list[i].f.call(list[i].c, data, last, key)
}

	// collect changes
	var changes = keys.length ? [keys[0]]
	: (last && data) ? reduce(data, added, reduce(last, changed, [], data), last)
	: last && typeof last === 'object' ? Object.keys(last)
	: data && typeof data === 'object' ? Object.keys(data)
	: []

	// fire self
	for (var i=0; i<evts.length; ++i) evts[i].f.call(evts[i].c, data, last, changes)
	// fire kids
	for (var j=0; j<changes.length; ++j) {
		var kid = this.kids[changes[j]]
		if (kid) kid.fire(get(data, changes[j]), get(last, changes[j]), keys.slice(1))
	}
}

function changed(r,v,k) {
	if (this[k] !== v) r.push(k)
	return r
}
function added(r,v,k) {
	if (this[k] === undefined) r.push(k)
	return r
}
function indexOfEvt(lst, fcn, ctx) {
	for (var i=0; i<lst.length; ++i) if (lst[i].f === fcn && lst[i].c === ctx) return i
	return -1
}
