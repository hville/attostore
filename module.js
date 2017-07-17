// @ts-check
import {Store} from './src/_store'

/**
 * @param {*} initValue
 * @param {Object} commands
 * @return {Store}
 */
export function createStore(initValue, commands) {
	return new Store(initValue, commands)
}

export {changedKeys, missingKeys} from './src/compare'
export {Store} from './src/_store'
