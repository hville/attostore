// @ts-check
export {changedKeys, missingKeys} from './src/compare'

// @ts-check
import {Store} from './src/_store'

export function createStore(initialValue) {
	return new Store(initialValue)
}
