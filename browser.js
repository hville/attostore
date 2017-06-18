/* hugov@runbox.com | https://github.com/hville/atto-store.git | license:MIT */
var attoStore = (function () {
'use strict';

/**
 * @param {!Array|string} path
 * @param {!Array} [root]
 * @returns {!Array}
 */
function getKeys(path, root) {
	var keys = root || [];
	return !path ? keys : keys.concat(Array.isArray(path) ? path : path.split('/'))
}

/**
 * @constructor
 * @param {!Object} root
 * @param {!Array} keys
 */
function Ref(root, keys) {
	//props: data, last, root, keys, path
	this.root = root;
	this.keys = keys;
}

Ref.prototype = {

	get path() { return this.keys.join('/') },

	set: function(val) {
		this.root.set(this.keys, val);
		return this
	},

	ref: function(path) {
		return !path ? this : new Ref(this.root, getKeys(path, this.keys))
	},

	on: function(evt, fcn, ctx) {
		this.root.events.on(evt, this.keys, fcn, ctx||this, 0);
		return this
	},

	off: function(evt, fcn, ctx) {
		this.root.events.off(evt, this.keys, fcn, ctx||this, 0);
		return this
	},

	once: function(evt, fcn, ctx) {
		this.root.events.once(evt, this.keys, fcn, ctx||this, 0);
		return this
	}
};

function get(obj, key) {
	if (typeof obj === 'object') return obj[key]
}

function reduce(source, callback, result, context) {
	var ctx = context || this;
	if (Array.isArray(source)) for (var i=0; i<source.length; ++i) {
		result = callback.call(ctx, result, source[i], i, source);
	}
	else for (var j=0, ks=Object.keys(source); j<ks.length; ++j) {
		result = callback.call(ctx, result, source[ks[j]], ks[j], source);
	}
	return result
}

/**
 * @constructor
 */
function Events() {
	//add, mod, del, val
	this.evts = [];
	this.kids = {};
}

Events.prototype = {
	constructor: Events,


	on: function(etyp, keys, fcn, ctx, pos) {
		if (keys.length === (pos||0)) {
			// only add if it does not exist
			if (indexOfEvt(this.evts, fcn, ctx) === -1) this.evts.push({f: fcn, c:ctx||null});
		}
		else {
			var kids = this.kids;
			if (!kids[keys[pos]]) kids[keys[pos]] = new Events;
			kids[keys[pos]].on(etyp, keys, fcn, ctx, (pos||0)+1);
		}
	},

	off: function(etyp, keys, fcn, ctx, pos) {
		if (keys.length === (pos||0)) {
			var idx = indexOfEvt(this.evts, fcn, ctx);
			if (idx !== -1) this.evts.splice(idx, 1);
		}
		else {
			var kid = this.kids[keys[pos]];
			if (kid) {
				kid.off(keys, fcn, ctx, (pos||0)+1);
				if (!kid.evts.length && !Object.keys(kid.kids).length) delete this.kids[keys[pos]];
			}
		}
	},

	once: function(etyp, keys, fcn, ctx) {
		function wrapped(data, last, ks) {
			this.off(etyp, keys, wrapped, this, 0);
			fcn.call(ctx || this, data, last, ks);
		}
		return this.on(etyp, keys, wrapped, this, 0)
	},

	fire: function(data, last, keys) {
		var evts = this.evts;

		// collect changes
		var changes = keys.length ? [keys[0]]
		: (last && data) ? reduce(data, added, reduce(last, changed, [], data), last)
		: last && typeof last === 'object' ? Object.keys(last)
		: data && typeof data === 'object' ? Object.keys(data)
		: [];

		// fire self
		for (var i=0; i<evts.length; ++i) evts[i].f.call(evts[i].c, data, last, changes);
		// fire kids
		for (var j=0; j<changes.length; ++j) {
			var kid = this.kids[changes[j]];
			if (kid) kid.fire(get(data, changes[j]), get(last, changes[j]), keys.slice(1));
		}
	}
};

function changed(r,v,k) {
	if (this[k] !== v) r.push(k);
	return r
}
function added(r,v,k) {
	if (this[k] === undefined) r.push(k);
	return r
}
function indexOfEvt(lst, fcn, ctx) {
	for (var i=0; i<lst.length; ++i) if (lst[i].f === fcn && lst[i].c === ctx) return i
	return -1
}

/**
 * @function
 * @param {*} v - object to test
 * @return {*} null|undefined|Constructor
 */
function cType(v) {
	//null, String, Boolean, Number, Object, Array
	return v == null ? v : v.constructor || Object
}

/**
 * deep Equal check on JSON-like objects
 * @function
 * @param {*} obj - object to check
 * @param {*} ref - the reference
 * @return {boolean|void} true if equal
 */
function isEqual(obj, ref) {
	var cO = cType(obj),
			cR = cType(ref);
	if (cO !== cR) return false
	if (cO === Array) {
		if (obj.length !== ref.length) return false
		for (var i=0; i<obj.length; ++i) if (!isEqual(obj[i], ref[i])) return false
		return true
	}
	if (cO === Object) {
		var ko = Object.keys(obj); //TODO type annotation obj: Object
		if (ko.length !== Object.keys(ref).length) return false //TODO type annotation typeof ref: Object
		for (i=0; i<ko.length; ++i) if (!isEqual(obj[ko[i]], ref[ko[i]])) return false
		return true
	}
	else return obj === ref
}

/**
 * @constructor
 * @param {*} initValue
 */
function Store(initValue) {
	//props: data, last, root, keys, path
	this.events = new Events;
	this.data = initValue == null ? null : initValue;
	this.last = null;
	this.error = '';
}

Store.prototype = {
	constructor: Store,

	/**
	 * @param {!Array|string} path
	 * @param {*} value
	 * @return {!Object}
	 */
	set: function(path, value) {
		var keys = getKeys(path),
				data = this.data,
				newD = keys.length ? this._setUp(data, keys, value, 0) : isEqual(data, value) ? data
			: value;
		if (newD !== this.data && newD !== undefined) {
			this.error = '';
			this.last = data;
			this.data = newD;
			this.events.fire(newD, this.last, keys);
		}
		return this
	},

	/**
	 * @param {Array|string} [path]
	 * @return {!Object}
	 */
	ref: function(path) {
		return new Ref(this, getKeys(path))
	},

	/**
	 * @param {!Array} arr
	 * @param {number} key
	 * @param {*} val
	 * @return {!Array}
	 */
	_aSet: function(arr, key, val) {
		var tgt = arr.slice();
		if (val === undefined) {
			if (key !== arr.length-1) {
				this.error = 'only the last array item can be deleted';
				return arr
			}
			tgt.length = key;
			return tgt
		}
		if (key <= arr.length) {
			tgt[key] = val;
			return tgt
		}
		this.error = 'invalid array index: ' + key;
		return arr
	},

	/**
	 * @param {!Object} obj
	 * @param {string} key
	 * @param {*} val
	 * @return {!Object}
	 */
	_oSet: function(obj, key, val) {
		for (var i=0, ks=Object.keys(obj), res={}; i<ks.length; ++i) if (ks[i] !== key) res[ks[i]] = obj[ks[i]];
		if (val !== undefined) res[key] = val;
		return res
	},

	/**
	 * @param {*} leaf
	 * @param {!Array} keys
	 * @param {*} data
	 * @param {number} step
	 * @return {*}
	 */
	_setUp: function(leaf, keys, data, step) {
		if (typeof leaf !== 'object') {
			this.error = 'invalid path ' + keys.join('/') + ' at ' + step;
			return leaf
		}

		var key = keys[step],
				val = data;

		if (step === keys.length - 1) {
			if (isEqual(leaf[key], data)) return leaf
		}
		else {
			val = this._setUp(leaf[key], keys, data, step + 1);
			if (leaf[key] === val) return leaf
		}

		return Array.isArray(leaf) ? this._aSet(leaf, key, val) : this._oSet(leaf, key, val)
	}
};

// @ts-check
function db(value) {
	return (new Store(value)).ref()
}

return db;

}());
