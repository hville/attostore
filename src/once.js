export function once(fcn, ctx) {
	var wrap = fcn.length > 2
		? function(a,b,c,d,e) { this.off(wrap, this); fcn.call(ctx, a,b,c,d,e) }
		: function(a,b) { this.off(wrap, this); fcn.call(ctx, a,b) }
	return this.on(wrap, this)
}

/*
TODO
var w = Function.apply(null, ['a', 'b', 'c', 'return jjj'])
*/
