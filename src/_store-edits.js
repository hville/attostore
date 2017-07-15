import {isObj} from './type'
import {isEqual} from './is-eq'
import {getKey} from './get-key'
import {pathKeys} from './path-keys'

/**
 * @param {null|string|Array} path
 * @param {any} data
 * @return {Error|void}
 */
export function set(path, data) {
	return update(this, setKeys(this.data, pathKeys(path), data, 0), null)
}

/**
 * @param {null|string|Array} [path]
 * @return {Error|void}
 */
export function del(path) {
	return update(this, setKeys(this.data, pathKeys(path), undefined, 0), null)
}

/**
 * @typedef {Object} Operation
 * @prop {string|Array} [path]
 * @prop {*} [data]
 */

/**
 * @param {null|string|Array} path
 * @param {*} [data]
 * @return {Operation}
 */
export function createOperation(path, data) {
	return data === undefined ? {path: path == null ? null : path} : {path: path == null ? null : path, data: data}
}

/**
 * @param {string} name
 * @param {*} [data]
 * @return {Error|void}
 */
export function act(name, data) {
	var ops = this._cs[name] && this._cs[name](data)
	if (!ops) return Error('invalid command ' + name)
	return this.run(ops)
}

/**
 * @param {Operation|Operation[]} ops
 * @return {Error|void}
 */
export function run(ops) {
	var data = Array.isArray(ops) ? ops.reduce(setRed, this.data) : setRed(this.data, ops)
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
		var old = store.data
		store.data = val
		// fire kids first...
		store._ks.forEach(updateKid, val)
		// ...then self
		for (var i=0, fs=store._fs; i<fs.length; ++i) {
			fs[i].f.call(fs[i].c === undefined ? store : fs[i].c, val, key, old)
		}
	}
}

function updateKid(kid, k) {
	update(kid, getKey(this, k), k)
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
	if (!isObj(obj)) return Error('invalid path: ' + keys.join('.'))
	var k = keys[idx],
			o = obj[k],
			v = setKeys(o, keys, val, idx+1)
	return v instanceof Error ? v : v === o ? obj : Array.isArray(obj) ? aSet(obj, +k, v) : oSet(obj, k, v)
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
	if (key <= arr.length) {
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
