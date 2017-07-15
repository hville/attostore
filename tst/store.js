var S = require( '../index' ),
		t = require('cotest')

var create = S.createStore,
		changed = S.changedKeys,
		missing = S.missingKeys,
		op = S.createOperation

function compare(v,k,o) {
	t('!==', v, o, 'child event only if value changed: ')
	t('===', k === null || typeof k === 'string', true, 'child event only if value changed: ')
	if (this) {
		t('{==}', missing(v,o), this[0], 'added keys')
		t('{==}', changed(v,o), this[1], 'changed keys'+v+'|'+o)// TODO keys string vs No
		t('{==}', missing(o,v), this[2], 'deleted keys')
	}
}

t('ref - added keys', function() {
	var store = create()

	store.once('aa',compare, [['bb','b'],[],[]])
	store.once('aa/bb', compare, [['cc','c'],[],[]])
	store.once('aa/bb/cc', compare, [[],[],[]])
	store.on('',compare, [['aa','a'],[],[]])

	t('!', store.run([{data: {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'}}]), 'no errors')
	t('{===}', store.data, {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})
})


t('ref - del keys', function() {
	var store = create({aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})

	store.once('aa', compare, [[],[],['bb','b']])
	store.once('aa/bb', compare, [[],[],['cc','c']])
	store.once('aa/bb/cc',compare, [[],[],[]])
	store.on('',compare, [[],[],['aa','a']])

	t('!', store.delete())
	t('{===}', store.data, undefined)
})

t('auto purge trie', function() {
	var store = create()
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
	var store = create({data: {list: [1,0]}, view:{}, acts:{}, done:[]})

	store.on('data/list', function(v) {
		store.set('view/sort', v.slice().sort())
	})
	store.on('acts/push', function(v) {
		store.run([{path: 'data/list', data: store.get('data/list').concat(v)}])
	})

	store.once('data/list',compare, [[2],[],[]])
	store.once('view/sort',compare, [[0,1,2],[],[]])
	store.once('acts/push',compare, [[],[],[]])

	t('!', store.run([{path: 'acts/push', data: 9}]))
	t('{===}', store.data.data.list, [1,0,9])//[1,0]
	t('{===}', store.data.view.sort, [0,1,9])//undefined
	t('{===}', store.data.acts.push, 9)
})


t('store - commands', function() {
	var commands = {
				init: function() { return op('', {}) },
				yell: function(x) { return op('yell', !!x) },
				sing: function(x) { return op('sing', !!x) },
				stop: function() { return [op('yell', false), op('sing', false)] }
			},
			store = create(null, commands),
			expected = {newVal:{}, oldVal: null}

	store.on('', function(v,k,o) {
		t('===', this, store)
		t('{===}', v, expected.newVal)
		t('===', k, null)
		t('{===}', o, expected.oldVal)
		t('{===}', store.data, expected.newVal)
	})
	store.act('init')
	expected = {newVal:{yell:true}, oldVal:{}}
	store.act('yell', true)
	expected = {newVal:{yell:true, sing:true}, oldVal:{yell:true}}
	store.act('sing', 2)
	expected = {newVal:{yell:false, sing:false}, oldVal:{yell:true, sing:true}}
	store.act('stop')
})


t('store - errors', function() {
	var initVal = {},
			commands = { init: function() { return op('', {}) } },
			store = create(initVal, commands)

	store.on('', function() {
		t('!', true, 'should never be called')
	})

	t('===', store.set('a/b', 9) instanceof Error, true)
	t('===', store.delete('a/b') instanceof Error, true)
	t('===', store.act('a/b', 9) instanceof Error, true)
	t('===', store.run({path:'a/b'}) instanceof Error, true)
})
