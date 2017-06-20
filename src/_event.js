import {reduceTree, reducePath} from './reduce'

export function Event() {
	this.dtree = Object.create(null)
	this.child = new WeakMap
	this.value = new WeakMap
}
Event.prototype = {

	setLeaf: function(keys) {
		for (var i=0, leaf=this.dtree; i<keys.length; ++i) {
			leaf = leaf[keys[i]] || (leaf[keys[i]] = Object.create(null))
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
		reducePath(keys, this.dtree, null, onTip, delLeaf, null, this)
	}
}

function onTip(res, tip) {
	return reduceTree(tip, null, null, delLeaf, this)
}

function delLeaf(res, kid, key, kin) {
	var eVals = res.value.get(kid),
			eKids = res.child.get(kid)
	if (!Object.keys(kid).length && !(eVals && eVals.length) && !(eKids && eKids.length)) delete kin[key]
	return res
}
