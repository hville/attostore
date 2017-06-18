/* hugov@runbox.com | https://github.com/hville/atto-store.git | license:MIT */
var attoStore = (function () {
'use strict';

// @ts-check
function getKeys(path, root) {
	var keys = root || [];
	return !path ? keys : keys.concat(Array.isArray(path) ? path : path.split('/'))
}

// @ts-check
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
/*	get data() {
		for (var i=0, val=this.root.data, keys = this.keys; i<keys.length; ++i) {
			if (typeof val !== 'object') return undefined
			val = val[keys[i]]
		}
		return val
	},
	get last() {
		for (var i=0, val=this.root.last, keys = this.keys; i<keys.length; ++i) {
			if (typeof val !== 'object') return undefined
			val = val[keys[i]]
		}
		return val
	},*/

	set: function(val) {
		this.root.set(this.keys, val);
		return this
	},

	ref: function(path) {
		return !path ? this : new Ref(this.root, getKeys(path, this.keys))
	},

	on: function(path, fcn, ctx) {
		this.root.events.on(getKeys(path, this.keys), fcn, ctx||this, 0);
		return this
	},

	off: function(path, fcn, ctx) {
		this.root.events.off(getKeys(path, this.keys), fcn, ctx||this, 0);
		return this
	},

	once: function(path, fcn, ctx) {
		this.root.events.once(getKeys(path, this.keys), fcn, ctx||this, 0);
		return this
	}
};

// @ts-check
function get(obj, key) {
	if (typeof obj === 'object') return obj[key]
}

// @ts-check
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

// @ts-check
/**
 * @constructor
 */
function Events() {
	this.evts = [];
	this.kids = {};
}

Events.prototype = {
	constructor: Events,

	indexOf: function (fcn, ctx) {
		for (var i=0, evts=this.evts; i<evts.length; ++i) if (evts[i].f === fcn && evts[i].c === ctx) return i
		return -1
	},

	on: function(keys, fcn, ctx, pos) {
		if (keys.length === (pos||0)) {
			// only add if it does not exist
			if (this.indexOf(fcn, ctx) === -1) this.evts.push({f: fcn, c:ctx||null});
		}
		else {
			var kids = this.kids;
			if (!kids[keys[pos]]) kids[keys[pos]] = new Events;
			kids[keys[pos]].on(keys, fcn, ctx, (pos||0)+1);
		}
	},

	off: function(keys, fcn, ctx, pos) {
		if (keys.length === (pos||0)) {
			var idx = this.indexOf(fcn, ctx);
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

	once: function(keys, fcn, ctx) {
		function wrapped(data, last, ks) {
			this.off(keys, wrapped, this, 0);
			fcn.call(ctx || this, data, last, ks);
		}
		return this.on(keys, wrapped, this, 0)
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

// @ts-check
/**
 * @function
 * @param {*} v - object to test
 * @return {*} null|undefined|Constructor
 */
function cType(v) {
	//null, String, Boolean, Number, Object, Array
	return v == null ? v : v.constructor || Object
}

// @ts-check
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
		var ko = Object.keys(obj);
		if (ko.length !== Object.keys(ref).length) return false
		for (i=0; i<ko.length; ++i) if (!isEqual(obj[ko[i]], ref[ko[i]])) return false
		return true
	}
	else return obj === ref
}

// @ts-check
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
		var keys = getKeys(path);
		var data = keys.length ? this._set(this.data, keys, value, 0)
			: isEqual(this.data, value) ? this.data
			: value;
		if (data !== this.data && data !== undefined) {
			this.error = '';
			this.last = this.data;
			this.data = data;
			this.events.fire(data, this.last, keys);
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
	_set: function(leaf, keys, data, step) {
		if (typeof leaf !== 'object') {
			this.error = 'invalid path ' + keys.join('/') + ' at ' + step;
			return leaf
		}

		var key = keys[step];

		if (step === keys.length - 1) return isEqual(leaf[key], data) ? leaf
			: Array.isArray(leaf) ? this._aSet(leaf, key, data)
			: this._oSet(leaf, key, data)

		var val = this._set(leaf[key], keys, data, step + 1);

		return leaf[key] === val ? leaf
			: Array.isArray(leaf) ? this._aSet(leaf, key, val)
			: this._oSet(leaf, key, val)
	}
};

// @ts-check
function db(value) {
	return (new Store(value)).ref()
}

return db;

}());
