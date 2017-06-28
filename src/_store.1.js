import {Trie} from './_trie.1'
import {isEqual} from './is-eq'
import {isObj} from './type'
import {pathKeys} from './path-keys'
import {Ref} from './_ref'

/**
 * @constructor
 * @param {Object} initValue
 */
export function Store() {
	Trie.apply(this)
	this.data = null
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
				newV = oldV
		for (var i=0; i<acts.length; ++i) {
			newV = setPath(newV, pathKeys(acts[i].k), acts[i].v, 0)
			if (newV instanceof Error) {
				return done(newV)
			}
		}
		if (newV !== oldV) {
			this.data = newV
			Trie.prototype.emit.call(this, newV, oldV)
			done(null, acts)
		}
		else done()
	}
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
