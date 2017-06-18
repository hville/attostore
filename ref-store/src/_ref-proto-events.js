export function _fire(last) {
	var subs = this._subs
	for (var i=0; i<subs.length; ++i) subs[i].f.call(subs[i].c, this.data, last)
}

export function _indexOfHandler(handler, context) {
	for (var i=0, subs=this._subs; i<subs.length; ++i) {
		if (subs[i].f === handler && subs[i].c === (context || this)) return i
	}
	return -1
}

export function on(handler, context) {
	if (this._indexOfHandler(handler, context) === -1) this._subs.push({f: handler, c: context || this})
	return this
}

export function off(handler, context) {
	var i = this._indexOfHandler(handler, context)
	if (i !== -1) this._subs.splice(i, 1)
	return this
}

export function once(handler, context) {
	function wrapped(data, last) {
		this.off(wrapped, this)
		handler.call(context || this, data, last)
	}
	return this.on(wrapped, this)
}
