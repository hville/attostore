import {pathKeys} from './path-keys'
import {promisify} from './promisify'
import {once} from './once'
import {Trie} from './_trie'

/**
 * @constructor
 * @param {!Object} root
 * @param {!Array} keys
 */
export function Ref(root, keys) {
	this.store = root
	this._ks = keys
}

Ref.prototype = {

	get parent() { return new Ref(this.store, this._ks.slice(0,-1)) },
	get root() { return new Ref(this.store, []) },

	keys: function(path) {
		return this._ks.concat(pathKeys(path))
	},

	/**
	 * @memberof Ref
	 * @param {Array|string} [path]
	 * @return {!Object}
	 */
	ref: function(path) {
		return new Ref(this.store, this.keys(path))
	},

	on: function(path, fcn, ctx) {
		this.store.on(this.keys(path), fcn, ctx)
		return this
	},

	off: function(path, fcn, ctx) {
		this.store.off(this.keys(path), fcn, ctx)
		return this
	},

	once: once,

	set: function(path, val, ondone) {
		return promisify(setTimeout, [storeSet, 0, this.store, this.keys(path), val], ondone)
	},

	del: function(path, ondone) {
		return promisify(setTimeout, [storeSet, 0, this.store, this.keys(path), undefined], ondone)
	},

	query: function(transform) {
		var query = new Trie
		query._set(transform(this.store.data))
		this.store.on(this._ks, function(v) { query._set(transform(v)) })
		return query
	}
}

function storeSet(src, key, val, cb) {
	return src.patch([val === undefined ? {k:key} : {k:key, v:val}], cb)
}
