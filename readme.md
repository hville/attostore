# attodom

*small json in-memory store with path events, ~3kb min, ~1kb gz*

• [Example](#example) • [Why](#why) • [API](#api) • [License](#license)

## Examples

```javascript
import {createStore, setOperation, delOperation} from 'attostore'

var store = create({}, {
  yell: function(name) { this.set('yell', name) },
  sing: function(name) { this.set('sing', name) },
  stop: function() { this.delete('yell').delete('sing')] },
})

store.on('yell', function(val, key, old) {
  console.log(val ? 'yelling '+val : 'being quiet')
})

store.run('yell', 'YO!')
store.run('stop')
```

supports different environments
* CJS: `var create = require('attostore').createStore`
* ES modules: `import {createStore} from 'attostore'`
* browser: `var create = window.attostore.createStore`


### Features, Limitations, Gotcha

* available in CommonJS, ES6 modules and browser versions
* only the last item of an Array can be deleted to avoid shifting of keys
* No Array splicing to keep the keys unchanged. additions and removals from the end only (eg. push pop)
* only JSON types supported (Array, Object, string, number, boolean, null)
* set triggers a deletion if the value is undefined and/or absent


## API

createStore(initValue: `any`, commands: `{commandName: Command}`): `Store`

### Store

.on(path: `Path`, handler: `(val, key, old, key)=>void`, [, context: `any`]): `Ref`
.once(path: `Path`, handler: `(val, key, old, key)=>void`, [, context: `any`]): `Ref`
.off(path: `Path`, handler: `(val, key, old, key)=>void`, [, context: `any`]): `Ref`
.run(commandName: `string`, ...args: `any`): `Error|void`


### Command

`(this:{set, delete, get}, any) => void`


### Path

`Array|string|number`
* `0`, `"0"`, `[0]`, `["0"]` are equivalent
* `''`, `null`, `undefined` are equivalent
* `a/b`, `["a", "b"]` are equivalent

## License

[MIT](http://www.opensource.org/licenses/MIT) © [Hugo Villeneuve](https://github.com/hville)
