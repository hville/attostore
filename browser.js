/* hugov@runbox.com | https://github.com/hville/attostore.git | license:MIT */
var attostore = (function () {
'use strict';

function on(typ, fcn, ctx) {
	var trie = this._db._emit.set(this.keys),
			list = trie[typ];
	if (list && trie.indexOf(typ, fcn, ctx) === -1) list.push({f: fcn, c:ctx||null});
	return this
}

function	off(typ, fcn, ctx) {
	var root = this._db._emit,
			trie = root.get(this.keys);
	if (trie) {
		var list = trie[typ],
				idx = trie.indexOf(typ, fcn, ctx);
		if (idx !== -1) {
			list.splice(idx, 1);
			if (!list.length) root.del(this.keys);
		}
	}
	return this
}

function once(etyp, fcn, ctx) {
	function wrapped(data, last, ks) {
		this.off(etyp, wrapped, this);
		fcn.call(ctx || this, data, last, ks);
	}
	return this.on(etyp, wrapped, this)
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

function isObj(v) {
	return typeof v === 'object'
}

function pathKeys(path) {
	return Array.isArray(path) ? path : (path && path.split) ? path.split('/') : cType(path) === Number ? [path] : []
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
	 * @param {Array|string} [path]
	 * @return {!Object}
	 */
	ref: function(path) {
		return new Ref(this._db, this.keys.concat(pathKeys(path)))
	},

	set: function(val, ondone) {
		return this._db.set(this.keys, val, ondone)
	},

	on: on,
	off: off,
	once: once
};

//TODO g(a,b) vs o(a)?a[b]:void 0
function getKey(obj, key) {
	if (isObj(obj)) return obj[key]
}

/**
 * @constructor
 */
function Emit() {
	this.dtree = Object.create(null);
	this.child = [];
	this.value = [];
}
Emit.prototype = {
	get: function(key) {
		return Array.isArray(key) ? key.reduce(get, this) : get(this, key)
	},
	set: function(key) {
		return Array.isArray(key) ? key.reduce(set, this) : set(this, key)
	},
	del: function(key) {
		del(this, Array.isArray(key) ? key : [key], 0);
	},
	indexOf: function(typ, fcn, ctx) {
		var list = this[typ];
		if (list) for (var i=0; i<list.length; ++i) if (list[i].f === fcn && list[i].c === ctx) return i
		return -1
	},
	fire: function(val, old) { //TODO take optional keys for direct path
		if (isObj(val) || isObj(old)) for (var i=0, ks=Object.keys(this.dtree); i<ks.length; ++i) {
			var k = ks[i],
					v = getKey(val, k),
					o = getKey(old, k);
			if (v !== o) {
				fire(this.child, val, old, k);
				this.get(k).fire(v,o);
			}
		}
		fire(this.value, val, old);
	}
};

function get(evt, key) {
	if (evt) return evt.dtree[key]
}

function set(evt, key) {
	return evt.dtree[key] || (evt.dtree[key] = new Emit)
}

function del(trie, keys, idx) {
	var key = keys[idx++],
			kid = trie.get(key),
			tip = (idx === keys.length) || del(kid, keys, idx);
	if (!tip || (Object.keys(kid.dtree).length + kid.child.length + kid.value.length)) return false
	return delete trie.dtree[key]
}

/**
 * @param {Array} list
 * @param {*} data
 * @param {*} last
 * @param {string|number} [key]
 * @return {void}
 */
function fire(list, data, last, key) {
	if (list) for (var i=0; i<list.length; ++i) list[i].f.call(list[i].c, data, last, key);
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
 * @param {Object} initValue
 */
function Store(initValue) {
	this.state = initValue || {};
	this._emit = new Emit;
}

Store.prototype.set = function(keys, val, ondone) {
	return this.patch([{k:keys, v:val}], ondone)
};

Store.prototype.patch = function(patch, ondone) {
	return promisify(setTimeout, [patchSync, 0, this, patch], ondone)
};
Store.prototype.patchSync = function(patch, ondone) {
	return promisify(patchSync, [this, patch], ondone)
};

function promisify(fcn, args, cb) {
	if (cb) {
		args.push(cb);
		fcn.apply(null, args);
	}
	else return new Promise(function(done, fail) {
		args.push(function(err, res) {
			if (err) fail(err);
			else done(res);
		});
		fcn.apply(null, args);
	})
}

function patchSync(root, acts, done) {
	var oldV = root.state,
			newV = oldV;
	for (var i=0; i<acts.length; ++i) {
		newV = setPath(newV, pathKeys(acts[i].k), acts[i].v, 0);
		if (newV instanceof Error) {
			return done(newV)
		}
	}
	if (newV !== oldV) {
		root.state = newV;
		root._emit.fire(newV, oldV);
		done(null, acts);
	}
	else done();
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

// @ts-check
function db(initValue) {
	return new Ref(new Store(initValue), [])
}

return db;

}());
