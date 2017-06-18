import {get} from './get'
import {reduce} from './reduce'

/**
 * @constructor
 */
export function Events() {
	//add, mod, del, val
	this.evts = []
	this.kids = {}
}

Events.prototype = {
	constructor: Events,


	on: function(etyp, keys, fcn, ctx, pos) {
		if (keys.length === (pos||0)) {
			// only add if it does not exist
			if (indexOfEvt(this.evts, fcn, ctx) === -1) this.evts.push({f: fcn, c:ctx||null})
		}
		else {
			var kids = this.kids
			if (!kids[keys[pos]]) kids[keys[pos]] = new Events
			kids[keys[pos]].on(etyp, keys, fcn, ctx, (pos||0)+1)
		}
	},

	off: function(etyp, keys, fcn, ctx, pos) {
		if (keys.length === (pos||0)) {
			var idx = indexOfEvt(this.evts, fcn, ctx)
			if (idx !== -1) this.evts.splice(idx, 1)
		}
		else {
			var kid = this.kids[keys[pos]]
			if (kid) {
				kid.off(keys, fcn, ctx, (pos||0)+1)
				if (!kid.evts.length && !Object.keys(kid.kids).length) delete this.kids[keys[pos]]
			}
		}
	},

	once: function(etyp, keys, fcn, ctx) {
		function wrapped(data, last, ks) {
			this.off(etyp, keys, wrapped, this, 0)
			fcn.call(ctx || this, data, last, ks)
		}
		return this.on(etyp, keys, wrapped, this, 0)
	},

	fire: function(data, last, keys) {
		var evts = this.evts

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
