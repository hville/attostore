import {cType} from './type'

export function pathKeys(path) {
	return Array.isArray(path) ? path : (path && path.split) ? path.split('.') : cType(path) === Number ? [path] : []
}
