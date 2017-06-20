import {Event} from './_event'
import {reduceTree, reducePath} from './reduce'
import {isEqual} from './is-eq'
import {getKey} from './get'
import {isObj} from './type'

export function Store(initValue) {
	this.state = initValue || {}
	this.event = new Event
}

Store.prototype.set = function(keys, val, ondone) {
	var old = this.state
	var res = reducePath(keys, old, null, setTip, setKin, val, this)
	if (res instanceof Error) {
		if (ondone) ondone(res.message || true)
	}
	else if (res !== old) {
		this.state = res
		fireV(evts.dtree, res, old, evts.value) //TODO manualy fire path keys instead of all refs
		if (ondone) ondone(null, res)
	}
}
function setTip(val, kid, key, kin) {
	if (isEqual(val, kid)) return kid
}
function setKin(res, val, key, obj) {
	if (res instanceof Error) return res
}

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
