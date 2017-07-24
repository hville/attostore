/* hugov@runbox.com | https://github.com/hville/attostore.git | license:MIT */
(function (exports) {
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

function missingKeys(reference, value) {
	var keys = isObj(reference) ? Object.keys(reference) : [];
	return isObj(value) ? keys.filter(filterVoid, value) : keys
}

function changedKeys(reference, value) {
	var keys = isObj(reference) ? Object.keys(reference) : [],
			diff = [];
	if (isObj(value)) for (var i=0; i<keys.length; ++i) {
		var key = keys[i],
				val = value[key];
		if (val !== reference[key] && val !== undefined) diff.push(key);
	}
	return diff
}

function filterVoid(k) {
	return this[k] === undefined
}

function getKey(obj, key) {
	if (isObj(obj)) return obj[key]
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
	var ct = cType(path);
	return ct === Array ? path : ct === Number ? [path] : !path ? [] : path.split('/')
}

/**
 * @constructor
 * @param {*} initValue
 */
function Store(initValue) {
	this._ks = new Map;
	this._fs = [];
	this.data = initValue;
}


/**
 * @param {Array|string|number} key
 * @param {Function} fcn
 * @param {*} [ctx]
 * @return {!Object}
 */
Store.prototype.on = function(key, fcn, ctx) {
	var leaf = setLeaf(this, pathKeys(key)),
			list = leaf._fs;
	if (indexOf(list, fcn, ctx) === -1) list.push({f: fcn, c:ctx});
	return this
};


/**
 * @param {Array|string|number} key
 * @param {Function} fcn
 * @param {*} [ctx]
 * @return {!Object}
 */
Store.prototype.off = function(key, fcn, ctx) {
	var keys = pathKeys(key),
			itm = getLeaf(this, keys),
			arr = itm && itm._fs,
			idx = indexOf(arr, fcn, ctx);
	if (idx !== -1) {
		arr.splice(idx, 1);
		if (!arr.length && !itm._ks.size) delLeaf(this, keys, 0);
	}
	return this
};


/**
 * @param {Array|string|number} key
 * @param {Function} fcn
 * @param {*} [ctx]
 * @return {!Object}
 */
Store.prototype.once = function(key, fcn, ctx) {
	var store = this;
	function wrap(v,k,o) {
		store.off(key, wrap, ctx);
		fcn.call(this, v,k,o);
	}
	return this.on(key, wrap, ctx)
};


Store.prototype.get = function(path) {
	var keys = pathKeys(path);
	for (var i=0, itm = this.data; i<keys.length; ++i) {
		if (isObj(itm)) itm = itm[keys[i]];
		else return
	}
	return itm
};

/**
 * @param {Array|string} path
 * @param {*} data
 * @return {Error|void}
 */
Store.prototype.set = function(path, data) {
	var res = setKeys(this.data, pathKeys(path), data, 0);
	if (res instanceof Error) return res
	update(this, res, null);
};


/**
 * @param {Array} ops
 * @return {Error|void}
 */
Store.prototype.act = function(ops) {
	var res = this.data;
	for (var i=0; i<ops.length; ++i) {
		res = setKeys(res, pathKeys(ops[i].path), ops[i].data, 0);
		if (res instanceof Error) return res
	}
	update(this, res, null);
};


/**
 * @param {Store} root
 * @param {Array<string>} keys
 * @return {Store}
 */
function getLeaf(root, keys) {
	for (var i=0, itm = root; i<keys.length; ++i) {
		if (itm !== undefined) itm = itm._ks.get(''+keys[i]);
	}
	return itm
}


/**
 * @param {Store} root
 * @param {Array<string>} keys
 * @return {Store}
 */
function setLeaf(root, keys) {
	for (var i=0, itm = root; i<keys.length; ++i) {
		var key = ''+keys[i];
		if (!itm._ks.has(key)) itm._ks.set(key, new Store(getKey(itm.data, key)));
		itm = itm._ks.get(key);
	}
	return itm
}


/**
 * @param {Store} trie
 * @param {Array<string>} keys
 * @param {number} idx
 * @return {void}
 */
function delLeaf(trie, keys, idx) {
	var key = keys[idx++],
			kid = trie._ks.get(key);
	if (kid instanceof Store) {
		if (idx !== keys.length) delLeaf(kid, keys, idx);
		if (!kid._ks.size && !kid._fs.length) trie._ks.delete(key);
	}
}


/**
 * @param {Array} arr
 * @param {Function} fcn
 * @param {*} ctx
 * @return {number}
 */
function indexOf(arr, fcn, ctx) {
	if (arr) for (var i=0; i<arr.length; ++i) if (arr[i].f === fcn && arr[i].c === ctx) return i
	return -1
}


/**
 * @param {!Object} trie
 * @param {*} val
 * @param {string} key
 * @return {void|Error}
 */
function update(trie, val, key) {
	if (val !== trie.data) {
		var old = trie.data;
		trie.data = val;
		// fire kids first...
		trie._ks.forEach(updateKid, val);
		// ...then self
		for (var i=0, fs=trie._fs; i<fs.length; ++i) {
			fs[i].f.call(fs[i].c, val, key, old);
		}
	}
}
function updateKid(kid, k) {
	update(kid, getKey(this, k), k);
}


/**
 * @param {*} obj
 * @param {!Array} keys
 * @param {*} val
 * @param {number} idx
 * @return {*}
 */
function setKeys(obj, keys, val, idx) {
	// last key reached => close
	if (idx === keys.length) return isEqual(obj, val) ? obj : val

	// recursive calls to end of path
	if (!isObj(obj)) return Error('invalid path: ' + keys.join('/'))
	var k = keys[idx],
			o = obj[k],
			v = setKeys(o, keys, val, idx+1);
	return v instanceof Error ? v : v === o ? obj : Array.isArray(obj) ? aSet(obj, +k, v) : oSet(obj, k, v)
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
	if (key <= arr.length) {
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

exports.changedKeys = changedKeys;
exports.missingKeys = missingKeys;
exports.Store = Store;

}((this.attostore = this.attostore || {})));
