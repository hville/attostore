// @ts-check
import {Store} from './src/_store'

export default function db(value) {
	return (new Store(value)).ref()
}
