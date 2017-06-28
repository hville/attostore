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

//TODO g(a,b) vs o(a)?a[b]:void 0
function getKey(obj, key) {
	if (isObj(obj)) return obj[key]
}

function pathKeys(path) {
	return Array.isArray(path) ? path : (path && path.split) ? path.split('/') : cType(path) === Number ? [path] : []
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
 */
function Trie() {
	this._ks = new Map;
	this._fs = [];
}

Trie.prototype = {
	on: function(key, fcn, ctx) {
		var leaf = set(this, pathKeys(key)),
				list = leaf._fs;
		if (indexOf(list, fcn, ctx) === -1) list.push({f: fcn, c:ctx||null});
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
	},
	once: function(key, fcn, ctx) {
		function wrapped(data, last, ks) {
			this.off(key, wrapped, this);
			fcn.call(ctx || this, data, last, ks);
		}
		return this.on(key, wrapped, this)
	},
	emit: function(val, old) {
		this._ks.forEach(function(kid, key) {
			if (key === '*') {
				var keys = filterKeys(val, old);
				console.log('KEYS', keys);
				for (var i=0; i<keys.length; ++i) emit(kid, getKey(val, keys[i]), keys[i], val, old);
			}
			else {
				var v = getKey(val, key),
						o = getKey(old, key);
				if (v !== o) {
					kid.emit(v, o);
					emit(kid, v, key, val, old);
				}
			}
		});
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

function emit(trie, v, k, n, o) {
	for (var i=0, fs=trie._fs; i<fs.length; ++i) fs[i].f.call(fs[i].c, v,k,n,o);
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
 */
function Emit() {
	this._evts = new Map;
}

Emit.prototype.on = function(typ, fcn, ctx) {
	var list = 	this._evts.get(typ);
	if (!list) this._evts.set(typ, list = [{f: fcn, c:ctx||null}]);
	else if (indexOf$1(list, fcn, ctx) === -1) list.push({f: fcn, c:ctx||null});
};

Emit.prototype.off = function(typ, fcn, ctx) {
	var arr = this._evts.get(typ),
			idx = indexOf$1(arr, fcn, ctx);
	if (idx !== -1) {
		arr.splice(idx, 1);
		if (!arr.length) this._evts.delete(typ);
	}
};

Emit.prototype.once = function(etyp, fcn, ctx) {
	function wrapped(data, last, ks) {
		this.off(etyp, wrapped, this);
		fcn.call(ctx || this, data, last, ks);
	}
	return this.on(etyp, wrapped, this)
};

/**
 * @param {string} typ
 * @param {*} [a0]
 * @param {*} [a1]
 * @param {*} [a2]
 * @return {void}
 */
Emit.prototype.fire = function(typ, a0, a1, a2) {
	var list = 	this._evts.get(typ);
	if (list) for (var i=0; i<list.length; ++i) list[i].f.call(list[i].c, a0, a1, a2);
};


function indexOf$1(arr, fcn, ctx) {
	if (arr) for (var i=0; i<arr.length; ++i) if (arr[i].f === fcn && arr[i].c === ctx) return i
	return -1
}

/**
 * @constructor
 * @param {!Object} root
 * @param {!Array} keys
 */
function Ref(root, keys) {
	this._db = root;
	this.keys = keys;
}

Ref.prototype = {
	get path() { return this.keys.join('/') },
	get parent() { return new Ref(this._db, this.keys.slice(0,-1)) },
	get root() { return new Ref(this._db, []) },

	/**
	 * @memberof Ref
	 * @param {Array|string} [path]
	 * @return {!Object}
	 */
	ref: function(path) {
		return new Ref(this._db, this.keys.concat(pathKeys(path)))
	},

	set: function(val, ondone) {
		return this._db.patch([{k:this.keys, v:val}], ondone)
	},

	del: function(ondone) {
		return this._db.patch([{k:this.keys}], ondone)
	},

	on: function(typ, fcn, ctx) {
		this._db._trie.set(this.keys).on(typ, fcn, ctx);
		return this
	},

	off: function(typ, fcn, ctx) {
		var root = this._db._trie,
				trie = root.get(this.keys);
		if (trie) {
			trie.off(typ, fcn, ctx);
			if (!trie._evts.size) root.del(this.keys);
		}
		return this
	},
	once: Emit.prototype.once
};

/**
 * @constructor
 * @param {Object} initValue
 */
function Store() {
	Trie.apply(this);
	this.data = null;
}

Store.prototype = {
	on: Trie.prototype.on,
	off: Trie.prototype.off,
	once: Trie.prototype.once,
	/**
	 * @memberof Store
	 * @param {Array|string} path
	 * @return {!Object}
	 */
	ref: function(path) {
		return new Ref(this, pathKeys(path))
	},

	patch: function(acts, done) {
		var oldV = this.data,
				newV = oldV;
		for (var i=0; i<acts.length; ++i) {
			newV = setPath(newV, pathKeys(acts[i].k), acts[i].v, 0);
			if (newV instanceof Error) {
				return done(newV)
			}
		}
		if (newV !== oldV) {
			this.data = newV;
			Trie.prototype.emit.call(this, newV, oldV);
			done(null, acts);
		}
		else done();
	}
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
