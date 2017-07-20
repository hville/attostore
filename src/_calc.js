export function Calc(updater, sources) {
	this._ss = sources //all sources
	this.__f = updater
	this.__v = undefined
	//registration
	this._ts = [] // only primary targets
	if (sources) for (var i=0; i<sources.length; ++i) {
		var last = true
		for (var j=0; j<sources.length; ++j) if (j !== i && !notSource.call(sources[i], sources[j])) last = false
		if (last) sources[i]._ts.push(this)
	}
}

Calc.prototype.get = function() { return this.__v }

function update(tgt) {
	tgt.__v = tgt.__f.apply(null, tgt._ss.map(value))
}
function updateAll(tgts) {
	return tgts.reduce(updateRed, [])
}
function updateRed(deps, item) {
	update(item)
	return item._ts.reduce(uniqRed, deps)
}
function uniqRed(arr, itm) {
	if (arr.indexOf(itm) === -1) arr.push(itm)
	return arr
}
Calc.prototype.set = function(v) {
	this.__v = v
	var deps = this._ts
	while(deps.length) deps = updateAll(deps)
}
function hasSource(src) {
	return src === this ? true : !this._ss ? false : this._ss.some(hasSource, src)
}
function notSource(tgt) {
	return tgt === this ? false : !this._ts.some(hasSource, tgt)
}
function value(chain) {
	return chain.__v
}
