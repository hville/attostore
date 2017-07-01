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
	this._db = root
	this._ks = keys
	this.set = root.patch ? setRef : null
	this.del = root.patch ? delRef : null
}

Ref.prototype = {
	constructor: Ref,

	get parent() { return new Ref(this._db, this._ks.slice(0,-1)) },
	get root() { return new Ref(this._db, []) },

	keys: function(path) {
		return this._ks.concat(pathKeys(path))
	},
	/**
	 * @memberof Ref
	 * @param {Array|string} [path]
	 * @return {!Object}
	 */
	ref: function(path) {
		return new Ref(this._db, this.keys(path))
	},

	on: function(path, fcn, ctx) {
		this._db.on(this.keys(path), fcn, ctx)
		return this
	},

	off: function(path, fcn, ctx) {
		this._db.off(this.keys(path), fcn, ctx)
		return this
	},

	once: once,

	query: function(transform) {
		var query = new Trie
		this._db.on(this._ks, function(v,k,n) {
			query.update(transform(v,k,n))
		})
		return query
	}
}

function storeSet(src, key, val, cb) {
	return src.patch([val === undefined ? {k:key} : {k:key, v:val}], cb)
}

function setRef(path, val, ondone) {
	return promisify(setTimeout, [storeSet, 0, this._db, this.keys(path), val], ondone)
}

function delRef(path, ondone) {
	return promisify(setTimeout, [storeSet, 0, this._db, this.keys(path)], ondone)
}
