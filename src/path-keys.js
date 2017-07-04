import {cType} from './type'

export function pathKeys(path) {
	var ct = cType(path)
	return ct === Array ? path : ct === Number ? [path] : !path ? [] : path.split('/')
}
