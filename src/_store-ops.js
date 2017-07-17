/**
 * @param {null|string|Array} path
 * @param {*} [data]
 * @return {Object}
 */
export function setOperation(path, data) {
	if (path === undefined || data === undefined) throw Error('undefined argument')
	return {p: path, v: data}
}

/**
 * @param {null|string|Array} path
 * @return {Object}
 */
export function delOperation(path) {
	if (path === undefined) throw Error('undefined argument')
	return {p: path == null ? '' : path}
}

/**
 * @param {string} name
 * @param {*} [data]
 * @return {Error|void}
 */
export function run(name, data) {
	var ops = this._cs[name] && this._cs[name](data)
	if (!ops) return Error('invalid command ' + name)
	return this.run(ops)
}
