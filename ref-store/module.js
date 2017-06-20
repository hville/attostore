// @ts-check
import {Ref} from './src/_ref'
import {setKey} from './src/key-set'

export default function db(value) {
	return new Ref({
		_val: value,
		_set: _set,
		_get: _get

	}, null, value)
}

function _set() { return this.value }
