import {Ref} from './_ref'
import {getKeys} from './get-keys'
import {Events} from './_events'
import {isEqual} from './is-eq'

/**
 * @constructor
 * @param {*} initValue
 */
export function Store(initValue) {
	//props: data, last, root, keys, path
	this.events = new Events
	this.data = initValue == null ? null : initValue
	this.last = null
	this.error = ''
}

Store.prototype = {
	constructor: Store,

	/**
	 * @param {!Array|string} path
	 * @param {*} value
	 * @return {!Object}
	 */
	set: function(path, value) {
		var keys = getKeys(path),
				data = this.data,
				newD = keys.length ? this._setUp(data, keys, value, 0) : isEqual(data, value) ? data
			: value
		if (newD !== this.data && newD !== undefined) {
			this.error = ''
			this.last = data
			this.data = newD
			this.events.fire(newD, this.last, keys)
		}
		return this
	},

	/**
	 * @param {Array|string} [path]
	 * @return {!Object}
	 */
	ref: function(path) {
		return new Ref(this, getKeys(path))
	},

	/**
	 * @param {!Array} arr
	 * @param {number} key
	 * @param {*} val
	 * @return {!Array}
	 */
	_aSet: function(arr, key, val) {
		var tgt = arr.slice()
		if (val === undefined) {
			if (key !== arr.length-1) {
				this.error = 'only the last array item can be deleted'
				return arr
			}
			tgt.length = key
			return tgt
		}
		if (key <= arr.length) {
			tgt[key] = val
			return tgt
		}
		this.error = 'invalid array index: ' + key
		return arr
	},

	/**
	 * @param {!Object} obj
	 * @param {string} key
	 * @param {*} val
	 * @return {!Object}
	 */
	_oSet: function(obj, key, val) {
		for (var i=0, ks=Object.keys(obj), res={}; i<ks.length; ++i) if (ks[i] !== key) res[ks[i]] = obj[ks[i]]
		if (val !== undefined) res[key] = val
		return res
	},

	/**
	 * @param {*} leaf
	 * @param {!Array} keys
	 * @param {*} data
	 * @param {number} step
	 * @return {*}
	 */
	_setUp: function(leaf, keys, data, step) {
		if (typeof leaf !== 'object') {
			this.error = 'invalid path ' + keys.join('/') + ' at ' + step
			return leaf
		}

		var key = keys[step],
				val = data

		if (step === keys.length - 1) {
			if (isEqual(leaf[key], data)) return leaf
		}
		else {
			val = this._setUp(leaf[key], keys, data, step + 1)
			if (leaf[key] === val) return leaf
		}

		return Array.isArray(leaf) ? this._aSet(leaf, key, val) : this._oSet(leaf, key, val)
	}
}
