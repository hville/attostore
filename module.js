// @ts-check
import {Store} from './src/_store'

/**
 * @param {*} [initialValue]
 * @param {Object} [commands]
 * @return {Store}
 */
export function createStore(initialValue, commands) {
	return new Store(initialValue, commands)
}

export {changedKeys, missingKeys} from './src/compare'
export {Store} from './src/_store'
export {setOperation, delOperation} from './src/_store-ops'
