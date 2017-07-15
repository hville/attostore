/* hugov@runbox.com | https://github.com/hville/attostore.git | license:MIT */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

function pathKeys(path) {
	var ct = cType(path);
	return ct === Array ? path : ct === Number ? [path] : !path ? [] : path.split('/')
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

function getKey(obj, key) {
	if (isObj(obj)) return obj[key]
}

/**
 * @param {null|string|Array} path
 * @param {any} data
 * @return {Error|void}
 */
function set(path, data) {
	return update(this, setKeys(this.data, pathKeys(path), data, 0), null)
}

/**
 * @param {null|string|Array} [path]
 * @return {Error|void}
 */
function del(path) {
	return update(this, setKeys(this.data, pathKeys(path), undefined, 0), null)
}

/**
 * @typedef {Object} Operation
 * @prop {string|Array} [path]
 * @prop {*} [data]
 */

/**
 * @param {Operation} op
 * @return {Error|void}
 */
function act(op) {
	return update(this, setRed(this.data, op), null)
}

/**
 * @param {Operation[]} ops
 * @return {Error|void}
 */
function run(ops) {
	var data = ops.reduce(setRed, this.data);
	return data instanceof Error ? data : update(this, data, null)
}

/**
 * @param {any} res
 * @param {Operation} op
 * @returns {any}
 */
function setRed(res, op) {
	return res instanceof Error ? res : setKeys(res, pathKeys(op.path), op.data, 0)
}


/**
 * @param {!Object} store
 * @param {*} val
 * @param {string} key
 * @return {void|Error}
 */
function update(store, val, key) {
	if (val instanceof Error) return val

	if (val !== store.data) {
		var old = store.data;
		store.data = val;
		// fire kids first...
		store._ks.forEach(updateKid, val);
		// ...then self
		for (var i=0, fs=store._fs; i<fs.length; ++i) {
			fs[i].f.call(fs[i].c === undefined ? store : fs[i].c, val, key, old);
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
	if (val instanceof Error) return val

	// last key reached => close
	if (idx === keys.length) return isEqual(obj, val) ? obj : val

	// recursive calls to end of path
	if (!isObj(obj)) return Error('invalid path: ' + keys.join('.'))
	var k = keys[idx],
			o = obj[k],
			v = setKeys(o, keys, val, idx+1);
	return v === o ? obj : Array.isArray(obj) ? aSet(obj, +k, v) : oSet(obj, k, v)
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

/**
 * @constructor
 * @param {*} [data]
 */
function Trie(data) {
	this._ks = new Map;
	this._fs = [];
	this.data = data;
}

/**
 * @param {Array|string|number} key
 * @param {Function} fcn
 * @param {*} [ctx]
 * @return {!Object}
 */
function on(key, fcn, ctx) {
	var leaf = setLeaf(this, pathKeys(key)),
			list = leaf._fs;
	if (indexOf(list, fcn, ctx) === -1) list.push({f: fcn, c:ctx});
	return this
}

/**
 * @param {Array|string|number} key
 * @param {Function} fcn
 * @param {*} [ctx]
 * @return {!Object}
 */
function off(key, fcn, ctx) {
	var keys = pathKeys(key),
			itm = getLeaf(this, keys),
			arr = itm && itm._fs,
			idx = indexOf(arr, fcn, ctx);
	if (idx !== -1) {
		arr.splice(idx, 1);
		if (!arr.length && !itm._ks.size) delLeaf(this, keys, 0);
	}
	return this
}

/**
 * @param {Array|string|number} key
 * @param {Function} fcn
 * @param {*} [ctx]
 * @return {!Object}
 */
function once(key, fcn, ctx) {
	var store = this;
	function wrap(v,k,o) {
		store.off(key, wrap, ctx);
		fcn.call(this, v,k,o);
	}
	return this.on(key, wrap, ctx)
}

/**
 * @param {Trie} root
 * @param {string[]} keys
 * @return {Trie}
 */
function getLeaf(root, keys) {
	for (var i=0, itm = root; i<keys.length; ++i) {
		if (itm !== undefined) itm = itm._ks.get(''+keys[i]);
	}
	return itm
}

/**
 * @param {Trie} root
 * @param {string[]} keys
 * @return {Trie}
 */
function setLeaf(root, keys) {
	for (var i=0, itm = root; i<keys.length; ++i) {
		var key = ''+keys[i];
		if (!itm._ks.has(key)) itm._ks.set(key, new Trie(getKey(itm.data, key)));
		itm = itm._ks.get(key);
	}
	return itm
}

/**
 * @param {Trie} trie
 * @param {string[]} keys
 * @param {number} idx
 * @return {void}
 */
function delLeaf(trie, keys, idx) {
	var key = keys[idx++],
			kid = trie._ks.get(key);
	if (kid instanceof Trie) {
		if (idx !== keys.length) delLeaf(kid, keys, idx);
		if (!kid._ks.size && !kid._fs.length) trie._ks.delete(key);
	}
}

/**
 * @param {Array} arr
 * @param {Function} fcn
 * @param {any} ctx
 * @return {number}
 */
function indexOf(arr, fcn, ctx) {
	if (arr) for (var i=0; i<arr.length; ++i) if (arr[i].f === fcn && arr[i].c === ctx) return i
	return -1
}

/**
 * @constructor
 * @param {*} [data]
 */
function Store(data) {
	this._ks = new Map;
	this._fs = [];
	this.data = data;
}

Store.prototype.on = on;
Store.prototype.off = off;
Store.prototype.once = once;

Store.prototype.set = set;
Store.prototype.delete = del;
Store.prototype.act = act;
Store.prototype.run = run;


Store.prototype.get = function(path) {
	var keys = pathKeys(path);
	for (var i=0, itm = this.data; i<keys.length; ++i) {
		if (isObj(itm)) itm = itm[keys[i]];
		else return
	}
	return itm
};

// @ts-check
// @ts-check
function createStore(initialValue) {
	return new Store(initialValue)
}

exports.createStore = createStore;
exports.changedKeys = changedKeys;
exports.missingKeys = missingKeys;
