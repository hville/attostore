// @ts-check
import {Ref} from './src/_ref'
import {Store} from './src/_store'

export default function db(initValue) {
	return new Ref(new Store(initValue), [])
}
