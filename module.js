// @ts-check
import {Ref} from './src/_ref'

export default function db(initValue) {
	return new Ref({
		state: initValue || {},
		error: '',
		event: {
			dtree: Object.create(null),
			child: new WeakMap,
			value: new WeakMap,
		}
	}, [])
}
