import {Event} from './_event'
//import {reduceTree, reducePath} from './reduce'
import {isEqual} from './is-eq'
import {getKey} from './get'
import {isObj} from './type'

export function Store(initValue) {
	this.state = initValue || {}
	this.event = new Event
}

Store.prototype.set = function(keys, val, ondone) {
	setTimeout(set, 0, this, keys, val, ondone)
	return this
}

//TODO patch: set all, only fire if ALL good

function set(root, keys, value, ondone) {
	var last = root.state,
			evts = root.event
	var data = setUp(evts.dtree, last, keys, value, 0, evts.child) //TODO child event into instance
	if (data instanceof Error) {
		if (ondone) ondone(data.message)
	}
	else if (data !== last) {
		root.state = data
		fireV(evts.dtree, data, last, evts.value) //TODO manualy fire path keys instead of all refs
		if (ondone) ondone(null, data)
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
		if (ref) fireC(ref, val, obj, evtC)
		return val
	}
	if (!isObj(obj)) return Error('invalid path ' + keys.join('/'))
	var key = keys[idx],
			oldK = obj[key],
			newK = setUp(ref && ref[key], oldK, keys, val, idx+1, evtC)
	if (newK === oldK) return obj
	var res = Array.isArray(obj) ? aSet(obj, key, newK) : oSet(obj, key, newK) //TODO obj type annotation
	if (!(res instanceof Error)) fireList(evtC.get(ref), res, obj, key)
	return res
}

/**
 * @param {!Object} ref
 * @param {*} val
 * @param {*} old
 * @param {!WeakMap} evtC
 * @return {void}
 */
function fireC(ref, val, old, evtC) { //TODO move to Event
	if (val !== old) {
		// fire children first
		for (var i=0, ks=Object.keys(ref); i<ks.length; ++i) {
			var k = ks[i]
			fireC(ref[k], getKey(val, k), getKey(old, k), evtC) //TODO typeDef ref[k] is an Object
		}
		// fire parent after
		var evts = evtC.get(ref)
		if (evts) {
			if (isObj(val)) {
				if (isObj(old)) {
					fireKeys(val, '!=', evts, val, old)
					fireKeys(old, '!A', evts, val, old)
				}
				else fireKeys(val, '', evts, val, old)
			}
			else if (isObj(old)) fireKeys(old, '', evts, val, old)
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
		var evts = evtV.get(ref)
		if (evts) fireList(evts, val, old)
		// fire children after
		for (var i=0, ks=Object.keys(ref); i<ks.length; ++i) {
			var k = ks[i]
			fireV(ref[k], getKey(val, k), getKey(old, k), evtV)
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

/**
 * @param {Array} list
 * @param {*} data
 * @param {*} last
 * @param {string|number} [key]
 * @return {void}
 */
function fireList(list, data, last, key) {
	if (list) for (var i=0; i<list.length; ++i) list[i].f.call(list[i].c, data, last, key)
}


function fireKeys(src, tst, evts, val, old) {
	for (var i=0, ks=Object.keys(src); i<ks.length; ++i) {
		var k = ks[i],
				cond = tst === '!=' ? val[k] !== old[k] : tst === '!A' ? val[k] === undefined : true
		if(cond) fireList(evts, val, old, k)

	}
}
