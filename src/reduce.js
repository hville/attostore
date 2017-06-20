import {isObj} from './type'

export function reducePath(keys, obj, onKid, onTip, onKin, res, ctx) { //cb(this:ctx, res, kid, key, kin)
	var kin = obj,
			kids = []
	for (var i=0; i<keys.length; ++i) {
		if (!isObj(kin)) return Error('invalid path')
		var key = keys[i]
		if (onKid) res = onKid.call(ctx, res, kin[key], key, kin)
		kin = kids[i] = kin[key]
	}
	if (onTip) res = onTip.call(ctx, res, kin)
	while(i--) {
		if (onKin) res = onKin.call(ctx, res, kids[i], keys[i], i ? kids[i-1] : obj)
	}
	return res
}

export function reduceTree(obj, onKid, onTip, onKin, res, ctx) { //cb(this:ctx, res, kid, key, kin)
	if (isObj(obj)) for (var i=0, ks=Object.keys(obj); i<ks.length; ++i) {
		var key = ks[i],
				kid = obj[key]
		if (onKid) res = onKid.call(ctx, res, kid, key, obj)
		res = reduceTree(kid, onKid, onTip, onKin, res, ctx)
		if (onKin) res = onKin.call(ctx, res, kid, key, obj)
	}
	return onTip ? onTip(res, obj) : res
}

