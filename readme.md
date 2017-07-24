# attodom

*small json in-memory store with path events, ~3kb min, ~1kb gz*

• [Example](#example) • [Why](#why) • [API](#api) • [License](#license)

## Examples

```javascript
import {Store} from 'attostore'

var store = new Store({})

store.on('a/b', function(val, key, old) {
  console.log('changed', key, 'from', old, 'to', val)
})

store.run([{path:'a/b', data:'hello'}])
store.set(['a', 'b'], data:'world')
```

supports different environments
* CJS: `var create = require('attostore').createStore`
* ES modules: `import {createStore} from 'attostore'`


### Features, Limitations, Gotcha

* available in CommonJS and ES6 modules
* only the last item of an Array can be deleted to avoid shifting of keys
* No Array splicing to keep the keys unchanged. additions and removals from the end only (eg. push pop)
* only JSON types supported (Array, Object, string, number, boolean, null)
* set triggers a deletion if the value is undefined and/or absent


## API

new Store(initValue: `any`): `Store`

### Store

.on(path: `Path`, handler: `(val, key, old, key)=>void`, [, context: `any`]): `Ref`
.once(path: `Path`, handler: `(val, key, old, key)=>void`, [, context: `any`]): `Ref`
.off(path: `Path`, handler: `(val, key, old, key)=>void`, [, context: `any`]): `Ref`
.run(commandName: `string`, ...args: `any`): `Error|void`
.get(path: `Path`): `any`
.run(command[]): `Error|void`
.set(path: `Path` [, data: `any`]): `Error|void`


### Command

`{path: Path, data: any}`


### Path

`Array|string|number`
* `0`, `"0"`, `[0]`, `["0"]` are equivalent
* `''`, `null`, `undefined` are equivalent
* `a/b`, `["a", "b"]` are equivalent

## License

[MIT](http://www.opensource.org/licenses/MIT) © [Hugo Villeneuve](https://github.com/hville)
