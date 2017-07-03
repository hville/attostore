# attodom

*small async json in-memory store with cursors and events, < 3kb min, < 2kb gz*

• [Example](#example) • [Why](#why) • [API](#api) • [License](#license)

## Examples

```javascript
import create from 'attostore'

var store = create({
  a: 'myInitValue',
  b:{c: 'myNestedValue'}
})

store.on('b.c', function(val, old) {
  console.log('key "c" changed from',old.c,'to',val.c)
})

store.set('b.c', 'newValue', function(err, acts) {
  if (!err) console.log(patch && patch.length ? 'changed' : 'not changed')
})

store.patch([{path: ['b', 'c'], data:'anotherValue'}], function(err, acts) {
  if (!err && acts) console.log(acts.length 'changes')
})
```

supports different environments
* CJS: `var create = require('attostore').createStore`
* ES modules: `import {createStore} from 'attostore'`
* browser: `var create = window.attostore.createStore`


### Features and Limitations

* ~~set operations are async to let other external queued operation first~~
* available in CommonJS, ES6 modules and browser versions
* ~~no Promise polyfill included. Not required if callbacks are provided~~
* only the last item of an Array can be deleted to avoid shifting of keys
* only JSON types supported (Array, Object, string, number, boolean, null)

## API

attostore(initValue: `any`): `Store`

### Store

.patch(acts: `Array`, ondone: `(err, acts) => void`]): `void`
.set(path: `Path`, value: `any`, ondone: `(err, acts) => void`): `void`
.set(path: `Path`, value: `any`): `Promise`
.delete(path: `Path`, ondone: `(err, acts) => void`): `void`
.delete(path: `Path`): `Promise`

.on(path: `Path`, handler: `(val, old, key)=>void`, [, context: `any`]): `Ref`
.once(path: `Path`, handler: `(val, old, key)=>void`, [, context: `any`]): `Ref`
.off(path: `Path`, handler: `(val, old, key)=>void`, [, context: `any`]): `Ref`

### Path

`Array|string|number`
* `0`, `"0"`, `[0]`, `["0"]` are equivalent
* `''`, `null`, `undefined` are equivalent
* `a/b`, `["a", "b"]` are equivalent
* wildcards can be used for listeners: `ref.on('*/id', cb)`

### Acts

Simple patch format for atomic changes:
* array of keys or string path: `[{path: 'a/b/c', v: 'abc'}, {path:['a','b','c']}]`
* set if a value is present, delete is the value is missing


### Gotcha

* No Array splicing to keep the keys unchanged. additions and removals from the end only (eg. push pop)


## License

[MIT](http://www.opensource.org/licenses/MIT) © [Hugo Villeneuve](https://github.com/hville)
