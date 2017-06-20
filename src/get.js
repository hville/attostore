import {isObj} from './type'
//TODO g(a,b) vs o(a)?a[b]:void 0
export function getKey(obj, key) {
	if (isObj(obj)) return obj[key]
}
