/* hugov@runbox.com | https://github.com/hville/atto-store.git | license:MIT */
'use strict';

function on(typ, fcn, ctx) {
	var evts = this._db.event,
			leaf = evts.setLeaf(this.keys),
			list = evts[typ].get(leaf),
			evtO = {f: fcn, c:ctx||null};
	if (!list) evts[typ].set(leaf, [evtO]);
	else if (indexOfEvt(list, fcn, ctx) === -1) list.push(evtO);
	return this
}

function	off(typ, fcn, ctx) {
	var evts = this._db.event,
			leaf = evts.getLeaf(this.keys),
			list = leaf && evts[typ].get(leaf);
	if (list) {
		var idx = indexOfEvt(list, fcn, ctx);
		if (idx !== -1) list.splice(idx, 1);
		if (!list.length) {
			evts[typ].delete(leaf);
			evts.delLeaf(this.keys);
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
		this._db.set(this.keys, val, ondone);
		return this
	},

	on: on,
	off: off,
	once: once
};

function reducePath(keys, obj, onKid, onTip, onKin, res, ctx) { //cb(this:ctx, res, kid, key, kin)
	var kin = obj,
			kids = [];
	for (var i=0; i<keys.length; ++i) {
		if (!isObj(kin)) return Error('invalid path')
		var key = keys[i];
		if (onKid) res = onKid.call(ctx, res, kin[key], key, kin);
		kin = kids[i] = kin[key];
	}
	if (onTip) res = onTip.call(ctx, res, kin);
	while(i--) {
		if (onKin) res = onKin.call(ctx, res, kids[i], keys[i], i ? kids[i-1] : obj);
	}
	return res
}

function reduceTree(obj, onKid, onTip, onKin, res, ctx) { //cb(this:ctx, res, kid, key, kin)
	if (isObj(obj)) for (var i=0, ks=Object.keys(obj); i<ks.length; ++i) {
		var key = ks[i],
				kid = obj[key];
		if (onKid) res = onKid.call(ctx, res, kid, key, obj);
		res = reduceTree(kid, onKid, onTip, onKin, res, ctx);
		if (onKin) res = onKin.call(ctx, res, kid, key, obj);
	}
	else if (onTip) res = onTip(res, obj);
	return res
}

function Event() {
	this.dtree = Object.create(null);
	this.child = new WeakMap;
	this.value = new WeakMap;
}
Event.prototype = {

	setLeaf: function(keys) {
		for (var i=0, leaf=this.dtree; i<keys.length; ++i) {
			leaf = leaf[keys[i]] || (leaf[keys[i]] = Object.create(null));
		}
		return leaf
	},

	getLeaf: function(keys) {
		for (var i=0, leaf=this.dtree; i<keys.length; ++i) {
			if (!(leaf = leaf[keys[i]])) return
		}
		return leaf
	},

	delLeaf: function(keys) {
		reducePath(keys, this.dtree, null, onTip, delLeaf, null, this);
	}
};

function onTip(res, tip) {
	return reduceTree(tip, null, null, delLeaf, this)
}

function delLeaf(res, kid, key, kin) {
	var eVals = res.value.get(kid),
			eKids = res.child.get(kid);
	if (!Object.keys(kid).length && !(eVals && eVals.length) && !(eKids && eKids.length)) delete kin[key];
	return res
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

//TODO g(a,b) vs o(a)?a[b]:void 0
function getKey(obj, key) {
	if (isObj(obj)) return obj[key]
}

function Store(initValue) {
	this.state = initValue || {};
	this.event = new Event;
}

Store.prototype.set = function(keys, val, ondone) {
	setTimeout(set, 0, this, keys, val, ondone);
	return this
};

function set(root, keys, value, ondone) {
	var last = root.state,
			evts = root.event;
	var data = setUp(evts.dtree, last, keys, value, 0, evts.child);
	if (data instanceof Error) {
		if (ondone) ondone(data.message);
	}
	else if (data !== last) {
		root.state = data;
		fireV(evts.dtree, data, last, evts.value); //TODO manualy fire path keys instead of all refs
		if (ondone) ondone(null, data);
	}
}

/**
 * @param {Object} ref
 * @param {*} obj
 * @param {!Array} keys
 * @param {*} val
 * @param {number} idx
 * @param {!WeakMap} evtC
 * @return {*}
 */
function setUp(ref, obj, keys, val, idx, evtC) {
	if (idx === keys.length) {
		if (isEqual(obj, val)) return obj
		if (ref) fireC(ref, val, obj, evtC);
		return val
	}
	if (!isObj(obj)) return Error('invalid path ' + keys.join('/'))
	var key = keys[idx],
			oldK = obj[key],
			newK = setUp(ref && ref[key], oldK, keys, val, idx+1, evtC);
	if (newK === oldK) return obj
	var res = Array.isArray(obj) ? aSet(obj, key, newK) : oSet(obj, key, newK); //TODO obj type annotation
	if (!(res instanceof Error)) fireList(evtC.get(ref), res, obj, key);
	return res
}

/**
 * @param {!Object} ref
 * @param {*} val
 * @param {*} old
 * @param {!WeakMap} evtC
 * @return {void}
 */
function fireC(ref, val, old, evtC) {
	if (val !== old) {
		// fire children first
		for (var i=0, ks=Object.keys(ref); i<ks.length; ++i) {
			var k = ks[i];
			fireC(ref[k], getKey(val, k), getKey(old, k), evtC); //TODO typeDef ref[k] is an Object
		}
		// fire parent after
		var evts = evtC.get(ref);
		if (evts) {
			if (isObj(val)) {
				if (isObj(old)) {
					fireKeys(val, '!=', evts, val, old);
					fireKeys(old, '!A', evts, val, old);
				}
				else fireKeys(val, '', evts, val, old);
			}
			else if (isObj(old)) fireKeys(old, '', evts, val, old);
		}
	}
}

/**
 * @param {!Object} ref
 * @param {*} val
 * @param {*} old
 * @param {!WeakMap} evtV
 * @return {void}
 */
function fireV(ref, val, old, evtV) {
	if (val !== old) {
		// fire parent first
		var evts = evtV.get(ref);
		if (evts) fireList(evts, val, old);
		// fire children after
		for (var i=0, ks=Object.keys(ref); i<ks.length; ++i) {
			var k = ks[i];
			fireV(ref[k], getKey(val, k), getKey(old, k), evtV);
		}
	}
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
 * @param {Array} list
 * @param {*} data
 * @param {*} last
 * @param {string|number} [key]
 * @return {void}
 */
function fireList(list, data, last, key) {
	if (list) for (var i=0; i<list.length; ++i) list[i].f.call(list[i].c, data, last, key);
}


function fireKeys(src, tst, evts, val, old) {
	for (var i=0, ks=Object.keys(src); i<ks.length; ++i) {
		var k = ks[i],
				cond = tst === '!=' ? val[k] !== old[k] : tst === '!A' ? val[k] === undefined : true;
		if(cond) fireList(evts, val, old, k);

	}
}

// @ts-check
function db(initValue) {
	return new Ref(new Store(initValue), [])
}

module.exports = db;
