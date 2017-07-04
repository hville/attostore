var S = require( '../index' ),
		t = require('cotest')

var create = S.createStore,
		changed = S.changedKeys,
		missing = S.missingKeys

function compare(v,o) {
	t('!==', v, o, 'child event only if value changed: ')
	if (this) {
		t('{==}', missing(v,o), this[0], 'added keys')
		t('{==}', changed(v,o), this[1], 'changed keys'+v+'|'+o)// TODO keys string vs No
		t('{==}', missing(o,v), this[2], 'deleted keys')
	}
}

t('ref - added keys', function(end) {
	var store = create()

	store.once('aa',compare, [['bb','b'],[],[]])
	store.once('aa/bb', compare, [['cc','c'],[],[]])
	store.once('aa/bb/cc', compare, [[],[],[]])
	store.on('',compare, [['aa','a'],[],[]])

	store.set([{val: {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'}}], function(err) {
		t('!', err)
		t('{===}', store.data, {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})
		end()
	})
})

t('ref - del keys', function(end) {
	var store = create({aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})

	store.once('aa', compare, [[],[],['bb','b']])
	store.once('aa/bb', compare, [[],[],['cc','c']])
	store.once('aa/bb/cc',compare, [[],[],[]])
	store.on('',compare, [[],[],['aa','a']])

	store.set({},function(err) {
		t('!', err)
		t('{===}', store.data, undefined)
		end()
	})
})

t('db - query', function(end) {
	var store = create({data: {list: [1,0]}, view:{}, acts:{}, done:[]})

	store.on('data/list', function(v) {
		store.set({key:'view/sort', val: v.slice().sort()})
	})
	store.on('acts/push', function(v) {
		store.set([{key: 'data/list', val: store.get('data/list').concat(v)}])
	})

	store.once('data/list',compare, [[2],[],[]])
	store.once('view/sort',compare, [[0,1,2],[],[]])
	store.once('acts/push',compare, [[],[],[]])

	store.set({key: 'acts/push', val: 9}, function(err) {
		t('!', err)
		t('{===}', store.data.data.list, [1,0,9])//[1,0]
		t('{===}', store.data.view.sort, [0,1,9])//undefined
		t('{===}', store.data.acts.push, 9)
		end()
	})
})

t('db - actions', function() {
	var store = create(),
			history = [],
			actions = {
				init: function() { return { val:[] }},
				push: function(v) { var arr = this.get(); return {key: arr.length, val: v}}
			},
			expected = {newVal:[], oldVal:undefined, history:[]}

	store.act = function(name, val) {
		this.set(actions[name].call(this, val), function(err, res) {
			if (!err && !res) return
			var act = {act: name}
			if (val !== undefined) act.arg = val
			if (err) act.err = err.message
			history.push(act)
		})
	}
	store.on('', function(v,o) {
		t('{===}', v, expected.newVal)
		t('{===}', o, expected.oldVal)
		t('{===}', history, expected.history)
		t('{===}', store.data, expected.newVal)
	})
	store.act('init')
	expected = {newVal:[4], oldVal:[], history:[{act: 'init'}]}
	store.act('push', 4)
	expected = {newVal:[4,2], oldVal:[4], history:[{act: 'init'}, {act: 'push', arg:4}]}
	store.act('push', 2)
})
