/* hugov@runbox.com | https://github.com/hville/atto-store.git | license:MIT */
'use strict';

function _fire(last) {
	var subs = this._subs;
	for (var i=0; i<subs.length; ++i) subs[i].f.call(subs[i].c, this.data, last);
}

function _indexOfHandler(handler, context) {
	for (var i=0, subs=this._subs; i<subs.length; ++i) {
		if (subs[i].f === handler && subs[i].c === (context || this)) return i
	}
	return -1
}

function on(handler, context) {
	if (this._indexOfHandler(handler, context) === -1) this._subs.push({f: handler, c: context || this});
	return this
}

function off(handler, context) {
	var i = this._indexOfHandler(handler, context);
	if (i !== -1) this._subs.splice(i, 1);
	return this
}

function once(handler, context) {
	function wrapped(data, last) {
		this.off(wrapped, this);
		handler.call(context || this, data, last);
	}
	return this.on(wrapped, this)
}

/**
 * @function
 * @param {*} v - object to test
 * @return {Object} object Constructor type
 */
function cType(v) {
	//null, String, Boolean, Number, Object, Array
	return v == null ? v : v.constructor || Object
}

/**
 * @function
 * @param {!Object} obj - object or array to be cloned
 * @returns {!Object} clone
 */
function clone(obj) {
	for (var i=0, ks=Object.keys(obj), res={}; i<ks.length; ++i) res[ks[i]] = obj[ks[i]];
	return res
}

/**
 * @function
 * @param {!Object} obj
 * @param {string|number} key
 * @returns {!Object} clone
 */
function delKey(obj, key) { //TODO number vs string keys
	var ctyp = cType(obj);
	if (ctyp === Array && key === obj.length - 1) return obj.slice(0,-1) //TODO errors
	if (ctyp === Object) {
		for (var i=0, ks=Object.keys(obj), res={}; i<ks.length; ++i) if (ks[i] !== key) res[ks[i]] = obj[ks[i]];
		return res
	}
	return obj
}

/**
 * @function
 * @param {!Object} obj
 * @param {string|number} key
 * @param {*} val
 * @returns {!Object} clone
 */
function setKey(obj, key, val) { //TODO number vs string keys
	var ctyp = cType(obj),
			res = obj;

	if (ctyp === Object) {
		if (val == null) return delKey(obj, key)
		res = clone(obj);
		res[key] = val;
	}
	else if (ctyp === Array && key <= obj.length) { //TODO errors
		res = obj.slice();
		res[key] = val;
	}
	return res
}

/**
 * deep Equal check on JSON-like objects
 * @function
 * @param {!Object|!Array} obj - object to check
 * @param {!Object|!Array} ref - the reference
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
		var ko = Object.keys(obj); //TODO type annotation obj === object
		if (ko.length !== Object.keys(ref).length) return false //TODO type annotation ref === object
		for (i=0; i<ko.length; ++i) if (!isEqual(obj[ko[i]], ref[ko[i]])) return false
		return true
	}
	else return obj === ref
}

function set(data) {
	var val = data == null ? null : data;
	if (!isEqual(this.data, val)) {
		this._set(val); // update data and refs trees down to the root
		this._setKids(val); // update kids
	}
	return this
}

function _set(data) { //self down to root
	var last = this.data;
	this.data = data;
	var kin = this.kin;
	if (kin) kin._set(setKey(kin.data, this.key, data));
	this._fire(last);
}

function _setKids(data) {
	var kids = this._kids;
	for (var i=0, ks=Object.keys(kids); i<ks.length; ++i) {
		var key = ks[i],
				kid = kids[key],
				val = (data && data[key]) == null ? null : data[key];
		if (kid.data !== val) {
			kid.data = val;
			kid._fire();
			kid._setKids(val);
		}
	}
}

/**
 * @constructor
 * @param {Object} kin
 * @param {string|number} key
 * @param {*} val
 */
function Ref(kin, key, val) {
	this.kin = kin; //root: null
	this.key = key; //root: null
	this._kids = {};
	this._subs = [];
	this.data = val == null ? null : val;
}

Ref.prototype = {

	get root() {
		var ref = this;
		while (ref.kin) ref = ref.kin;
		return ref
	},

	ref: function(path) {
		var keys = Array.isArray(path) ? path : path.split('/'),
				kids = this._kids,
				kid = this,
				val = this.data;
		for (var i=0; i<keys.length; ++i) {
			var key = keys[i];
			val = val && val[key];
			kid = kids[key] || (kids[key] = new Ref(this, key, val));
		}
		return kid
	},

	// event handlers
	on: on,
	off: off,
	once: once,
	_fire: _fire,
	_indexOfHandler: _indexOfHandler,

	// updates
	set: set,
	_set: _set,
	_setKids: _setKids
};

// @ts-check
function db(value) {
	return new Ref(null, null, value)
}

module.exports = db;
