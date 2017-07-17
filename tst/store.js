var S = require( '../index' ),
		t = require('cotest')

var create = S.createStore,
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
	var store = create({}, {
		init: function(v) { this.set('', v) }
	})

	store.once('aa',compare, [['bb','b'],[],[]])
	store.once('aa/bb', compare, [['cc','c'],[],[]])
	store.once('aa/bb/cc', compare, [[],[],[]])
	store.on('',compare, [['aa','a'],[],[]])

	t('!', store.run('init', {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'}), 'no errors')
	t('{===}', store.data, {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})
})


t('ref - del keys', function() {
	var store = create(null, {
		init: function(v) { this.set([], v) },
		clear: function() { this.delete() }
	})
	store.run('init', {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})

	store.once('aa', compare, [[],[],['bb','b']])
	store.once('aa/bb', compare, [[],[],['cc','c']])
	store.once('aa/bb/cc',compare, [[],[],[]])
	store.on('',compare, [[],[],['aa','a']])

	t('!', store.run('clear'))
	t('{===}', store.data, undefined)
})

t('auto purge trie', function() {
	var store = create(null, {
		init: function(v) { this.set(null, v) },
		set: function(p,v) { this.set(p,v) },
		clear: function() { this.delete() }
	})
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
	var store = create(null, {
		init: function(v) { this.set(null, v) },
		set: function(p,v) { this.set(p,v) },
		clear: function() { this.delete() }
	})
	store.run('init', {data: {list: [1,0]}, view:{}, acts:{}, done:[]})

	store.on('data/list', function(v) {
		store.run('set', 'view/sort', v.slice().sort())
	})
	store.on('acts/push', function(v) {
		store.run('set', 'data/list', store.get('data/list').concat(v))
	})

	store.once('data/list',compare, [[2],[],[]])
	store.once('view/sort',compare, [[0,1,2],[],[]])
	store.once('acts/push',compare, [[],[],[]])

	t('!', store.run('set', 'acts/push', 9))
	t('{===}', store.data.data.list, [1,0,9])//[1,0]
	t('{===}', store.data.view.sort, [0,1,9])//undefined
	t('{===}', store.data.acts.push, 9)
})


t('store - commands', function() {
	var commands = {
				init: function() { this.set('', {}) },
				yell: function(x) { this.set('yell', !!x) },
				sing: function(x) { this.set('sing', !!x) },
				stop: function() { this.delete('yell').delete('sing') }
			},
			store = create(null, commands),
			expected = {newVal:{}, oldVal: null}

	store.on('', function(v,k,o) {
		t('===', this, store)
		t('{===}', v, expected.newVal)
		t('===', k, null)
		t('{===}', o, expected.oldVal)
		t('{===}', store.data, expected.newVal)
	}, store)
	store.run('init')
	expected = {newVal:{yell:true}, oldVal:{}}
	store.run('yell', true)
	expected = {newVal:{yell:true, sing:true}, oldVal:{yell:true}}
	store.run('sing', 2)
	expected = {newVal:{}, oldVal:{yell:true, sing:true}}
	store.run('stop')
})


t('store - errors', function() {
	var store = create(null, {
		set: function(p,v) { this.set(p,v) },
		del: function(p) { this.delete(p) }
	})

	store.on('', function() {
		t('!', true, 'should never be called')
	})

	t('===', store.run('set', 'a/b', 9) instanceof Error, true)
	t('===', store.run('del', 'a/b') instanceof Error, true)
	var res = store.run('set', 'a/b', 9)
	t('===', res instanceof Error && res.message, 'invalid path: a/b')
})
