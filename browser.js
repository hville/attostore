/* hugov@runbox.com | https://github.com/hville/attostore.git | license:MIT */
var attostore = (function () {
'use strict';

/**
 * @function
 * @param {*} v - object to test
 * @return {*} null|undefined|Constructor
 */
function cType(v) {
	//null, String, Boolean, Number, Object, Array
	return v == null ? v : v.constructor || Object
}

function isObj(v) {
	return v && typeof v === 'object'
}

function getKey(obj, key) {
	if (isObj(obj)) return obj[key]
}

function pathKeys(path) {
	return Array.isArray(path) ? path : (path && path.split) ? path.split('/') : cType(path) === Number ? [path] : []
}

function once(key, fcn, ctx) {
	var wrap = fcn.length > 2
		? function(a,b,c,d,e) { this.off(key, wrap, this); fcn.call(ctx, a,b,c,d,e); }
		: function(a,b) { this.off(key, wrap, this); fcn.call(ctx, a,b); };
	return this.on(key, wrap, this)
}

/*
	patchAsync: function(patch, ondone) {
		return promisify(setTimeout, [patchSync, 0, this, patch], ondone)
	},

	patchSync: function(patch, ondone) {
		return promisify(patchSync, [this, patch], ondone)
	}
*/
function promisify(fcn, args, cb) {
	// avoids promises and return void if a callback is provided
	if (cb) fcn.apply(null, args.concat(cb));

	// return a promise only if no callback provided
	else return new Promise(function(done, fail) {
		fcn.apply(null, args.concat(function(err, res) {
			if (err) fail(err);
			else done(res);
		}));
	})
}

/**
 * @constructor
 * @param {!Object} root
 * @param {!Array} keys
 */
function Ref(root, keys) {
	this.store = root;
	this._ks = keys;
}

Ref.prototype = {
	get parent() { return new Ref(this.store, this._ks.slice(0,-1)) },
	get root() { return new Ref(this.store, []) },

	keys: function(path) {
		return this._ks.concat(pathKeys(path))
	},
	/**
	 * @memberof Ref
	 * @param {Array|string} [path]
	 * @return {!Object}
	 */
	ref: function(path) {
		return new Ref(this.store, this.keys(path))
	},

	on: function(path, fcn, ctx) {
		this.store.on(this.keys(path), fcn, ctx);
		return this
	},

	off: function(path, fcn, ctx) {
		this.store.off(this.keys(path), fcn, ctx);
		return this
	},

	once: once,

	set: function(path, val, ondone) {
		return promisify(setTimeout, [storeSet, 0, this.store, this.keys(path), val], ondone)
	},

	del: function(path, ondone) {
		return promisify(setTimeout, [storeSet, 0, this.store, this.keys(path), undefined], ondone)
	},

	query: function(transform) {
		var query = new Trie;
		query._set(transform(this.store.data));
		this.store.on(this._ks, function(v) { query._set(transform(v)); });
		return query
	}
};

function storeSet(src, key, val, cb) {
	return src.patch([val === undefined ? {k:key} : {k:key, v:val}], cb)
}

/**
 * @constructor
 */
function Trie() {
	this._ks = new Map;
	this._fs = [];
	this.data = undefined;
}

/**
 * @memberof Store
 * @param {Array|string|number} [path]
 * @return {!Object}
 */
Trie.prototype = {

	ref: function(path) {
		return new Ref(this, pathKeys(path))
	},

	on: function(key, fcn, ctx) {
		var leaf = set(this, pathKeys(key)),
				list = leaf._fs;
		if (indexOf(list, fcn, ctx) === -1) list.push({f: fcn, c:ctx||null});
		return this
	},

	off: function(key, fcn, ctx) {
		var keys = pathKeys(key),
				itm = get(this, keys),
				arr = itm && itm._fs,
				idx = indexOf(arr, fcn, ctx);
		if (idx !== -1) {
			arr.splice(idx, 1);
			if (!arr.length && !itm._ks.size) del(this, keys, 0);
		}
		return this
	},

	once: once,

	/**
	 * @param {*} val
	 * @return {void}
	 */
	_set: function(val) {
		if (val !== this.data) {
			var old = this.data,
					dif = null;
			// update kids first
			this._ks.forEach(updateKid, val);

			// update self
			this.data = val;
			for (var i=0, fs=this._fs; i<fs.length; ++i) {
				var fcn = fs[i].f;
				//compute changes only once and only if required
				if (fcn.length > 2) {
					if (!dif) dif = compare(val, old);
					fcn.call(fs[i].c, val, old, dif[0], dif[1], dif[2]);
				}
				else fcn.call(fs[i].c, val, old);
			}
		}
	}
};
function get(root, keys) {
	for (var i=0, itm = root; i<keys.length; ++i) {
		if (itm !== undefined) itm = itm._ks.get(''+keys[i]);
	}
	return itm
}

function set(root, keys) {
	for (var i=0, itm = root; i<keys.length; ++i) {
		var key = ''+keys[i];
		if (!itm._ks.has(key)) itm._ks.set(key, new Trie);
		itm = itm._ks.get(key);
	}
	return itm
}

function del(trie, keys, idx) {
	var key = keys[idx++],
			kid = trie._ks.get(key);
	if (kid) {
		if (idx !== keys.length) del(kid, keys, idx);
		if (!kid._ks.size && !kid._fs.length) trie._ks.delete(key);
	}
}

function indexOf(arr, fcn, ctx) {
	if (arr) for (var i=0; i<arr.length; ++i) if (arr[i].f === fcn && arr[i].c === ctx) return i
	return -1
}

function compare(val, old) {
	var kvs = isObj(val) ? Object.keys(val) : [],
			kos = isObj(old) ? Object.keys(old) : [];

	if (!kvs.length || !kos.length) return [kvs, [], kos]
	var dif = [[],[],[]];
	for (var i=0; i<kvs.length; ++i) {
		if (old[kvs[i]] === undefined) dif[0].push(kvs[i]); // added
		if (val[kvs[i]] !== old[kvs[i]]) dif[1].push(kvs[i]); // changed
	}
	for (var j=0; j<kos.length; ++j) {
		if (val[kos[j]] === undefined) dif[2].push(kos[j]); // removed
	}
	return dif
}

function updateKid(kid, k) {
	kid._set(getKey(this, k));
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

// @ts-check
var module$1 = function (initValue) {
	var root = new Trie();
	root.patch = patch;
	root._set(initValue);
	return new Ref(root, [])
};

function patch(acts, done) {
	var newV = this.data;
	for (var i=0; i<acts.length; ++i) {
		newV = setPath(newV, acts[i].k, acts[i].v, 0);
		if (newV instanceof Error) {
			done(newV);
			return
		}
	}
	if (newV !== this.data) {
		this._set(newV);
		done(null, acts);
	}
	else done(null, null);
}

/**
 * @param {*} obj
 * @param {!Array} keys
 * @param {*} val
 * @param {number} idx
 * @return {*}
 */
function setPath(obj, keys, val, idx) {
	if (val instanceof Error) return val

	// last key reached => close
	if (idx === keys.length) return isEqual(obj, val) ? obj : val

	// recursive calls to end of path
	if (!isObj(obj)) return Error('invalid path ' + keys.join('/'))
	var k = keys[idx],
			o = obj[k],
			v = setPath(o, keys, val, idx+1);
	return v === o ? obj
		: Array.isArray(obj) ? aSet(obj, +k, v)
			: oSet(obj, k, v)
}


/**
 * @param {!Array} arr
 * @param {number} key
 * @param {*} val
 * @return {!Array|Error}
 */
function aSet(arr, key, val) {
	var tgt = arr.slice();
	if (val === undefined) {
		if (key !== arr.length-1) return Error('only the last array item can be deleted')
		tgt.length = key;
		return tgt
	}
	if (key < arr.length) {
		tgt[key] = val;
		return tgt
	}
	return Error('invalid array index: ' + key)
}

/**
 * @param {!Object} obj
 * @param {string} key
 * @param {*} val
 * @return {!Object}
 */
function oSet(obj, key, val) {
	for (var i=0, ks=Object.keys(obj), res={}; i<ks.length; ++i) if (ks[i] !== key) res[ks[i]] = obj[ks[i]];
	if (val !== undefined) res[key] = val;
	return res
}

return module$1;

}());
