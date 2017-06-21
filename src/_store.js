import {Emit} from './_emit'
import {isEqual} from './is-eq'
import {isObj} from './type'
import {pathKeys} from './path-keys'
import {Ref} from './_ref'

/**
 * @constructor
 * @param {Object} initValue
 */
export function Store(initValue) {
	this.state = initValue || {}
	this._emit = new Emit
}

Store.prototype = {
	/**
	 * @memberof Store
	 * @param {Array|string} path
	 * @return {!Object}
	 */
	ref: function(path) {
		return new Ref(this, pathKeys(path))
	},

	patch: function(patch, ondone) {
		return promisify(setTimeout, [patchSync, 0, this, patch], ondone)
	},

	patchSync: function(patch, ondone) {
		return promisify(patchSync, [this, patch], ondone)
	}
}

function promisify(fcn, args, cb) {
	if (cb) {
		args.push(cb)
		fcn.apply(null, args)
	}
	else return new Promise(function(done, fail) {
		args.push(function(err, res) {
			if (err) fail(err)
			else done(res)
		})
		fcn.apply(null, args)
	})
}

function patchSync(root, acts, done) {
	var oldV = root.state,
			newV = oldV
	for (var i=0; i<acts.length; ++i) {
		newV = setPath(newV, pathKeys(acts[i].k), acts[i].v, 0)
		if (newV instanceof Error) {
			return done(newV)
		}
	}
	if (newV !== oldV) {
		root.state = newV
		root._emit.fire(newV, oldV)
		done(null, acts)
	}
	else done()
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
			v = setPath(o, keys, val, idx+1)
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
	var tgt = arr.slice()
	if (val === undefined) {
		if (key !== arr.length-1) return Error('only the last array item can be deleted')
		tgt.length = key
		return tgt
	}
	if (key < arr.length) {
		tgt[key] = val
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
	for (var i=0, ks=Object.keys(obj), res={}; i<ks.length; ++i) if (ks[i] !== key) res[ks[i]] = obj[ks[i]]
	if (val !== undefined) res[key] = val
	return res
}
