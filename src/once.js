export function once(key, fcn, ctx) {
	function wrapped(a,b,c,d) {
		this.off(key, wrapped, this)
		fcn.call(ctx || this, a,b,c,d)
	}
	return this.on(key, wrapped, this)
}
