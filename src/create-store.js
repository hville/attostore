// @ts-check
import {Trie} from './_trie'

export function createStore(initialValue) {
	return new Trie(initialValue)
}
