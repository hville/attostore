export function once(key, fcn, ctx) {
	var wrap = fcn.length > 2
		? function(a,b,c,d,e) { this.off(key, wrap, this); fcn.call(ctx, a,b,c,d,e) }
		: function(a,b) { this.off(key, wrap, this); fcn.call(ctx, a,b) }
	return this.on(key, wrap, this)
}
