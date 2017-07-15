/**
 * @constructor
 * @param {*} [data]
 */
export function Trie(data) {
	this._ks = new Map
	this._fs = []
	this.data = data
}
