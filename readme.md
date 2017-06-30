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

store.ref().on('b/*', function(val, old, key, obj) {
  console.log('key "c" changed')
})

store.ref(['b', 'c']).on('', function(val, old, key, obj) {
  console.log('key "c" changed')
})

store.ref('b/c').set('newValue').then(function(patch) {
  console.log(patch && patch.length ? 'changed' : 'not changed')
})

store.ref(['b', 'c']).set('anotherValue', function(err, acts) {
  if (!err) console.log(patch && patch.length ? 'changed' : 'not changed')
})
```

supports different environments
* CJS: `var create = require('attostore')`
* ES modules: `import create from 'attostore'`
* browser: `var create = window.attostore`


### Features and Limitations

* set operations are async to let other external queued operation first
* available in CommonJS, ES6 modules and browser versions
* no Promise polyfill included. Not required if callbacks are provided
* only the last item of an Array can be deleted to avoid shifting of keys


## API

attostore(initValue: `any`): `Store`

### Store

store.ref(path: `Array|string|number`): `Ref`
store.patch(acts: `Array`, ondone: `(err, acts) => void`]): `void`

### Ref

ref.root: `Ref`
ref.parent: `Ref`

ref.keys(path: `Path`): `Array`

ref.set(path: `Path`, value: `any`, ondone: `(err, acts) => void`): `void`
ref.set(path: `Path`, value: `any`): `Promise`
ref.del(path: `Path`, ondone: `(err, acts) => void`): `void`
ref.del(path: `Path`): `Promise`

ref.on(path: `Path`, handler: `(val, old, key)=>void`, [, context: `any`]): `Ref`
ref.once(path: `Path`, handler: `(val, old, key)=>void`, [, context: `any`]): `Ref`
ref.off(path: `Path`, handler: `(val, old, key)=>void`, [, context: `any`]): `Ref`

ref.query(transform: `any => any`): `Query`

### Query

query.on(path: `Path`, handler: `(val, old, key)=>void`, [, context: `any`]): `Ref`
query.once(path: `Path`, handler: `(val, old, key)=>void`, [, context: `any`]): `Ref`
query.off(path: `Path`, handler: `(val, old, key)=>void`, [, context: `any`]): `Ref`

### Path

`Array|string|number`
* `0`, `"0"`, `[0]`, `["0"]` are equivalent
* `''`, `null`, `undefined` are equivalent
* `a/b`, `["a", "b"]` are equivalent
* wildcards can be used for listeners: `ref.on('*/id', cb)`

### Acts

Simple patch format for atomic changes:
* array of keys or string path: `[{k: 'a/b/c', v: 'abc'}, {k:['a','b','c']}]`
* set if a value is present, delete is the value is missing


### Gotcha

* No Array splicing to keep the keys unchanged. additions and removals from the end only (eg. push pop)


## License

[MIT](http://www.opensource.org/licenses/MIT) © [Hugo Villeneuve](https://github.com/hville)
