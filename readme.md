# attodom

*small async json in-memory store with path events, ~3kb min, ~1kb gz*

• [Example](#example) • [Why](#why) • [API](#api) • [License](#license)

## Examples

```javascript
import create from 'attostore'

var store = create({
  a: 'myInitValue',
  b:{c: 'myNestedValue'}
})

store.on('b/c', function(val, key, old) {
  console.log('key',key,'changed from',old.c,'to',val.c)
})

store.set({key: ['b', 'c'], val: 'newValue'}, function(err, act) {
  if (!err) console.log(!!act ? 'changed' : 'not changed')
})

store.set([{key: 'b/c', val:'anotherValue'}]).then(function(act) {
  if (act) console.log(act.length 'changes')
})
```

supports different environments
* CJS: `var create = require('attostore').createStore`
* ES modules: `import {createStore} from 'attostore'`
* browser: `var create = window.attostore.createStore`


### Features, Limitations, Gotcha

* available in CommonJS, ES6 modules and browser versions
* no Promise polyfill included. Not required if callbacks are provided to the set function
* only the last item of an Array can be deleted to avoid shifting of keys
* No Array splicing to keep the keys unchanged. additions and removals from the end only (eg. push pop)
* only JSON types supported (Array, Object, string, number, boolean, null)
* set triggers a deletion if the value is undefined and/or absent


## API

attostore(initValue: `any`): `Store`

### Store

.set(acts: `Action|Actions`, ondone: `(err, acts) => void`): `void`
.set(acts: `Action|Actions`): `Promise`

.on(path: `Path`, handler: `(val, key, old, key)=>void`, [, context: `any`]): `Ref`
.once(path: `Path`, handler: `(val, key, old, key)=>void`, [, context: `any`]): `Ref`
.off(path: `Path`, handler: `(val, key, old, key)=>void`, [, context: `any`]): `Ref`

### Acts

Simple patch format for atomic changes:
* single or multiple changes: `[{key: path, val: 'c'}]`, `{key: path, val: 'c'}`
* set if a value is present, delete is the value is missing or undefined
* the store is only changed if all actions pass without errors

### Path

`Array|string|number`
* `0`, `"0"`, `[0]`, `["0"]` are equivalent
* `''`, `null`, `undefined` are equivalent
* `a/b`, `["a", "b"]` are equivalent

## License

[MIT](http://www.opensource.org/licenses/MIT) © [Hugo Villeneuve](https://github.com/hville)
