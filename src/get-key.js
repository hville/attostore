import {isObj} from './type'

export function getKey(obj, key) {
	if (isObj(obj)) return obj[key]
}
