# attodom

*small async json in-memory store with cursors and events, < 3kb min, < 2kb gz*

• [Example](#example) • [Why](#why) • [API](#api) • [License](#license)

## Examples

```javascript
import create from 'attostore'

var store = create({
  v: 'myInitValue',
  c:{v: 'myNestedValue'}
})

store.ref('c').on('child', function(val, old, key) {
  console.log('key',key,'changed')
})
store.ref(['c', 'v']).on('value', function(val, old) {
  console.log(old, 'changed to', val)
})
store.ref('c/x').on('value', function(val, old) {
  console.log(old, 'changed to', val)
})

store.ref(['c', 'x']).set('X').then(function(acts) {
  console.log('changes:', acts)
})
store.ref(['c', 'v']).set('yo', function(err, acts) {
  if (!err) console.log('changes:', acts)
})
```

supports different environments
* CJS: `var create = require('attostore')`
* ES modules: `import create from 'attostore'`
* browser: `var create = window.attostore`


### Features and Limitations

* set operations are async to let other external queued operation first
* event sequence: root child > leaf child > leaf value > root value
* available in CommonJS, ES6 modules and browser versions
* no Promise polyfill included. Not required if callbacks are provided
* only the last item of an Array can be deleted to avoid shifting of keys


## API

attostore(initValue: `any`): `Store`

### Store

store.ref(path: `Array|string`): `Ref`
store.patch(acts: `Array`, ondone: `(err, acts) => void`]): `void`
store.patch(acts: `Array`): `Promise`
store.patchSync(acts: `Array`, ondone: `(err, acts) => void`]): `void`
store.patchSync(acts: `Array`): `Promise`


### Ref

ref.keys: `Array`
ref.path: `string`
ref.root: `Ref`
ref.parent: `Ref`
ref.set(value: `any`, ondone: `(err, acts) => void`): `void`
ref.set(value: `any`): `Promise`
ref.del(ondone: `(err, acts) => void`): `void`
ref.on(name: `string`, handler: `(val, old, key)=>void`, [, context: `any`]): `Ref`
ref.once(name: `string`, handler: `(val, old, key)=>void`, [, context: `any`]): `Ref`
ref.off(name: `string`, handler: `(val, old, key)=>void`, [, context: `any`]): `Ref`


### Acts

Simple patch format for atomic changes:
* array of keys or string path: `[{k: 'a/b/c', v: 'abc'}, {k:['a','b','c']}]`
* set if a value is present, delete is the value is missing


### Gotcha

* No Array splicing to keep the keys unchanges. additions and removals from the end only (eg. push pop)


## License

[MIT](http://www.opensource.org/licenses/MIT) © [Hugo Villeneuve](https://github.com/hville)
