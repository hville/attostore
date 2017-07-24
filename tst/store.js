var S = require( '../index' ),
		t = require('cotest')

var Store = S.Store,
		changed = S.changedKeys,
		missing = S.missingKeys

function compare(v,k,o) {
	t('!==', v, o, 'child event only if value changed: ')
	t('===', k === null || typeof k === 'string', true, 'child event only if value changed: '+k)
	if (this) {
		t('{==}', missing(v,o), this[0], 'added keys')
		t('{==}', changed(v,o), this[1], 'changed keys'+v+'|'+o)// TODO keys string vs No
		t('{==}', missing(o,v), this[2], 'deleted keys')
	}
}

t('ref - added keys', function() {
	var store = new Store({})

	store.once('aa',compare, [['bb','b'],[],[]])
	store.once('aa/bb', compare, [['cc','c'],[],[]])
	store.once('aa/bb/cc', compare, [[],[],[]])
	store.on('',compare, [['aa','a'],[],[]])

	t('!', store.set(null, {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'}), 'no errors')
	t('{===}', store.data, {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})
})


t('ref - del keys', function() {
	var store = new Store(null)
	store.run([{data:{aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'}}])

	store.once('aa', compare, [[],[],['bb','b']])
	store.once('aa/bb', compare, [[],[],['cc','c']])
	store.once('aa/bb/cc',compare, [[],[],[]])
	store.on('',compare, [[],[],['aa','a']])

	t('!', store.run([{}]))
	t('{===}', store.data, undefined)
})

t('auto purge trie', function() {
	var store = new Store(null)
	function noop(){}
	t('===', store._ks.size, 0)
	store.on('aa/bb', noop)
	t('===', store._ks.size, 1)
	t('===', store._ks.get('aa')._ks.size, 1)
	t('===', store._ks.get('aa')._ks.get('bb')._ks.size, 0)
	store.off('aa/bb', noop)
	t('===', store._ks.size, 0)
})

t('db - query', function() {
	var store = new Store(null)
	store.set('', {data: {list: [1,0]}, view:{}, acts:{}, done:[]})

	store.on('data/list', function(v) {
		store.run([{path:'view/sort', data:v.slice().sort()}])
	})
	store.on('acts/push', function(v) {
		store.run([{path:'data/list', data:store.get('data/list').concat(v)}])
	})

	store.once('data/list',compare, [[2],[],[]])
	store.once('view/sort',compare, [[0,1,2],[],[]])
	store.once('acts/push',compare, [[],[],[]])

	t('!', store.set('acts/push', 9))
	t('{===}', store.data.data.list, [1,0,9])//[1,0]
	t('{===}', store.data.view.sort, [0,1,9])//undefined
	t('{===}', store.data.acts.push, 9)
})

t('store - errors', function() {
	var store = new Store(null)

	store.on('', function() {
		t('!', true, 'should never be called')
	})

	t('===', store.set('a/b', 9) instanceof Error, true)
	t('===', store.set('a/b') instanceof Error, true)
	var res = store.run([{path:'a/b', data:9}])
	t('===', res instanceof Error && res.message, 'invalid path: a/b')
})
