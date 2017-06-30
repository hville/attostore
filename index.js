/* hugov@runbox.com | https://github.com/hville/attostore.git | license:MIT */
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

function pathKeys(path) {
	return Array.isArray(path) ? path : (path && path.split) ? path.split('/') : cType(path) === Number ? [path] : []
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

function once(key, fcn, ctx) {
	function wrapped(a,b,c,d) {
		this.off(key, wrapped, this);
		fcn.call(ctx || this, a,b,c,d);
	}
	return this.on(key, wrapped, this)
}

function getKey(obj, key) {
	if (isObj(obj)) return obj[key]
}

/**
 * @constructor
 */
function Trie() {
	this._ks = new Map;
	this._fs = [];
	this.data = undefined;
}

Trie.prototype.on = function(key, fcn, ctx) {
	var leaf = set(this, pathKeys(key)),
			list = leaf._fs;
	if (indexOf(list, fcn, ctx) === -1) list.push({f: fcn, c:ctx||null});
	return this
};

Trie.prototype.off = function(key, fcn, ctx) {
	var keys = pathKeys(key),
			itm = get(this, keys),
			arr = itm && itm._fs,
			idx = indexOf(arr, fcn, ctx);
	if (idx !== -1) {
		arr.splice(idx, 1);
		if (!arr.length && !itm._ks.size) del(this, keys, 0);
	}
	return this
};

Trie.prototype.once = once;

/**
 * @param {*} val
 * @param {*} old
 * @param {string} [key]
 * @param {Object|Array} [obj]
 * @return {void}
 */
Trie.prototype.emit = function(val, old, key, obj) {
	this._ks.forEach(function(kid, k) {
		if (k === '*') {
			var keys = filterKeys(val, old);
			for (var i=0; i<keys.length; ++i) kid.emit(getKey(val, keys[i]), getKey(old, keys[i]), keys[i], val);
		}
		else {
			var v = getKey(val, k),
					o = getKey(old, k);
			if (v !== o) kid.emit(v,o,k,val);
		}
	});
	for (var i=0, fs=this._fs; i<fs.length; ++i) fs[i].f.call(fs[i].c, val, old, key, obj);
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

function filterKeys(val, old) {
	var res = [],
			kvs = isObj(val) ? Object.keys(val) : [],
			kos = isObj(old) ? Object.keys(old) : [];
	if (!kvs.length) return kos
	if (!kos.length) return kvs

	for (var i=0; i<kvs.length; ++i) if (val[kvs[i]] !== old[kvs[i]]) res.push(kvs[i]);
	for (var j=0; j<kos.length; ++j) if (val[kos[j]] === undefined) res.push(kos[j]);
	return res
}

/**
 * @constructor
 * @param {!Object} root
 * @param {!Array} keys
 */
function Ref(root, keys) {
	this._db = root;
	this._ks = keys;
}

Ref.prototype = {
	constructor: Ref,

	get parent() { return new Ref(this._db, this._ks.slice(0,-1)) },
	get root() { return new Ref(this._db, []) },

	keys: function(path) {
		return this._ks.concat(pathKeys(path))
	},
	/**
	 * @memberof Ref
	 * @param {Array|string} [path]
	 * @return {!Object}
	 */
	ref: function(path) {
		return new Ref(this._db, this.keys(path))
	},

	set: function(path, val, ondone) {
		return promisify(setTimeout, [storeSet, 0, this._db, this.keys(path), val], ondone)
	},

	del: function(path, ondone) {
		return promisify(setTimeout, [storeSet, 0, this._db, this.keys(path)], ondone)
	},

	on: function(path, fcn, ctx) {
		this._db.trie.on(this.keys(path), fcn, ctx);
		return this
	},

	off: function(path, fcn, ctx) {
		this._db.trie.off(this.keys(path), fcn, ctx);
		return this
	},

	once: once,

	query: function(transform) {
		var query = new Trie,
				last;
		this._db.trie.on(this._ks, function(v,k,n) {
			var next = transform(v,k,n);
			query.emit(next, last);
		});
		return query
	}
};

function storeSet(src, key, val, cb) {
	return src.patch([val === undefined ? {k:key} : {k:key, v:val}], cb)
}

/**
 * @constructor
 * @param {*} [data]
 */
function Store(data) {
	this.trie = new Trie;
	this.data = data;
}

/**
 * @memberof Store
 * @param {Array|string|number} [path]
 * @return {!Object}
 */
Store.prototype.ref = function(path) {
	return new Ref(this, pathKeys(path))
};

Store.prototype.patch = function(acts, done) {
	var oldV = this.data,
			newV = oldV;
	for (var i=0; i<acts.length; ++i) {
		newV = setPath(newV, acts[i].k, acts[i].v, 0);
		if (newV instanceof Error) {
			done(newV);
			return
		}
	}
	if (newV !== oldV) {
		this.data = newV;
		this.trie.emit(newV, oldV);
		done(null, acts);
	}
	else done(null, null);
};

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

// @ts-check
var module$1 = function () {
	return new Store()
};

module.exports = module$1;
